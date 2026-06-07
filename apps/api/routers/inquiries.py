import asyncio
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from models.inquiry import Inquiry, InquiryCreate, InquiryStatusUpdate
from auth import get_current_user, get_admin_user
from routers.notifications import create_notification
from services import email as email_svc

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.get("", response_model=list[Inquiry])
async def list_my_inquiries(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT i.* FROM inquiries i
            JOIN brands b ON b.id = i.brand_id
            WHERE b.user_id = $1
            ORDER BY i.created_at DESC
            """,
            user["id"],
        )
    return [Inquiry(**dict(r)) for r in rows]


@router.post("", response_model=Inquiry)
async def create_inquiry(data: InquiryCreate, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow(
            "SELECT id, company_name FROM brands WHERE user_id = $1", user["id"]
        )
        if not brand:
            raise HTTPException(status_code=404, detail="Complete your brand profile first")

        talent = await conn.fetchrow(
            "SELECT id, name, email FROM talents WHERE id = $1 AND is_published = TRUE",
            data.talent_id,
        )
        if not talent:
            raise HTTPException(status_code=404, detail="Talent not found")

        row = await conn.fetchrow(
            """
            INSERT INTO inquiries (brand_id, talent_id, campaign_name, campaign_type,
              brief_text, budget_range, preferred_dates, remuneration_type, product_description,
              project_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *
            """,
            brand["id"], data.talent_id, data.campaign_name, data.campaign_type,
            data.brief_text, data.budget_range, data.preferred_dates,
            data.remuneration_type or "product", data.product_description,
            str(data.project_id) if data.project_id else None,
        )

    inquiry = Inquiry(**dict(row))
    brand_name = brand["company_name"]
    talent_name = talent["name"]
    brand_email = user.get("email", "")

    # Fire notifications in background - never block the response
    async def _notify():
        # In-app: confirm to brand that inquiry was received
        await create_notification(
            user_id=user["id"],
            type_="inquiry_submitted",
            title=f"Inquiry sent to {talent_name}",
            body=f'Your inquiry for "{data.campaign_name}" has been received. We\'ll review it shortly.',
            link="/inquiries",
        )
        # Email brand confirmation
        if brand_email:
            await email_svc.email_brand_inquiry_received(brand_email, brand_name, talent_name, data.campaign_name)
        # Email talent (if they have an email on file)
        if talent["email"]:
            await email_svc.email_talent_inquiry_received(
                to=talent["email"],
                talent_name=talent_name,
                brand_name=brand_name,
                campaign_name=data.campaign_name,
                campaign_type=data.campaign_type or "",
                brief_text=data.brief_text or "",
            )

    asyncio.create_task(_notify())
    return inquiry


@router.patch("/{inquiry_id}/status", response_model=Inquiry)
async def update_inquiry_status(
    inquiry_id: UUID,
    data: InquiryStatusUpdate,
    _: dict = Depends(get_admin_user),
):
    valid_statuses = {"open", "reviewing", "confirmed", "closed"}
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *",
            data.status, inquiry_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        # Fetch brand user_id + email + company name, and talent name + email
        details = await conn.fetchrow(
            """
            SELECT b.user_id, b.email AS brand_email, b.company_name,
                   t.name AS talent_name, t.email AS talent_email,
                   i.campaign_name
            FROM inquiries i
            JOIN brands b ON b.id = i.brand_id
            JOIN talents t ON t.id = i.talent_id
            WHERE i.id = $1
            """,
            inquiry_id,
        )
        brand_user_id = details["user_id"] if details else None
        brand_email = details["brand_email"] if details else None
        brand_name = details["company_name"] if details else ""
        talent_name = details["talent_name"] if details else ""
        talent_email = details["talent_email"] if details else None
        campaign_name = details["campaign_name"] if details else ""

    inquiry = Inquiry(**dict(row))

    async def _notify():
        if not brand_user_id:
            return
        status_titles = {
            "reviewing": f"Your inquiry for {talent_name} is being reviewed",
            "confirmed": f"Booking confirmed - {talent_name}",
            "closed":    f"Your inquiry for {talent_name} has been closed",
        }
        status_bodies = {
            "reviewing": f'We\'re reviewing your "{campaign_name}" inquiry. Hang tight.',
            "confirmed": f'Great news! Your booking for "{campaign_name}" with {talent_name} is confirmed.',
            "closed":    f'Your inquiry "{campaign_name}" has been closed.',
        }
        if data.status in status_titles:
            await create_notification(
                user_id=brand_user_id,
                type_=f"inquiry_{data.status}",
                title=status_titles[data.status],
                body=status_bodies[data.status],
                link="/inquiries",
            )
        # Email brand on status change
        if brand_email and data.status in {"reviewing", "confirmed", "closed"}:
            await email_svc.email_brand_status_changed(
                to=brand_email,
                brand_name=brand_name,
                talent_name=talent_name,
                campaign_name=campaign_name,
                new_status=data.status,
            )
        # Email talent on confirmation
        if data.status == "confirmed" and talent_email:
            await email_svc.email_talent_confirmed(
                to=talent_email,
                talent_name=talent_name,
                brand_name=brand_name,
                campaign_name=campaign_name,
                brief_text="",
            )

    asyncio.create_task(_notify())

    # Auto-create campaign when inquiry is confirmed (idempotent: skip if one exists)
    if data.status == "confirmed":
        async def _create_campaign():
            try:
                pool2 = await get_pool()
                async with pool2.acquire() as conn2:
                    # Don't create duplicate campaigns for the same inquiry
                    existing = await conn2.fetchval(
                        "SELECT id FROM campaigns WHERE inquiry_id = $1", str(inquiry_id)
                    )
                    if existing:
                        return
                    inq = await conn2.fetchrow(
                        "SELECT * FROM inquiries WHERE id = $1", str(inquiry_id)
                    )
                    if not inq:
                        return
                    await conn2.execute(
                        """
                        INSERT INTO campaigns (inquiry_id, brand_id, talent_id,
                          campaign_name, campaign_type, brief_text, shoot_date,
                          remuneration_type, project_id)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                        """,
                        str(inquiry_id),
                        str(inq["brand_id"]),
                        str(inq["talent_id"]),
                        inq["campaign_name"],
                        inq["campaign_type"],
                        inq["brief_text"],
                        inq["preferred_dates"],
                        inq.get("remuneration_type") or "product",
                        str(inq["project_id"]) if inq.get("project_id") else None,
                    )
            except Exception as e:
                print(f"[campaigns] auto-create error: {e}")
        asyncio.create_task(_create_campaign())

    return inquiry


# Admin: all inquiries
@router.get("/admin/all", response_model=list[dict])
async def admin_list_inquiries(_: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT i.*, b.company_name, t.name AS talent_name, t.ig_handle
            FROM inquiries i
            JOIN brands b ON b.id = i.brand_id
            JOIN talents t ON t.id = i.talent_id
            ORDER BY i.created_at DESC
            """
        )
    return [dict(r) for r in rows]
