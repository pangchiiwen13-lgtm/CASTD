from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import get_pool
from auth import get_admin_user

router = APIRouter(prefix="/admin/settings", tags=["admin"])

SETTINGS_KEYS = ["resend_api_key"]


@router.get("")
async def get_settings(_: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT key, value FROM platform_settings WHERE key = ANY($1)",
            SETTINGS_KEYS,
        )
    result = {k: "" for k in SETTINGS_KEYS}
    for row in rows:
        result[row["key"]] = row["value"]
    # Mask sensitive values — show only whether configured + last 4 chars
    return {
        k: {"configured": bool(v), "masked": ("••••" + v[-4:]) if len(v) > 4 else ("••••" if v else "")}
        for k, v in result.items()
    }


class SettingsUpdate(BaseModel):
    key: str
    value: str


@router.patch("")
async def update_setting(data: SettingsUpdate, _: dict = Depends(get_admin_user)):
    if data.key not in SETTINGS_KEYS:
        raise HTTPException(status_code=400, detail=f"Unknown setting: {data.key}")
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO platform_settings (key, value, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            """,
            data.key, data.value,
        )
    return {"ok": True}
