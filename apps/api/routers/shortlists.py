from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from auth import get_current_user

router = APIRouter(prefix="/shortlists", tags=["shortlists"])


@router.get("", response_model=list[dict])
async def get_shortlist(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT t.id, t.name, t.ig_handle, t.photo_urls, t.content_types, t.vibe_tags,
                   t.ig_followers, t.languages, t.gender, t.age,
                   s.created_at AS saved_at
            FROM shortlists s
            JOIN talents t ON t.id = s.talent_id
            JOIN brands b ON b.id = s.brand_id
            WHERE b.user_id = $1
            ORDER BY s.created_at DESC
            """,
            user["id"],
        )
    return [dict(r) for r in rows]


@router.post("/{talent_id}", status_code=201)
async def add_to_shortlist(talent_id: UUID, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(status_code=404, detail="Complete your brand profile first")
        try:
            await conn.execute(
                "INSERT INTO shortlists (brand_id, talent_id) VALUES ($1, $2)",
                brand["id"], talent_id,
            )
        except Exception:
            pass  # already saved - silently ignore
    return {"saved": True}


@router.delete("/{talent_id}", status_code=204)
async def remove_from_shortlist(talent_id: UUID, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            DELETE FROM shortlists
            WHERE talent_id = $1
              AND brand_id = (SELECT id FROM brands WHERE user_id = $2)
            """,
            talent_id, user["id"],
        )
