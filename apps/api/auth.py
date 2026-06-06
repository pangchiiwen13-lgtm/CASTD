"""
Auth verification for CASTD FastAPI backend.
Verifies Better Auth sessions by querying the session table directly in the
shared Neon PostgreSQL database - no HTTP call to an external auth service needed.

Better Auth stores sessions in the `session` table with columns:
  token TEXT, userId TEXT, expiresAt TIMESTAMP
and users in the `user` table with columns:
  id TEXT, email TEXT, name TEXT
"""
from fastapi import Depends, HTTPException, Header
from database import get_pool


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Verify the Better Auth session token via direct DB lookup."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty auth token")

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.id, u.email, u.name
            FROM   session s
            JOIN   "user" u ON u.id = s."userId"
            WHERE  s.token = $1
              AND  s."expiresAt" > NOW()
            """,
            token,
        )

    if not row:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
    }


async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    from config import settings
    if user.get("id") not in settings.admin_ids and user.get("email") not in settings.admin_ids:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
