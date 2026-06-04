from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from models.brand import Brand, BrandCreate, BrandUpdate
from auth import get_current_user
import json

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("/me", response_model=Brand)
async def get_my_brand(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM brands WHERE user_id = $1", user["id"])
    if not row:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return _row_to_brand(row)


@router.post("/me", response_model=Brand)
async def create_brand(data: BrandCreate, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if existing:
            raise HTTPException(status_code=409, detail="Brand profile already exists")
        row = await conn.fetchrow(
            """
            INSERT INTO brands (user_id, company_name, industry, brand_values,
              aesthetic_tags, target_audience, campaign_type)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
            """,
            user["id"], data.company_name, data.industry,
            data.brand_values, data.aesthetic_tags,
            json.dumps(data.target_audience), data.campaign_type,
        )

    # Trigger AI scoring in background when brand profile is first created
    from services.ai_scoring import trigger_scoring_for_brand
    import asyncio
    asyncio.create_task(trigger_scoring_for_brand(str(row["id"])))

    return _row_to_brand(row)


@router.patch("/me", response_model=Brand)
async def update_brand(data: BrandUpdate, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "target_audience" in updates:
        updates["target_audience"] = json.dumps(updates["target_audience"])

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [user["id"]] + list(updates.values())

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE brands SET {set_clause} WHERE user_id = $1 RETURNING *",
            *values,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Brand profile not found")

    # Trigger AI scoring in background when brand profile changes
    from services.ai_scoring import trigger_scoring_for_brand
    import asyncio
    asyncio.create_task(trigger_scoring_for_brand(str(row["id"])))

    return _row_to_brand(row)


def _row_to_brand(row) -> Brand:
    d = dict(row)
    if isinstance(d.get("target_audience"), str):
        d["target_audience"] = json.loads(d["target_audience"])
    return Brand(**d)
