"""
Auth verification for CASTD FastAPI backend.
Uses Neon Auth session cookie verification via /get-session endpoint.
"""
import httpx
from fastapi import Depends, HTTPException, Header

NEON_AUTH_BASE = "https://ep-red-silence-aossuqc4.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth"


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Extract and verify the Better Auth session token from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = authorization.split(" ", 1)[1]

    # Neon Auth session tokens are opaque (not JWTs).
    # Verify by calling the Neon Auth /get-session endpoint.
    # The cookie name Neon Auth recognises is "__Secure-neon-auth.session_token".
    # The frontend proxy stores it locally as "neon-auth.session_token" and the
    # browser sends the raw signed token as the Bearer value.
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NEON_AUTH_BASE}/get-session",
            headers={"Cookie": f"__Secure-neon-auth.session_token={token}"},
        )

    if resp.status_code != 200 or resp.json() is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    session_data = resp.json()
    if not session_data or not session_data.get("user"):
        raise HTTPException(status_code=401, detail="No user in session")

    user = session_data["user"]
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "session": session_data.get("session", {}),
    }


async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    from config import settings
    if user.get("id") not in settings.admin_ids and user.get("email") not in settings.admin_ids:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
