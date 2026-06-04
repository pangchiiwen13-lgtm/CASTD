from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from models.inquiry import Inquiry, InquiryCreate, InquiryStatusUpdate
from auth import get_current_user, get_admin_user
from services.notifications import notify_new_inquiry

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
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(status_code=404, detail="Complete your brand profile first")

        talent = await conn.fetchrow(
            "SELECT id, name FROM talents WHERE id = $1 AND is_published = TRUE", data.talent_id
        )
        if not talent:
            raise HTTPException(status_code=404, detail="Talent not found")

        row = await conn.fetchrow(
            """
            INSERT INTO inquiries (brand_id, talent_id, campaign_name, campaign_type,
              brief_text, budget_range, preferred_dates)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
            """,
            brand["id"], data.talent_id, data.campaign_name, data.campaign_type,
            data.brief_text, data.budget_range, data.preferred_dates,
        )

    inquiry = Inquiry(**dict(row))
    await notify_new_inquiry(inquiry, user.get("name", ""), talent["name"])
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
            data.status,
            inquiry_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return Inquiry(**dict(row))


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
