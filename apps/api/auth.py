"""
Better Auth JWT verification for CASTD FastAPI backend.
Neon Auth (Better Auth) signs JWTs with Ed25519 (EdDSA).
JWKS endpoint: https://ep-red-silence-aossuqc4.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json
"""
import httpx
import json
from functools import lru_cache
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from jose.backends import ECKey
import base64

NEON_AUTH_BASE = "https://ep-red-silence-aossuqc4.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth"
JWKS_URL = f"{NEON_AUTH_BASE}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _get_jwks_sync() -> dict:
    import httpx as _httpx
    with _httpx.Client() as c:
        return c.get(JWKS_URL).json()


async def _get_jwks() -> dict:
    """Fetch JWKS from Neon Auth (cached after first call)."""
    return _get_jwks_sync()


def _ed25519_public_key_from_jwk(jwk: dict):
    """Convert JWK (OKP/Ed25519) to a public key usable by python-jose."""
    # x is the 32-byte Ed25519 public key in base64url
    x_bytes = base64.urlsafe_b64decode(jwk["x"] + "==")
    return x_bytes


async def verify_token(token: str) -> dict:
    """Verify a Better Auth JWT and return the decoded payload."""
    jwks = await _get_jwks()
    keys = jwks.get("keys", [])
    if not keys:
        raise HTTPException(status_code=401, detail="No JWKS keys available")

    # Try each key
    for key in keys:
        try:
            # Better Auth uses EdDSA (Ed25519)
            # python-jose supports EdDSA in recent versions
            payload = jwt.decode(
                token,
                key,  # pass the raw JWK dict; jose handles OKP keys
                algorithms=["EdDSA"],
                options={"verify_aud": False},
            )
            return payload
        except JWTError:
            continue
        except Exception:
            continue

    raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Extract and verify the Better Auth session token from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = authorization.split(" ", 1)[1]

    # Neon Auth session tokens are opaque session tokens (not JWTs).
    # Verify by calling the Neon Auth /get-session endpoint.
    # The cookie name Neon Auth recognises is "__Secure-neon-auth.session_token".
    # The frontend proxy stores it locally as "neon-auth.session_token" and the
    # browser sends the raw token (with signature suffix) as the Bearer value.
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
