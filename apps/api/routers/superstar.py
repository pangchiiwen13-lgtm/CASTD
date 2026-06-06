from fastapi import APIRouter, Depends, HTTPException
from database import get_pool
from models.talent import Talent, SuperstarRegister, SuperstarUpdate
from auth import get_current_user
import re

router = APIRouter(prefix="/superstar", tags=["superstar"])


def _derive_username(ig_handle: str | None, name: str) -> str:
    """Derive a unique-friendly ig_username from handle or name."""
    raw = ig_handle or name
    slug = re.sub(r"[^a-z0-9_]", "", raw.lower().lstrip("@").replace(" ", "_"))
    return slug or "superstar"


def _row_to_talent(row) -> Talent:
    from models.talent import Talent
    d = dict(row)
    return Talent(**d)


@router.get("/me", response_model=Talent)
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Get the Superstar's own profile (matched by auth user_id)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT *, NULL::int AS fit_score FROM talents WHERE user_id = $1",
            user["id"],
        )
    if not row:
        raise HTTPException(status_code=404, detail="No superstar profile found. Complete your registration first.")
    return _row_to_talent(row)


@router.post("/register", response_model=Talent)
async def register_superstar(data: SuperstarRegister, user: dict = Depends(get_current_user)):
    """Create a Superstar profile during onboarding. Linked to the auth user."""
    pool = await get_pool()

    # Check if already registered
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM talents WHERE user_id = $1", user["id"]
        )
    if existing:
        raise HTTPException(status_code=409, detail="Superstar profile already exists.")

    ig_username = _derive_username(data.ig_handle, data.name)

    # Ensure ig_username uniqueness by appending a suffix if needed
    async with pool.acquire() as conn:
        taken = await conn.fetchval(
            "SELECT id FROM talents WHERE ig_username = $1", ig_username
        )
    if taken:
        ig_username = f"{ig_username}_{user['id'][:6]}"

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO talents (
              user_id, ig_username, name, age, gender, languages, content_types,
              vibe_tags, ig_handle, tiktok_handle, ig_followers, tiktok_followers,
              bio, experience_summary, rate_card_text, photo_urls, intro_video_url,
              email, remuneration_preference, min_rate_sgd,
              is_published, profile_status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,FALSE,'pending')
            RETURNING *, NULL::int AS fit_score
            """,
            user["id"], ig_username, data.name, data.age, data.gender,
            data.languages, data.content_types, data.vibe_tags,
            data.ig_handle, data.tiktok_handle, data.ig_followers, data.tiktok_followers,
            data.bio, data.experience_summary, data.rate_card_text,
            data.photo_urls, data.intro_video_url,
            data.email or user.get("email"), data.remuneration_preference, data.min_rate_sgd,
        )
    return _row_to_talent(row)


@router.patch("/me", response_model=Talent)
async def update_my_profile(data: SuperstarUpdate, user: dict = Depends(get_current_user)):
    """Superstar updates their own profile."""
    pool = await get_pool()

    # Get their talent ID
    async with pool.acquire() as conn:
        talent_id = await conn.fetchval(
            "SELECT id FROM talents WHERE user_id = $1", user["id"]
        )
    if not talent_id:
        raise HTTPException(status_code=404, detail="No superstar profile found.")

    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [talent_id] + list(updates.values())

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE talents SET {set_clause} WHERE id = $1 RETURNING *, NULL::int AS fit_score",
            *values,
        )
    return _row_to_talent(row)


@router.get("/bookings")
async def get_my_bookings(user: dict = Depends(get_current_user)):
    """Get all inquiries where the current user is the talent."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Find talent ID for this user
        talent_id = await conn.fetchval(
            "SELECT id FROM talents WHERE user_id = $1", user["id"]
        )
        if not talent_id:
            raise HTTPException(status_code=404, detail="No superstar profile found.")

        rows = await conn.fetch(
            """
            SELECT
              i.id, i.brand_id, i.talent_id, i.campaign_name, i.campaign_type,
              i.brief_text, i.budget_range, i.preferred_dates, i.status, i.created_at,
              b.company_name AS brand_name
            FROM inquiries i
            JOIN brands b ON b.id = i.brand_id
            WHERE i.talent_id = $1
            ORDER BY i.created_at DESC
            """,
            talent_id,
        )

    return [dict(r) for r in rows]


@router.get("/check")
async def check_registration(user: dict = Depends(get_current_user)):
    """Check what type of account this user has: brand, superstar, or none."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand_id = await conn.fetchval(
            "SELECT id FROM brands WHERE user_id = $1", user["id"]
        )
        talent_row = await conn.fetchrow(
            "SELECT id, profile_status, is_published FROM talents WHERE user_id = $1",
            user["id"],
        )

    return {
        "has_brand": brand_id is not None,
        "has_superstar": talent_row is not None,
        "superstar_status": talent_row["profile_status"] if talent_row else None,
        "superstar_published": talent_row["is_published"] if talent_row else None,
    }
