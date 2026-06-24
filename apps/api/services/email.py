"""
Email service using Resend (resend.com).
API key is read from platform_settings table first, then env var fallback.
"""
import httpx
from database import get_pool

FROM_ADDRESS = "Northstar <noreply@castd.sg>"


async def _get_resend_key() -> str:
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT value FROM platform_settings WHERE key = 'resend_api_key'"
            )
        if row and row["value"]:
            return row["value"]
    except Exception:
        pass
    # Env var fallback
    try:
        from config import settings
        return settings.resend_api_key
    except Exception:
        return ""


async def send_email(to: str, subject: str, html: str) -> bool:
    """Send a transactional email via Resend. Returns True on success."""
    if not to or "@" not in to:
        return False
    key = await _get_resend_key()
    if not key:
        print(f"[email] No Resend API key configured - skipping email to {to}")
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"from": FROM_ADDRESS, "to": [to], "subject": subject, "html": html},
            )
        if resp.status_code not in (200, 201):
            print(f"[email] Resend returned {resp.status_code}: {resp.text}")
            return False
        return True
    except Exception as e:
        print(f"[email] Failed to send to {to}: {e}")
        return False


# ---------------------------------------------------------------------------
# Email templates
# ---------------------------------------------------------------------------

def _base(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>{title}</title></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #EBEBEB;">
        <!-- Header -->
        <tr><td style="background:#FFD200;padding:20px 32px;">
          <span style="font-size:20px;font-weight:800;color:#0C0C0C;letter-spacing:-0.03em;">Northstar</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          {body_html}
          <hr style="border:none;border-top:1px solid #EBEBEB;margin:32px 0;">
          <p style="font-size:12px;color:#7A7A7A;margin:0;">
            Northstar Collective · Singapore's talent agency for beauty &amp; lifestyle brands.<br>
            You're receiving this because you have an account on Northstar.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _h(text: str) -> str:
    return f'<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0C0C0C;">{text}</h2>'


def _p(text: str) -> str:
    return f'<p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">{text}</p>'


def _pill(label: str, value: str) -> str:
    return (
        f'<tr><td style="padding:6px 0;font-size:13px;color:#7A7A7A;width:120px;">{label}</td>'
        f'<td style="padding:6px 0;font-size:13px;color:#0C0C0C;font-weight:500;">{value}</td></tr>'
    )


def _btn(text: str, url: str) -> str:
    return (
        f'<a href="{url}" style="display:inline-block;margin-top:8px;padding:12px 24px;'
        f'background:#FFD200;color:#0C0C0C;font-weight:700;font-size:14px;text-decoration:none;'
        f'border-radius:8px;">{text}</a>'
    )


# --- Brand emails ---

async def email_brand_inquiry_received(to: str, brand_name: str, talent_name: str, campaign_name: str):
    subject = f"Inquiry submitted for {talent_name}"
    body = (
        _h(f"Your inquiry has been received") +
        _p(f"Hi {brand_name}, we've received your inquiry for <strong>{talent_name}</strong>.") +
        f'<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">'
        f'{_pill("Campaign", campaign_name)}'
        f'{_pill("Talent", talent_name)}'
        f'</table>' +
        _p("We'll review it and get back to you shortly. You can track the status in your Northstar dashboard.") +
        _btn("View my inquiries", "https://castd.sg/inquiries")
    )
    await send_email(to, subject, _base(subject, body))


async def email_brand_status_changed(to: str, brand_name: str, talent_name: str, campaign_name: str, new_status: str):
    status_copy = {
        "reviewing": ("Under review", f"Good news - your inquiry for <strong>{talent_name}</strong> is now being reviewed. We're checking availability and getting things moving."),
        "confirmed": ("Booking confirmed!", f"Your booking for <strong>{talent_name}</strong> has been confirmed. We'll be in touch shortly with next steps and contact details."),
        "closed":    ("Inquiry closed", f"Your inquiry for <strong>{talent_name}</strong> has been closed. Feel free to browse the catalog and send a new inquiry anytime."),
    }
    if new_status not in status_copy:
        return
    headline, copy_text = status_copy[new_status]
    subject = f"{headline} - {talent_name}"
    body = (
        _h(headline) +
        _p(f"Hi {brand_name},") +
        _p(copy_text) +
        f'<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">'
        f'{_pill("Campaign", campaign_name)}'
        f'{_pill("Talent", talent_name)}'
        f'{_pill("Status", new_status.capitalize())}'
        f'</table>' +
        _btn("View my inquiries", "https://castd.sg/inquiries")
    )
    await send_email(to, subject, _base(subject, body))


# --- Talent emails ---

async def email_talent_inquiry_received(to: str, talent_name: str, brand_name: str, campaign_name: str, campaign_type: str, brief_text: str):
    subject = f"A brand wants to work with you - {campaign_name}"
    brief_snippet = (brief_text or "")[:300]
    body = (
        _h("You have a new inquiry") +
        _p(f"Hi {talent_name}, <strong>{brand_name}</strong> is interested in working with you for a new campaign.") +
        f'<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">'
        f'{_pill("Campaign", campaign_name)}'
        f'{_pill("Type", campaign_type or "-")}'
        f'</table>' +
        (f'<div style="background:#F8F7F4;border-radius:8px;padding:16px;margin-bottom:24px;">'
         f'<p style="margin:0 0 4px;font-size:12px;color:#7A7A7A;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Brief</p>'
         f'<p style="margin:0;font-size:14px;color:#333333;line-height:1.6;">{brief_snippet}</p>'
         f'</div>' if brief_snippet else "") +
        _p("If this project moves forward, Northstar will be in touch with next steps. No action needed from you right now.")
    )
    await send_email(to, subject, _base(subject, body))


async def email_talent_confirmed(to: str, talent_name: str, brand_name: str, campaign_name: str, brief_text: str):
    subject = f"You've been confirmed for {campaign_name}"
    brief_snippet = (brief_text or "")[:400]
    body = (
        _h("You're booked!") +
        _p(f"Hi {talent_name}, congratulations - <strong>{brand_name}</strong> has confirmed you for their campaign.") +
        f'<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">'
        f'{_pill("Campaign", campaign_name)}'
        f'{_pill("Brand", brand_name)}'
        f'</table>' +
        (f'<div style="background:#F8F7F4;border-radius:8px;padding:16px;margin-bottom:24px;">'
         f'<p style="margin:0 0 4px;font-size:12px;color:#7A7A7A;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Campaign brief</p>'
         f'<p style="margin:0;font-size:14px;color:#333333;line-height:1.6;">{brief_snippet}</p>'
         f'</div>' if brief_snippet else "") +
        _p("Northstar will reach out to coordinate the details. Get ready!")
    )
    await send_email(to, subject, _base(subject, body))
