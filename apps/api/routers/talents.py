from fastapi import APIRouter, Depends, Query
from uuid import UUID
from database import get_pool
from models.talent import Talent, TalentCreate, TalentUpdate
from auth import get_current_user, get_admin_user
import json

router = APIRouter(prefix="/talents", tags=["talents"])


@router.get("", response_model=list[Talent])
async def list_talents(
    language: str | None = Query(None),
    content_type: str | None = Query(None),
    gender: str | None = Query(None),
    age_min: int | None = Query(None),
    age_max: int | None = Query(None),
    vibe: str | None = Query(None),
    search: str | None = Query(None, description="Search by name or IG handle"),
    sort_by: str | None = Query(None, description="fit_score | name | followers"),
    user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    conditions = ["t.is_published = TRUE"]
    params = []
    i = 1

    if language:
        conditions.append(f"${i} = ANY(t.languages)")
        params.append(language)
        i += 1
    if content_type:
        conditions.append(f"${i} = ANY(t.content_types)")
        params.append(content_type)
        i += 1
    if gender:
        conditions.append(f"t.gender = ${i}")
        params.append(gender)
        i += 1
    if age_min:
        conditions.append(f"t.age >= ${i}")
        params.append(age_min)
        i += 1
    if age_max:
        conditions.append(f"t.age <= ${i}")
        params.append(age_max)
        i += 1
    if vibe:
        conditions.append(f"${i} = ANY(t.vibe_tags)")
        params.append(vibe)
        i += 1
    if search:
        conditions.append(f"(t.name ILIKE ${i} OR t.ig_handle ILIKE ${i} OR t.ig_username ILIKE ${i})")
        params.append(f"%{search}%")
        i += 1

    where = " AND ".join(conditions)

    brand_id_clause = ""
    if sort_by == "fit_score":
        # Join scores for this brand if available
        brand_id_clause = f"""
            LEFT JOIN brand_fit_scores bfs
              ON bfs.talent_id = t.id
              AND bfs.brand_id = (SELECT id FROM brands WHERE user_id = ${i})
        """
        params.append(user["id"])
        i += 1
        order = "bfs.score DESC NULLS LAST"
    elif sort_by == "followers":
        order = "t.ig_followers DESC"
    else:
        order = "t.name ASC"

    query = f"""
        SELECT t.*, bfs.score AS fit_score
        FROM talents t
        {brand_id_clause}
        WHERE {where}
        ORDER BY {order}
        LIMIT 100
    """
    if not brand_id_clause:
        query = f"""
            SELECT t.*, NULL::int AS fit_score
            FROM talents t
            WHERE {where}
            ORDER BY {order}
            LIMIT 100
        """

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    return [_row_to_talent(r) for r in rows]


@router.get("/admin/all", response_model=list[Talent])
async def admin_list_all_talents(_: dict = Depends(get_admin_user)):
    """Admin-only: return ALL talents regardless of published status."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT *, NULL::int AS fit_score FROM talents ORDER BY name ASC"
        )
    return [_row_to_talent(r) for r in rows]


@router.get("/{talent_id}", response_model=Talent)
async def get_talent(talent_id: UUID, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.*, bfs.score AS fit_score
            FROM talents t
            LEFT JOIN brand_fit_scores bfs
              ON bfs.talent_id = t.id
              AND bfs.brand_id = (SELECT id FROM brands WHERE user_id = $2)
            WHERE t.id = $1 AND t.is_published = TRUE
            """,
            talent_id,
            user["id"],
        )
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Talent not found")
    return _row_to_talent(row)


# Admin endpoints
@router.post("", response_model=Talent)
async def create_talent(data: TalentCreate, _: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO talents (ig_username, name, age, gender, languages, content_types,
              vibe_tags, ig_handle, tiktok_handle, ig_followers, tiktok_followers, bio,
              experience_summary, rate_card_text, photo_urls, intro_video_url,
              face_condition, hair_condition, body_condition, tc_signed)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
            RETURNING *, NULL::int AS fit_score
            """,
            data.ig_username, data.name, data.age, data.gender,
            data.languages, data.content_types, data.vibe_tags,
            data.ig_handle, data.tiktok_handle, data.ig_followers, data.tiktok_followers,
            data.bio, data.experience_summary, data.rate_card_text,
            data.photo_urls, data.intro_video_url,
            data.face_condition, data.hair_condition, data.body_condition, data.tc_signed,
        )
    return _row_to_talent(row)


@router.patch("/{talent_id}", response_model=Talent)
async def update_talent(talent_id: UUID, data: TalentUpdate, _: dict = Depends(get_admin_user)):
    pool = await get_pool()
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [talent_id] + list(updates.values())

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE talents SET {set_clause} WHERE id = $1 RETURNING *, NULL::int AS fit_score",
            *values,
        )
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Talent not found")
    return _row_to_talent(row)


@router.delete("/{talent_id}", status_code=204)
async def delete_talent(talent_id: UUID, _: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM talents WHERE id = $1", talent_id)


def _row_to_talent(row) -> Talent:
    d = dict(row)
    return Talent(**d)
