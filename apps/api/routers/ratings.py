from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from database import get_pool
from auth import get_current_user

router = APIRouter(prefix="/ratings", tags=["ratings"])


class RatingCreate(BaseModel):
    inquiry_id: str
    score: int       # 1-5
    comment: Optional[str] = None


@router.post("/")
async def submit_rating(data: RatingCreate, user: dict = Depends(get_current_user)):
    """Submit a star rating + optional comment for a confirmed/closed booking."""
    if not 1 <= data.score <= 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")

    pool = await get_pool()
    async with pool.acquire() as conn:
        inquiry = await conn.fetchrow(
            """
            SELECT i.id, i.status,
                   b.user_id AS brand_user_id,
                   t.user_id AS superstar_user_id
            FROM   inquiries i
            JOIN   brands  b ON b.id = i.brand_id
            JOIN   talents t ON t.id = i.talent_id
            WHERE  i.id = $1
            """,
            data.inquiry_id,
        )

    if not inquiry:
        raise HTTPException(status_code=404, detail="Booking not found")
    if inquiry["status"] not in ("confirmed", "closed"):
        raise HTTPException(
            status_code=400, detail="Ratings can only be submitted for confirmed or closed bookings"
        )

    brand_uid   = inquiry["brand_user_id"]
    superstar_uid = inquiry["superstar_user_id"]

    if user["id"] == brand_uid:
        ratee_user_id = superstar_uid
        ratee_type    = "superstar"
    elif user["id"] == superstar_uid:
        ratee_user_id = brand_uid
        ratee_type    = "brand"
    else:
        raise HTTPException(status_code=403, detail="You are not part of this booking")

    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ratings WHERE inquiry_id = $1 AND rater_user_id = $2",
            data.inquiry_id, user["id"],
        )
        if existing:
            raise HTTPException(status_code=409, detail="You have already rated this booking")

        await conn.execute(
            """
            INSERT INTO ratings (inquiry_id, rater_user_id, ratee_user_id, ratee_type, score, comment)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            data.inquiry_id, user["id"], ratee_user_id, ratee_type, data.score, data.comment,
        )

        # Keep talent rating_avg + rating_count in sync
        if ratee_type == "superstar" and ratee_user_id:
            await conn.execute(
                """
                UPDATE talents SET
                  rating_count = (
                    SELECT COUNT(*) FROM ratings
                    WHERE  ratee_user_id = $1 AND ratee_type = 'superstar'
                  ),
                  rating_avg = (
                    SELECT ROUND(AVG(score)::numeric, 2) FROM ratings
                    WHERE  ratee_user_id = $1 AND ratee_type = 'superstar'
                  )
                WHERE user_id = $1
                """,
                ratee_user_id,
            )

    return {"ok": True}


@router.get("/check/{inquiry_id}")
async def check_rating(inquiry_id: str, user: dict = Depends(get_current_user)):
    """Check whether the current user has already rated a specific booking."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT score, comment FROM ratings WHERE inquiry_id = $1 AND rater_user_id = $2",
            inquiry_id, user["id"],
        )
    if row:
        return {"has_rated": True, "score": row["score"], "comment": row["comment"]}
    return {"has_rated": False}


@router.get("/public")
async def get_public_reviews(limit: int = Query(default=9, le=20)):
    """Return recent high-score reviews with comments for the landing page."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
              r.score,
              r.comment,
              r.ratee_type,
              r.created_at,
              CASE
                WHEN r.ratee_type = 'superstar' THEN t.name
                ELSE b.company_name
              END AS ratee_name
            FROM   ratings r
            LEFT JOIN talents t ON t.user_id = r.ratee_user_id AND r.ratee_type = 'superstar'
            LEFT JOIN brands  b ON b.user_id  = r.ratee_user_id AND r.ratee_type = 'brand'
            WHERE  r.score >= 4
              AND  r.comment IS NOT NULL
              AND  LENGTH(TRIM(r.comment)) > 10
            ORDER BY r.created_at DESC
            LIMIT  $1
            """,
            limit,
        )
    return [dict(r) for r in rows]
