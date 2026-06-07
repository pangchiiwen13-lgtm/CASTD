"""
Talent availability calendar.
Superstars manage their own blocked dates.
Brands can read blocked dates for any published talent.
"""
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from datetime import date
from typing import Optional
from pydantic import BaseModel
from database import get_pool
from auth import get_current_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


class DateToggle(BaseModel):
    date: date  # ISO format: "2026-07-15"


class BlockedDatesResponse(BaseModel):
    talent_id: str
    blocked_dates: list[str]  # list of "YYYY-MM-DD" strings


@router.get("/{talent_id}", response_model=BlockedDatesResponse)
async def get_blocked_dates(talent_id: UUID, _: dict = Depends(get_current_user)):
    """Get all blocked dates for a talent. Any authenticated user can read."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT blocked_date FROM talent_blocks WHERE talent_id = $1 ORDER BY blocked_date",
            str(talent_id),
        )
    return BlockedDatesResponse(
        talent_id=str(talent_id),
        blocked_dates=[str(r["blocked_date"]) for r in rows],
    )


@router.post("/{talent_id}/toggle")
async def toggle_blocked_date(talent_id: UUID, data: DateToggle, user: dict = Depends(get_current_user)):
    """Toggle a blocked date for the superstar's own profile."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verify ownership
        talent = await conn.fetchrow(
            "SELECT id, user_id FROM talents WHERE id = $1", str(talent_id)
        )
        if not talent:
            raise HTTPException(status_code=404, detail="Talent not found")
        if talent["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="You can only manage your own calendar")

        # Toggle: if exists, remove; if not, add
        existing = await conn.fetchval(
            "SELECT id FROM talent_blocks WHERE talent_id = $1 AND blocked_date = $2",
            str(talent_id), data.date,
        )
        if existing:
            await conn.execute(
                "DELETE FROM talent_blocks WHERE talent_id = $1 AND blocked_date = $2",
                str(talent_id), data.date,
            )
            return {"action": "unblocked", "date": str(data.date)}
        else:
            await conn.execute(
                "INSERT INTO talent_blocks (talent_id, blocked_date) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                str(talent_id), data.date,
            )
            return {"action": "blocked", "date": str(data.date)}


@router.delete("/{talent_id}/clear")
async def clear_blocked_dates(talent_id: UUID, user: dict = Depends(get_current_user)):
    """Clear all blocked dates for a talent (own profile only)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        talent = await conn.fetchrow("SELECT user_id FROM talents WHERE id = $1", str(talent_id))
        if not talent or talent["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        await conn.execute("DELETE FROM talent_blocks WHERE talent_id = $1", str(talent_id))
    return {"ok": True}
