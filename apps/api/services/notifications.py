import httpx
from config import settings


async def _send_telegram(text: str):
    if not settings.telegram_bot_token:
        return  # Telegram not configured yet
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(url, json={
                "chat_id": settings.telegram_owner_chat_id,
                "text": text,
                "parse_mode": "HTML",
            })
    except Exception as e:
        print(f"Telegram notification failed: {e}")


async def notify_new_inquiry(inquiry, brand_name: str, talent_name: str):
    msg = (
        f"📋 <b>New Inquiry — CASTD</b>\n\n"
        f"<b>Brand:</b> {brand_name}\n"
        f"<b>Talent:</b> {talent_name}\n"
        f"<b>Campaign:</b> {inquiry.campaign_name}\n"
        f"<b>Type:</b> {inquiry.campaign_type or '—'}\n"
        f"<b>Budget:</b> {inquiry.budget_range or '—'}\n"
        f"<b>Dates:</b> {inquiry.preferred_dates or '—'}\n\n"
        f"<b>Brief:</b> {(inquiry.brief_text or '')[:200]}"
    )
    await _send_telegram(msg)


async def notify_confirmation_paid(brand_id: str, talent_id: str, inquiry_id: str):
    msg = (
        f"💰 <b>Talent Confirmed (Paid) — CASTD</b>\n\n"
        f"Brand ID: <code>{brand_id}</code>\n"
        f"Talent ID: <code>{talent_id}</code>\n"
        f"Inquiry ID: <code>{inquiry_id}</code>\n\n"
        f"Payment received. Contact details unlocked."
    )
    await _send_telegram(msg)
