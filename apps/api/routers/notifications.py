from fastapi import APIRouter, Depends
from uuid import UUID
from database import get_pool
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, type, title, body, link, is_read, created_at
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
            """,
            user["id"],
        )
    return [dict(r) for r in rows]


@router.get("/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE",
            user["id"],
        )
    return {"count": count}


@router.post("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
            user["id"],
        )
    return {"ok": True}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: UUID, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
            notification_id,
            user["id"],
        )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Internal helper - called from other routers, not exposed to clients
# ---------------------------------------------------------------------------

async def create_notification(user_id: str, type_: str, title: str, body: str, link: str | None = None):
    """Insert a notification row. Silently skips on error so it never breaks the main flow."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO notifications (user_id, type, title, body, link)
                VALUES ($1, $2, $3, $4, $5)
                """,
                user_id, type_, title, body, link,
            )
    except Exception as e:
        print(f"[notifications] Failed to create notification: {e}")
