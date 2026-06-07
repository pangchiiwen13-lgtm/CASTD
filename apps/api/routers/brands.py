import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from models.brand import Brand, BrandCreate, BrandUpdate
from auth import get_current_user, get_admin_user
from services.uen_validator import lookup_uen_iras, validate_uen_format

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("/public/logos", response_model=list[dict])
async def get_public_brand_logos():
    """Public endpoint: return brand logos for the landing page slider."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT company_name, logo_url
            FROM brands
            WHERE logo_url IS NOT NULL AND logo_url != ''
            ORDER BY created_at DESC
            LIMIT 30
            """
        )
    return [{"company_name": r["company_name"], "logo_url": r["logo_url"]} for r in rows]


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
    # Validate UEN if provided
    uen_status = "unverified"
    uen_verified_name = None
    uen_clean = None
    if data.uen:
        uen_clean = data.uen.strip().upper()
        if not validate_uen_format(uen_clean):
            raise HTTPException(status_code=400, detail="Invalid UEN format. Please check your Singapore UEN.")
        result = await lookup_uen_iras(uen_clean)
        uen_status = result["status"]
        uen_verified_name = result.get("name")

    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if existing:
            raise HTTPException(status_code=409, detail="Brand profile already exists")
        row = await conn.fetchrow(
            """
            INSERT INTO brands (user_id, email, company_name, industry, brand_values,
              aesthetic_tags, target_audience, campaign_type, uen, uen_status, uen_verified_name)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *
            """,
            user["id"], user.get("email", ""), data.company_name, data.industry,
            data.brand_values, data.aesthetic_tags,
            json.dumps(data.target_audience), data.campaign_type,
            uen_clean, uen_status, uen_verified_name,
        )

    from services.ai_scoring import trigger_scoring_for_brand
    asyncio.create_task(trigger_scoring_for_brand(str(row["id"])))
    return _row_to_brand(row)


@router.patch("/me", response_model=Brand)
async def update_brand(data: BrandUpdate, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Handle UEN update + validation
    if "uen" in updates and updates["uen"]:
        uen_clean = updates["uen"].strip().upper()
        if not validate_uen_format(uen_clean):
            raise HTTPException(status_code=400, detail="Invalid UEN format. Please check your Singapore UEN.")
        result = await lookup_uen_iras(uen_clean)
        updates["uen"] = uen_clean
        updates["uen_status"] = result["status"]
        updates["uen_verified_name"] = result.get("name")

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

    from services.ai_scoring import trigger_scoring_for_brand
    asyncio.create_task(trigger_scoring_for_brand(str(row["id"])))
    return _row_to_brand(row)


@router.get("/admin/all")
async def admin_list_brands(_: dict = Depends(get_admin_user)):
    """Admin-only: list all brand accounts with inquiry counts."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
              b.id, b.user_id, b.company_name, b.industry, b.campaign_type,
              b.aesthetic_tags, b.plan_tier, b.email, b.created_at,
              COUNT(i.id) AS inquiry_count,
              COUNT(CASE WHEN i.status = 'confirmed' THEN 1 END) AS confirmed_count
            FROM brands b
            LEFT JOIN inquiries i ON i.brand_id = b.id
            GROUP BY b.id
            ORDER BY b.created_at DESC
            """
        )
    return [dict(r) for r in rows]


@router.post("/admin", status_code=201)
async def admin_create_brand(data: BrandCreate, _: dict = Depends(get_admin_user)):
    """Admin-only: create a brand record directly."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO brands (user_id, email, company_name, industry, brand_values,
              aesthetic_tags, target_audience, campaign_type)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
            """,
            "admin-created", data.email or "", data.company_name, data.industry,
            data.brand_values, data.aesthetic_tags,
            json.dumps(data.target_audience), data.campaign_type,
        )
    return dict(row)


@router.patch("/admin/{brand_id}")
async def admin_update_brand(brand_id: UUID, data: BrandUpdate, _: dict = Depends(get_admin_user)):
    """Admin-only: update any brand."""
    pool = await get_pool()
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "target_audience" in updates:
        updates["target_audience"] = json.dumps(updates["target_audience"])
    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [str(brand_id)] + list(updates.values())
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE brands SET {set_clause} WHERE id = $1 RETURNING *", *values
        )
    if not row:
        raise HTTPException(status_code=404, detail="Brand not found")
    return dict(row)


@router.delete("/admin/{brand_id}", status_code=204)
async def admin_delete_brand(brand_id: UUID, _: dict = Depends(get_admin_user)):
    """Admin-only: delete a brand."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM brands WHERE id = $1", str(brand_id))
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Brand not found")


def _row_to_brand(row) -> Brand:
    d = dict(row)
    if isinstance(d.get("target_audience"), str):
        d["target_audience"] = json.loads(d["target_audience"])
    return Brand(**d)
