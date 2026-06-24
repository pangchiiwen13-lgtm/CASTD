import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from uuid import UUID
from database import get_pool
from auth import get_current_user
from config import settings
import json

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/confirmations", tags=["confirmations"])


@router.post("/{inquiry_id}/checkout")
async def create_checkout_session(inquiry_id: UUID, user: dict = Depends(get_current_user)):
    """
    Creates a Stripe Checkout session for confirming a talent.
    Skipped if brand has an active $15/month subscription.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id, plan_tier FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(status_code=404, detail="Complete your brand profile first")

        inquiry = await conn.fetchrow(
            """
            SELECT i.*, t.name AS talent_name
            FROM inquiries i
            JOIN talents t ON t.id = i.talent_id
            WHERE i.id = $1 AND i.brand_id = $2
            """,
            inquiry_id, brand["id"],
        )
        if not inquiry:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        # Check active subscription - subscribers skip payment
        sub = await conn.fetchrow(
            "SELECT id FROM subscriptions WHERE brand_id = $1 AND status = 'active'",
            brand["id"],
        )
        if sub:
            # Directly confirm without payment
            row = await conn.fetchrow(
                """
                INSERT INTO contact_confirmations (brand_id, talent_id, inquiry_id, amount_sgd, paid_at)
                VALUES ($1, $2, $3, 0, NOW())
                ON CONFLICT DO NOTHING
                RETURNING id
                """,
                brand["id"], inquiry["talent_id"], inquiry_id,
            )
            await conn.execute(
                "UPDATE inquiries SET status = 'confirmed' WHERE id = $1", inquiry_id
            )
            return {"confirmed": True, "subscription_used": True}

    # Create Stripe Checkout for non-subscribers
    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "sgd",
                "unit_amount": settings.stripe_contact_fee_sgd,
                "product_data": {
                    "name": f"Northstar - Talent Contact: {inquiry['talent_name']}",
                    "description": f"Campaign: {inquiry['campaign_name']}",
                },
            },
            "quantity": 1,
        }],
        metadata={
            "inquiry_id": str(inquiry_id),
            "brand_id": str(brand["id"]),
            "talent_id": str(inquiry["talent_id"]),
        },
        success_url=f"{settings.allowed_origins.split(',')[0]}/inquiries/{inquiry_id}?confirmed=1",
        cancel_url=f"{settings.allowed_origins.split(',')[0]}/inquiries/{inquiry_id}",
    )

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO contact_confirmations (brand_id, talent_id, inquiry_id, stripe_session_id, amount_sgd)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (stripe_session_id) DO NOTHING
            """,
            brand["id"], inquiry["talent_id"], inquiry_id,
            session.id, settings.stripe_contact_fee_sgd / 100,
        )

    return {"checkout_url": session.url}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata", {})
        payment_type = meta.get("type", "inquiry_contact")

        pool = await get_pool()

        if payment_type == "campaign_escrow":
            # Campaign escrow payment - mark as held
            campaign_id = meta.get("campaign_id")
            if campaign_id:
                async with pool.acquire() as conn:
                    await conn.execute(
                        "UPDATE campaigns SET payment_status = 'held' WHERE id = $1",
                        UUID(campaign_id),
                    )
        else:
            # Legacy inquiry contact fee flow
            inquiry_id = meta.get("inquiry_id")
            brand_id = meta.get("brand_id")
            talent_id = meta.get("talent_id")

            async with pool.acquire() as conn:
                await conn.execute(
                    "UPDATE contact_confirmations SET paid_at = NOW() WHERE stripe_session_id = $1",
                    session["id"],
                )
                if inquiry_id:
                    await conn.execute(
                        "UPDATE inquiries SET status = 'confirmed' WHERE id = $1",
                        UUID(inquiry_id),
                    )

            # Notify owner via Telegram
            from services.notifications import notify_confirmation_paid
            await notify_confirmation_paid(brand_id, talent_id, inquiry_id)

    return {"received": True}
