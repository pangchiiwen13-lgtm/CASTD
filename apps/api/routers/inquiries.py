"""
Inquiry / offer flow (no admin approval required).

Brand -> Superstar:  brand sends offer, superstar accepts or declines.
Superstar -> Brand:  superstar applies to an open brand project, brand accepts or declines.

Status flow: pending -> accepted | declined | cancelled
"""
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from database import get_pool
from models.inquiry import Inquiry, InquiryCreate, InquiryStatusUpdate
from auth import get_current_user, get_admin_user
from routers.notifications import create_notification

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


class InquiryRespond(BaseModel):
    action: str   # "accept" | "decline"


class InquiryApply(BaseModel):
    note: Optional[str] = None   # optional message from superstar


def _make_campaign_coro(inquiry_id: str):
    """Return a coroutine that auto-creates a campaign from an accepted inquiry."""
    async def _run():
        try:
            pool2 = await get_pool()
            async with pool2.acquire() as conn2:
                existing = await conn2.fetchval(
                    "SELECT id FROM campaigns WHERE inquiry_id = $1", inquiry_id
                )
                if existing:
                    return
                inq = await conn2.fetchrow("SELECT * FROM inquiries WHERE id = $1", inquiry_id)
                if not inq:
                    return
                await conn2.execute(
                    """
                    INSERT INTO campaigns (inquiry_id, brand_id, talent_id,
                      campaign_name, campaign_type, brief_text, shoot_date,
                      remuneration_type, project_id)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                    """,
                    inquiry_id,
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
    return _run()


# ── Brand: send offer to a specific superstar ──────────────────────────────────

@router.post("", response_model=dict, status_code=201)
async def create_inquiry(data: InquiryCreate, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id, company_name FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(400, "Complete your brand profile first")
        talent = await conn.fetchrow(
            "SELECT id, name, user_id FROM talents WHERE id = $1 AND is_published = TRUE",
            data.talent_id,
        )
        if not talent:
            raise HTTPException(404, "Talent not found")

        row = await conn.fetchrow(
            """
            INSERT INTO inquiries (brand_id, talent_id, campaign_name, campaign_type,
              brief_text, budget_range, preferred_dates, remuneration_type, product_description,
              project_id, direction, status, initiator_user_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'brand_to_superstar','pending',$11)
            RETURNING *
            """,
            brand["id"], data.talent_id, data.campaign_name, data.campaign_type,
            data.brief_text, data.budget_range, data.preferred_dates,
            data.remuneration_type or "product", data.product_description,
            str(data.project_id) if data.project_id else None,
            user["id"],
        )

    inq = dict(row)

    # Notify superstar of incoming offer
    async def _notify():
        await create_notification(
            user_id=talent["user_id"],
            type_="offer_received",
            title=f"New offer from {brand['company_name']}",
            body=f'{brand["company_name"]} wants to hire you for "{data.campaign_name}". Accept or decline in your Offers.',
            link="/superstar/offers",
        )
    asyncio.create_task(_notify())

    return inq


# ── Superstar: apply to a brand's open campaign ────────────────────────────────

@router.post("/apply/{project_id}", response_model=dict, status_code=201)
async def apply_to_project(project_id: UUID, data: InquiryApply, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        talent = await conn.fetchrow(
            "SELECT id, name FROM talents WHERE user_id = $1", user["id"]
        )
        if not talent:
            raise HTTPException(400, "You need a Superstar profile to apply")

        project = await conn.fetchrow(
            "SELECT p.*, b.user_id AS brand_user_id FROM brand_projects p "
            "JOIN brands b ON b.id = p.brand_id "
            "WHERE p.id = $1 AND p.is_open = TRUE",
            str(project_id),
        )
        if not project:
            raise HTTPException(404, "Campaign not found or not open for applications")

        # Prevent duplicate pending application
        dup = await conn.fetchval(
            """SELECT id FROM inquiries
               WHERE talent_id = $1 AND project_id = $2
                 AND direction = 'superstar_to_brand' AND status = 'pending'""",
            str(talent["id"]), str(project_id),
        )
        if dup:
            raise HTTPException(400, "You have already applied to this campaign")

        row = await conn.fetchrow(
            """
            INSERT INTO inquiries (brand_id, talent_id, campaign_name, brief_text,
              remuneration_type, project_id, direction, status, initiator_user_id)
            VALUES ($1,$2,$3,$4,'product',$5,'superstar_to_brand','pending',$6)
            RETURNING *
            """,
            str(project["brand_id"]),
            str(talent["id"]),
            project["name"],
            data.note or f"{talent['name']} is interested in joining your campaign.",
            str(project_id),
            user["id"],
        )

    # Notify brand
    async def _notify():
        await create_notification(
            user_id=project["brand_user_id"],
            type_="application_received",
            title=f"{talent['name']} applied to your campaign",
            body=f'Review and accept or decline in your campaign: "{project["name"]}".',
            link=f"/campaigns/{project_id}",
        )
    asyncio.create_task(_notify())

    return dict(row)


# ── Accept or decline a received inquiry ──────────────────────────────────────

@router.post("/{inquiry_id}/respond", response_model=dict)
async def respond_to_inquiry(
    inquiry_id: UUID,
    data: InquiryRespond,
    user: dict = Depends(get_current_user),
):
    if data.action not in ("accept", "decline"):
        raise HTTPException(400, "action must be 'accept' or 'decline'")

    pool = await get_pool()
    async with pool.acquire() as conn:
        inq = await conn.fetchrow("SELECT * FROM inquiries WHERE id = $1", str(inquiry_id))
        if not inq:
            raise HTTPException(404, "Inquiry not found")

        d = dict(inq)
        if d["status"] != "pending":
            raise HTTPException(400, f"Cannot respond: inquiry is already '{d['status']}'")

        # Authorise: only the recipient may respond
        if d["direction"] == "brand_to_superstar":
            talent = await conn.fetchrow("SELECT id FROM talents WHERE user_id = $1", user["id"])
            if not talent or str(talent["id"]) != str(d["talent_id"]):
                raise HTTPException(403, "Only the recipient Superstar can respond")
            recipient_user_id = user["id"]
            sender_user_id    = d.get("initiator_user_id")
        else:
            brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
            if not brand or str(brand["id"]) != str(d["brand_id"]):
                raise HTTPException(403, "Only the recipient Brand can respond")
            recipient_user_id = user["id"]
            sender_user_id    = d.get("initiator_user_id")

        new_status = "accepted" if data.action == "accept" else "declined"
        now = datetime.now(timezone.utc)

        row = await conn.fetchrow(
            "UPDATE inquiries SET status=$1, responded_at=$2, updated_at=$2 WHERE id=$3 RETURNING *",
            new_status, now, str(inquiry_id),
        )

        # Gather names for notification
        brand_row  = await conn.fetchrow("SELECT company_name, user_id FROM brands  WHERE id = $1", str(d["brand_id"]))
        talent_row = await conn.fetchrow("SELECT name, user_id            FROM talents WHERE id = $1", str(d["talent_id"]))

    result = dict(row)

    # Notify the original sender
    async def _notify():
        if not sender_user_id:
            return
        campaign_name = d.get("campaign_name", "")
        if data.action == "accept":
            if d["direction"] == "brand_to_superstar":
                await create_notification(
                    user_id=sender_user_id,
                    type_="offer_accepted",
                    title=f"{talent_row['name']} accepted your offer!",
                    body=f'"{campaign_name}" is now active. Head to Campaigns to start chatting.',
                    link="/campaigns",
                )
            else:
                await create_notification(
                    user_id=sender_user_id,
                    type_="application_accepted",
                    title=f"{brand_row['company_name']} accepted your application!",
                    body=f'You have been added to "{campaign_name}". Head to Campaigns to start chatting.',
                    link="/superstar/campaigns",
                )
        else:
            if d["direction"] == "brand_to_superstar":
                await create_notification(
                    user_id=sender_user_id,
                    type_="offer_declined",
                    title=f"{talent_row['name']} declined your offer",
                    body=f'Your offer for "{campaign_name}" was declined.',
                    link="/inquiries",
                )
            else:
                await create_notification(
                    user_id=sender_user_id,
                    type_="application_declined",
                    title=f"{brand_row['company_name']} declined your application",
                    body=f'Your application for "{campaign_name}" was not accepted.',
                    link="/superstar/offers",
                )
    asyncio.create_task(_notify())

    if data.action == "accept":
        asyncio.create_task(_make_campaign_coro(str(inquiry_id)))

    return result


# ── List SENT inquiries (as initiator) ────────────────────────────────────────

@router.get("", response_model=list[dict])
async def list_my_inquiries(user: dict = Depends(get_current_user)):
    """Sent offers (brand) or sent applications (superstar)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand  = await conn.fetchrow("SELECT id FROM brands  WHERE user_id = $1", user["id"])
        talent = await conn.fetchrow("SELECT id FROM talents WHERE user_id = $1", user["id"])
        rows: list[dict] = []

        if brand:
            r = await conn.fetch(
                """
                SELECT i.*, b.company_name, t.name AS talent_name, t.ig_handle, t.photo_urls
                FROM inquiries i
                JOIN brands  b ON b.id = i.brand_id
                JOIN talents t ON t.id = i.talent_id
                WHERE i.brand_id = $1 AND i.direction = 'brand_to_superstar'
                ORDER BY i.created_at DESC
                """,
                brand["id"],
            )
            rows.extend([dict(x) for x in r])

        if talent:
            r = await conn.fetch(
                """
                SELECT i.*, b.company_name, t.name AS talent_name, t.ig_handle
                FROM inquiries i
                JOIN brands  b ON b.id = i.brand_id
                JOIN talents t ON t.id = i.talent_id
                WHERE i.talent_id = $1 AND i.direction = 'superstar_to_brand'
                ORDER BY i.created_at DESC
                """,
                talent["id"],
            )
            rows.extend([dict(x) for x in r])

    return rows


# ── List RECEIVED inquiries (as recipient) ────────────────────────────────────

@router.get("/received", response_model=list[dict])
async def list_received_inquiries(user: dict = Depends(get_current_user)):
    """Received offers (superstar) or received applications (brand)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand  = await conn.fetchrow("SELECT id FROM brands  WHERE user_id = $1", user["id"])
        talent = await conn.fetchrow("SELECT id FROM talents WHERE user_id = $1", user["id"])
        rows: list[dict] = []

        if talent:
            r = await conn.fetch(
                """
                SELECT i.*, b.company_name, t.name AS talent_name, t.ig_handle
                FROM inquiries i
                JOIN brands  b ON b.id = i.brand_id
                JOIN talents t ON t.id = i.talent_id
                WHERE i.talent_id = $1 AND i.direction = 'brand_to_superstar'
                ORDER BY i.created_at DESC
                """,
                talent["id"],
            )
            rows.extend([dict(x) for x in r])

        if brand:
            r = await conn.fetch(
                """
                SELECT i.*, b.company_name, t.name AS talent_name, t.ig_handle, t.photo_urls
                FROM inquiries i
                JOIN brands  b ON b.id = i.brand_id
                JOIN talents t ON t.id = i.talent_id
                WHERE i.brand_id = $1 AND i.direction = 'superstar_to_brand'
                ORDER BY i.created_at DESC
                """,
                brand["id"],
            )
            rows.extend([dict(x) for x in r])

    return rows


# ── Admin: list all + override status ─────────────────────────────────────────

@router.get("/admin/all", response_model=list[dict])
async def admin_list_inquiries(_: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT i.*, b.company_name, t.name AS talent_name, t.ig_handle
            FROM inquiries i
            JOIN brands  b ON b.id = i.brand_id
            JOIN talents t ON t.id = i.talent_id
            ORDER BY i.created_at DESC
            """
        )
    return [dict(r) for r in rows]


@router.patch("/{inquiry_id}/status", response_model=dict)
async def admin_override_status(
    inquiry_id: UUID,
    data: InquiryStatusUpdate,
    _: dict = Depends(get_admin_user),
):
    """Admin override - forces a status change and creates campaign if setting accepted."""
    valid = {"pending", "accepted", "declined", "cancelled"}
    if data.status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE inquiries SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
            data.status, str(inquiry_id),
        )
    if not row:
        raise HTTPException(404, "Inquiry not found")

    if data.status == "accepted":
        asyncio.create_task(_make_campaign_coro(str(inquiry_id)))

    return dict(row)
