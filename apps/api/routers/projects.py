"""
Brand Projects (campaign containers).
A project is created by a brand to represent a campaign.
Superstars are hired into the project via inquiries -> campaigns.
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from models.project import ProjectCreate, ProjectUpdate
from auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/brand", response_model=list[dict])
async def list_brand_projects(user: dict = Depends(get_current_user)):
    """List all projects for the authenticated brand."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            return []
        rows = await conn.fetch(
            """
            SELECT p.*,
                   COUNT(c.id) FILTER (WHERE c.status IN ('active','delivered')) AS active_hires,
                   COUNT(c.id) FILTER (WHERE c.status IN ('completed','cancelled')) AS done_hires,
                   COUNT(c.id) AS total_hires
            FROM brand_projects p
            LEFT JOIN campaigns c ON c.project_id = p.id
            WHERE p.brand_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
            """,
            brand["id"],
        )
    return [dict(r) for r in rows]


@router.post("", response_model=dict, status_code=201)
async def create_project(data: ProjectCreate, user: dict = Depends(get_current_user)):
    """Create a new campaign project for the authenticated brand."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(status_code=400, detail="Complete your brand profile first")
        row = await conn.fetchrow(
            """
            INSERT INTO brand_projects (
              brand_id, name, campaign_type, brief_text, deliverables, shoot_date, budget_range,
              target_content_types, target_languages, target_gender,
              target_age_min, target_age_max, target_vibe_tags, target_min_followers
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
            """,
            brand["id"], data.name, data.campaign_type, data.brief_text,
            data.deliverables, data.shoot_date, data.budget_range,
            data.target_content_types or [], data.target_languages or [],
            data.target_gender, data.target_age_min, data.target_age_max,
            data.target_vibe_tags or [], data.target_min_followers,
        )
    project_id = str(row["id"])
    from services.ai_scoring import trigger_scoring_for_campaign
    asyncio.create_task(trigger_scoring_for_campaign(project_id))
    return dict(row)


@router.patch("/{project_id}", response_model=dict)
async def update_project(project_id: UUID, data: ProjectUpdate, user: dict = Depends(get_current_user)):
    """Update a campaign project (including talent criteria)."""
    pool = await get_pool()
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(status_code=400, detail="Brand profile not found")
        existing = await conn.fetchrow(
            "SELECT id FROM brand_projects WHERE id = $1 AND brand_id = $2",
            str(project_id), brand["id"],
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Project not found")

        set_parts = [f"{k} = ${i + 2}" for i, k in enumerate(updates)]
        set_parts.append("updated_at = NOW()")
        set_clause = ", ".join(set_parts)
        values = [str(project_id)] + list(updates.values())
        row = await conn.fetchrow(
            f"UPDATE brand_projects SET {set_clause} WHERE id = $1 RETURNING *",
            *values,
        )

    from services.ai_scoring import trigger_scoring_for_campaign
    asyncio.create_task(trigger_scoring_for_campaign(str(project_id)))
    return dict(row)


@router.get("/open", response_model=list[dict])
async def list_open_projects(_: dict = Depends(get_current_user)):
    """List brand projects open for superstar applications (for the Discover page)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT p.*, b.company_name,
                   COUNT(c.id) AS active_hires
            FROM brand_projects p
            JOIN brands b ON b.id = p.brand_id
            LEFT JOIN campaigns c ON c.project_id = p.id AND c.status = 'active'
            WHERE p.is_open = TRUE AND p.status = 'active'
            GROUP BY p.id, b.company_name
            ORDER BY p.created_at DESC
            """,
        )
    return [dict(r) for r in rows]


@router.patch("/{project_id}/toggle-open", response_model=dict)
async def toggle_project_open(project_id: UUID, user: dict = Depends(get_current_user)):
    """Brand toggles whether their project accepts superstar applications."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT id FROM brands WHERE user_id = $1", user["id"])
        if not brand:
            raise HTTPException(status_code=400, detail="Brand profile not found")
        project = await conn.fetchrow(
            "SELECT id, is_open FROM brand_projects WHERE id = $1 AND brand_id = $2",
            str(project_id), brand["id"],
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        row = await conn.fetchrow(
            "UPDATE brand_projects SET is_open = NOT is_open, updated_at = NOW() WHERE id = $1 RETURNING *",
            str(project_id),
        )
    return dict(row)


@router.get("/{project_id}", response_model=dict)
async def get_project(project_id: UUID, user: dict = Depends(get_current_user)):
    """Get a project with all hired superstars (campaigns) for this brand."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        project = await conn.fetchrow(
            """
            SELECT p.*, b.user_id AS brand_user_id
            FROM brand_projects p
            JOIN brands b ON b.id = p.brand_id
            WHERE p.id = $1
            """,
            str(project_id),
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        p = dict(project)
        if p["brand_user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")

        hires = await conn.fetch(
            """
            SELECT c.*,
                   t.name AS talent_name, t.ig_handle, t.photo_urls
            FROM campaigns c
            JOIN talents t ON t.id = c.talent_id
            WHERE c.project_id = $1
            ORDER BY c.created_at DESC
            """,
            str(project_id),
        )

        applications = await conn.fetch(
            """
            SELECT i.*, t.name AS talent_name, t.ig_handle, t.photo_urls,
                   t.bio, t.content_types, t.ig_followers
            FROM inquiries i
            JOIN talents t ON t.id = i.talent_id
            WHERE i.project_id = $1 AND i.direction = 'superstar_to_brand'
            ORDER BY i.created_at DESC
            """,
            str(project_id),
        )

    p["hires"] = []
    for h in hires:
        row = dict(h)
        if row.get("deliverable_urls") is None:
            row["deliverable_urls"] = []
        p["hires"].append(row)

    p["applications"] = [dict(a) for a in applications]
    return p
