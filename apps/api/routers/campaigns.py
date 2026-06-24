import asyncio
import stripe
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from models.campaign import Campaign, CampaignCreate, CampaignDeliver, CampaignStatusUpdate
from auth import get_current_user, get_admin_user
from routers.notifications import create_notification
from config import settings

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _row_to_dict(row) -> dict:
    d = dict(row)
    if d.get("deliverable_urls") is None:
        d["deliverable_urls"] = []
    return d


# ─── Brand: view their campaigns ─────────────────────────────────────────────

@router.get("/brand", response_model=list[dict])
async def list_brand_campaigns(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            return []
        rows = await conn.fetch(
            """
            SELECT c.*,
                   t.name AS talent_name, t.ig_handle, t.photo_urls,
                   b.company_name
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            JOIN brands  b ON b.id = c.brand_id
            WHERE c.brand_id = $1
            ORDER BY c.created_at DESC
            """,
            brand["id"],
        )
    return [_row_to_dict(r) for r in rows]


# ─── Superstar: view their campaigns ─────────────────────────────────────────

@router.get("/superstar", response_model=list[dict])
async def list_superstar_campaigns(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        talent = await conn.fetchrow(
            "SELECT id FROM talents WHERE user_id = $1", user["id"]
        )
        if not talent:
            return []
        rows = await conn.fetch(
            """
            SELECT c.*,
                   t.name AS talent_name, t.ig_handle,
                   b.company_name, b.industry
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            JOIN brands  b ON b.id = c.brand_id
            WHERE c.talent_id = $1
            ORDER BY c.created_at DESC
            """,
            talent["id"],
        )
    return [_row_to_dict(r) for r in rows]


# ─── Completed campaign count (for testimonial prompt trigger) ────────────────

@router.get("/completed-count", response_model=dict)
async def get_completed_count(user: dict = Depends(get_current_user)):
    """Return how many campaigns this user has completed (as brand or superstar)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if brand:
            row = await conn.fetchrow(
                "SELECT COUNT(*) AS n FROM campaigns WHERE brand_id = $1 AND status = 'completed'",
                brand["id"],
            )
            return {"count": row["n"]}
        talent = await conn.fetchrow("SELECT id FROM talents WHERE user_id = $1", user["id"])
        if talent:
            row = await conn.fetchrow(
                "SELECT COUNT(*) AS n FROM campaigns WHERE talent_id = $1 AND status = 'completed'",
                talent["id"],
            )
            return {"count": row["n"]}
    return {"count": 0}


# ─── Single campaign ──────────────────────────────────────────────────────────

@router.get("/{campaign_id}", response_model=dict)
async def get_campaign(campaign_id: UUID, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT c.*,
                   t.name AS talent_name, t.ig_handle, t.photo_urls, t.user_id AS talent_user_id,
                   b.company_name, b.user_id AS brand_user_id
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            JOIN brands  b ON b.id = c.brand_id
            WHERE c.id = $1
            """,
            str(campaign_id),
        )
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    d = _row_to_dict(row)
    # Only allow brand or talent involved, or admin
    if d["brand_user_id"] != user["id"] and d["talent_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return d


# ─── Admin: create campaign ───────────────────────────────────────────────────

@router.post("", response_model=dict, status_code=201)
async def create_campaign(data: CampaignCreate, _: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO campaigns (inquiry_id, brand_id, talent_id, campaign_name,
              campaign_type, brief_text, deliverables, shoot_date,
              remuneration_type, amount_sgd)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *
            """,
            str(data.inquiry_id) if data.inquiry_id else None,
            str(data.brand_id), str(data.talent_id), data.campaign_name,
            data.campaign_type, data.brief_text, data.deliverables,
            data.shoot_date, data.remuneration_type, data.amount_sgd,
        )
    return _row_to_dict(row)


# ─── Superstar: mark as delivered ────────────────────────────────────────────

@router.patch("/{campaign_id}/deliver", response_model=dict)
async def mark_delivered(
    campaign_id: UUID,
    data: CampaignDeliver,
    user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        campaign = await conn.fetchrow(
            """
            SELECT c.*, t.user_id AS talent_user_id, b.user_id AS brand_user_id,
                   b.email AS brand_email, b.company_name, t.name AS talent_name
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            JOIN brands  b ON b.id = c.brand_id
            WHERE c.id = $1
            """,
            str(campaign_id),
        )
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        if campaign["talent_user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your campaign")
        if campaign["status"] != "active":
            raise HTTPException(status_code=400, detail=f"Campaign is already {campaign['status']}")

        now = datetime.now(timezone.utc)
        auto_release = now + timedelta(days=14)

        row = await conn.fetchrow(
            """
            UPDATE campaigns
            SET status = 'delivered',
                talent_delivered_at = $2,
                auto_release_at = $3,
                deliverable_urls = $4,
                deliverable_note = $5,
                updated_at = $2
            WHERE id = $1
            RETURNING *
            """,
            str(campaign_id), now, auto_release,
            data.deliverable_urls, data.deliverable_note,
        )

    # Notify brand
    async def _notify():
        await create_notification(
            user_id=campaign["brand_user_id"],
            type_="campaign_delivered",
            title=f"{campaign['talent_name']} has marked the work as delivered",
            body=f'Please review and confirm delivery for "{campaign["campaign_name"]}". Payment auto-releases in 14 days.',
            link="/campaigns",
        )
    asyncio.create_task(_notify())

    return _row_to_dict(row)


# ─── Brand: confirm delivery ──────────────────────────────────────────────────

@router.patch("/{campaign_id}/confirm", response_model=dict)
async def confirm_delivery(campaign_id: UUID, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        campaign = await conn.fetchrow(
            """
            SELECT c.*, b.user_id AS brand_user_id, t.user_id AS talent_user_id,
                   t.name AS talent_name, b.company_name
            FROM campaigns c
            JOIN brands  b ON b.id = c.brand_id
            JOIN talents t ON t.id = c.talent_id
            WHERE c.id = $1
            """,
            str(campaign_id),
        )
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        if campaign["brand_user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your campaign")
        if campaign["status"] != "delivered":
            raise HTTPException(status_code=400, detail="Campaign must be in 'delivered' state to confirm")

        now = datetime.now(timezone.utc)
        row = await conn.fetchrow(
            """
            UPDATE campaigns
            SET status = 'completed', brand_confirmed_at = $2, updated_at = $2
            WHERE id = $1
            RETURNING *
            """,
            str(campaign_id), now,
        )

    # Notify talent
    async def _notify():
        await create_notification(
            user_id=campaign["talent_user_id"],
            type_="campaign_completed",
            title=f"{campaign['company_name']} confirmed your delivery!",
            body=f'"{campaign["campaign_name"]}" is now complete. Your payment will be released shortly.',
            link="/superstar/campaigns",
        )
    asyncio.create_task(_notify())

    return _row_to_dict(row)


# ─── Brand: pay campaign escrow ──────────────────────────────────────────────

@router.post("/{campaign_id}/pay", response_model=dict)
async def pay_campaign_escrow(campaign_id: UUID, user: dict = Depends(get_current_user)):
    """Brand pays the agreed campaign amount into escrow via Stripe Checkout."""
    stripe.api_key = settings.stripe_secret_key

    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(400, "Brand profile not found")

        campaign = await conn.fetchrow(
            """
            SELECT c.*, t.name AS talent_name
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            WHERE c.id = $1 AND c.brand_id = $2
            """,
            str(campaign_id), brand["id"],
        )
        if not campaign:
            raise HTTPException(404, "Campaign not found")
        if campaign["remuneration_type"] != "cash":
            raise HTTPException(400, "This campaign does not require a cash payment")
        if not campaign["amount_sgd"]:
            raise HTTPException(400, "No amount set for this campaign")
        if campaign["payment_status"] == "held":
            raise HTTPException(400, "Payment has already been made")

    amount_cents = int(float(campaign["amount_sgd"]) * 100)
    base_url = settings.allowed_origins.split(",")[0].strip()

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "sgd",
                "unit_amount": amount_cents,
                "product_data": {
                    "name": f"Northstar Escrow - {campaign['talent_name']}",
                    "description": f"Campaign: {campaign['campaign_name']}. Funds held until delivery confirmed.",
                },
            },
            "quantity": 1,
        }],
        metadata={
            "type": "campaign_escrow",
            "campaign_id": str(campaign_id),
            "brand_id": str(brand["id"]),
        },
        success_url=f"{base_url}/campaigns/{campaign_id}?paid=1",
        cancel_url=f"{base_url}/campaigns/{campaign_id}",
    )

    pool2 = await get_pool()
    async with pool2.acquire() as conn2:
        await conn2.execute(
            "UPDATE campaigns SET stripe_payment_intent_id = $1, payment_status = 'pending' WHERE id = $2",
            session.id, str(campaign_id),
        )

    return {"checkout_url": session.url}


# ─── Admin: release held payment to talent ────────────────────────────────────

@router.patch("/{campaign_id}/release-payment", response_model=dict)
async def release_campaign_payment(campaign_id: UUID, _: dict = Depends(get_admin_user)):
    """Admin releases the held escrow payment to the talent."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        campaign = await conn.fetchrow(
            """
            SELECT c.*, t.user_id AS talent_user_id, t.name AS talent_name,
                   b.company_name
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            JOIN brands  b ON b.id = c.brand_id
            WHERE c.id = $1
            """,
            str(campaign_id),
        )
        if not campaign:
            raise HTTPException(404, "Campaign not found")
        if campaign["payment_status"] != "held":
            raise HTTPException(400, f"Payment status is '{campaign['payment_status']}' - only 'held' payments can be released")

        now = datetime.now(timezone.utc)
        row = await conn.fetchrow(
            "UPDATE campaigns SET payment_status='released', payment_released_at=$1 WHERE id=$2 RETURNING *",
            now, str(campaign_id),
        )

    # Notify talent
    async def _notify():
        await create_notification(
            user_id=campaign["talent_user_id"],
            type_="payment_released",
            title=f"Payment released for {campaign['campaign_name']}",
            body=f"SGD {campaign['amount_sgd']} has been released by {campaign['company_name']}. Please check your bank/PayNow.",
            link="/superstar/campaigns",
        )
    asyncio.create_task(_notify())

    return _row_to_dict(row)


# ─── Admin: list all + change status ─────────────────────────────────────────

@router.get("/admin/all", response_model=list[dict])
async def admin_list_campaigns(_: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT c.*,
                   t.name AS talent_name, t.ig_handle,
                   b.company_name
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            JOIN brands  b ON b.id = c.brand_id
            ORDER BY c.created_at DESC
            """
        )
    return [_row_to_dict(r) for r in rows]


@router.patch("/admin/{campaign_id}/status", response_model=dict)
async def admin_update_status(
    campaign_id: UUID,
    data: CampaignStatusUpdate,
    _: dict = Depends(get_admin_user),
):
    valid = {"active", "delivered", "completed", "cancelled"}
    if data.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE campaigns SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
            data.status, str(campaign_id),
        )
    if not row:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _row_to_dict(row)
