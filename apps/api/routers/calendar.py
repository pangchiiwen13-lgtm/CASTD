"""
Talent availability calendar.
Superstars manage their own blocked dates and weekly availability schedule.
Brands can read the full calendar for any published talent.
"""
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from datetime import date, time
from typing import Optional
from pydantic import BaseModel
from database import get_pool
from auth import get_current_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


class DateToggle(BaseModel):
    date: date  # ISO format: "2026-07-15"


class AvailabilityRule(BaseModel):
    day_of_week: int   # 0=Sun, 1=Mon ... 6=Sat
    start_time: str    # "HH:MM"
    end_time: str      # "HH:MM"


class ScheduleUpdate(BaseModel):
    rules: list[AvailabilityRule]


class CalendarResponse(BaseModel):
    talent_id: str
    blocked_dates: list[str]
    availability_rules: list[AvailabilityRule]


@router.get("/{talent_id}", response_model=CalendarResponse)
async def get_calendar(talent_id: UUID, _: dict = Depends(get_current_user)):
    """Get blocked dates and weekly availability schedule for a talent."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        blocked_rows = await conn.fetch(
            "SELECT blocked_date FROM talent_blocks WHERE talent_id = $1 ORDER BY blocked_date",
            str(talent_id),
        )
        # talent_availability table may not exist yet (migration 012 pending)
        try:
            rule_rows = await conn.fetch(
                "SELECT day_of_week, start_time, end_time FROM talent_availability "
                "WHERE talent_id = $1 ORDER BY day_of_week",
                str(talent_id),
            )
        except Exception:
            rule_rows = []
    return CalendarResponse(
        talent_id=str(talent_id),
        blocked_dates=[str(r["blocked_date"]) for r in blocked_rows],
        availability_rules=[
            AvailabilityRule(
                day_of_week=r["day_of_week"],
                start_time=str(r["start_time"])[:5],
                end_time=str(r["end_time"])[:5],
            )
            for r in rule_rows
        ],
    )


@router.put("/{talent_id}/schedule")
async def set_schedule(talent_id: UUID, data: ScheduleUpdate, user: dict = Depends(get_current_user)):
    """Replace the full weekly availability schedule for the superstar's own profile."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        talent = await conn.fetchrow(
            "SELECT id, user_id FROM talents WHERE id = $1", str(talent_id)
        )
        if not talent:
            raise HTTPException(status_code=404, detail="Talent not found")
        if talent["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="You can only manage your own calendar")

        async with conn.transaction():
            # Delete existing schedule
            await conn.execute(
                "DELETE FROM talent_availability WHERE talent_id = $1", str(talent_id)
            )
            # Insert new rules
            for rule in data.rules:
                await conn.execute(
                    """
                    INSERT INTO talent_availability (talent_id, day_of_week, start_time, end_time)
                    VALUES ($1, $2, $3::time, $4::time)
                    ON CONFLICT (talent_id, day_of_week) DO UPDATE
                      SET start_time = EXCLUDED.start_time,
                          end_time   = EXCLUDED.end_time
                    """,
                    str(talent_id),
                    rule.day_of_week,
                    rule.start_time,
                    rule.end_time,
                )
    return {"ok": True, "rules_saved": len(data.rules)}


@router.post("/{talent_id}/toggle")
async def toggle_blocked_date(talent_id: UUID, data: DateToggle, user: dict = Depends(get_current_user)):
    """Toggle a specific blocked date for the superstar's own profile."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        talent = await conn.fetchrow(
            "SELECT id, user_id FROM talents WHERE id = $1", str(talent_id)
        )
        if not talent:
            raise HTTPException(status_code=404, detail="Talent not found")
        if talent["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="You can only manage your own calendar")

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
