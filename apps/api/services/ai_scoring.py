"""
Brand-fit scoring using DeepSeek. Adapted from talent_recruitment/ai_handler.py.
Brand-level scores are cached in brand_fit_scores.
Campaign-level scores (preferred) are cached in campaign_fit_scores.
"""
import json
from openai import AsyncOpenAI
from config import settings
from database import get_pool

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url="https://api.deepseek.com",
        )
    return _client


SYSTEM_PROMPT = (
    'You score talent-brand fit for a casting platform. '
    'Return ONLY valid JSON: {"score": <0-100>, "rationale": "<1 sentence>"}'
)

# Generic brand-level scoring (fallback when no campaign context)
BRAND_TEMPLATE = """
Brand:
- Industry: {industry}
- Values: {brand_values}
- Target audience: {target_audience}
- Campaign type: {campaign_type}
- Aesthetic: {aesthetic_tags}

Talent:
- Content types: {content_types}
- Vibe: {vibe_tags}
- Languages: {languages}
- Age: {age}, Gender: {gender}
- Experience: {experience_summary}

Score how well this talent fits this brand for on-screen video content.
Consider: audience alignment, aesthetic match, content style fit, demographic fit.
""".strip()

# Campaign-level scoring (specific criteria per project)
CAMPAIGN_TEMPLATE = """
Campaign:
- Name: {name}
- Type: {campaign_type}
- Brief: {brief}
- Looking for: {target_gender} talent, ages {age_range}, speaking {languages}
- Min followers: {min_followers}
- Content needed: {content_types}
- Vibe/aesthetic: {vibe_tags}

Talent:
- Content types: {talent_content_types}
- Vibe: {talent_vibe_tags}
- Languages: {talent_languages}
- Age: {talent_age}, Gender: {talent_gender}
- IG followers: {talent_followers}
- Experience: {talent_experience}

Score (0-100) how well this talent fits this specific campaign.
Weight heavily: content type match, vibe match, gender/age if specified, follower requirement.
""".strip()


async def score_talent_for_brand(brand: dict, talent: dict) -> tuple[int, str]:
    prompt = BRAND_TEMPLATE.format(
        industry=brand.get("industry") or "Not specified",
        brand_values=", ".join(brand.get("brand_values") or []) or "Not specified",
        target_audience=json.dumps(brand.get("target_audience") or {}),
        campaign_type=brand.get("campaign_type") or "Not specified",
        aesthetic_tags=", ".join(brand.get("aesthetic_tags") or []) or "Not specified",
        content_types=", ".join(talent.get("content_types") or []) or "Not specified",
        vibe_tags=", ".join(talent.get("vibe_tags") or []) or "Not specified",
        languages=", ".join(talent.get("languages") or []) or "Not specified",
        age=talent.get("age") or "Not specified",
        gender=talent.get("gender") or "Not specified",
        experience_summary=talent.get("experience_summary") or "Not specified",
    )
    client = _get_client()
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    result = json.loads(response.choices[0].message.content)
    return int(result.get("score", 50)), result.get("rationale", "")


async def score_talent_for_campaign(project: dict, talent: dict) -> tuple[int, str]:
    age_min = project.get("target_age_min")
    age_max = project.get("target_age_max")
    if age_min and age_max:
        age_range = f"{age_min}-{age_max}"
    elif age_min:
        age_range = f"{age_min}+"
    elif age_max:
        age_range = f"up to {age_max}"
    else:
        age_range = "any"

    min_followers = project.get("target_min_followers")
    followers_str = f"{min_followers:,}" if min_followers else "no minimum"

    prompt = CAMPAIGN_TEMPLATE.format(
        name=project.get("name") or "Not specified",
        campaign_type=project.get("campaign_type") or "Not specified",
        brief=project.get("brief_text") or "Not specified",
        target_gender=project.get("target_gender") or "any",
        age_range=age_range,
        languages=", ".join(project.get("target_languages") or []) or "any",
        min_followers=followers_str,
        content_types=", ".join(project.get("target_content_types") or []) or "any",
        vibe_tags=", ".join(project.get("target_vibe_tags") or []) or "any",
        talent_content_types=", ".join(talent.get("content_types") or []) or "Not specified",
        talent_vibe_tags=", ".join(talent.get("vibe_tags") or []) or "Not specified",
        talent_languages=", ".join(talent.get("languages") or []) or "Not specified",
        talent_age=talent.get("age") or "Not specified",
        talent_gender=talent.get("gender") or "Not specified",
        talent_followers=talent.get("ig_followers") or 0,
        talent_experience=talent.get("experience_summary") or "Not specified",
    )
    client = _get_client()
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    result = json.loads(response.choices[0].message.content)
    return int(result.get("score", 50)), result.get("rationale", "")


def _has_criteria(project: dict) -> bool:
    return any([
        project.get("target_content_types"),
        project.get("target_languages"),
        project.get("target_gender"),
        project.get("target_vibe_tags"),
        project.get("target_min_followers"),
        project.get("brief_text"),
    ])


async def trigger_scoring_for_brand(brand_id: str):
    """Compute and cache generic fit scores for all published talents for this brand."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        brand = await conn.fetchrow("SELECT * FROM brands WHERE id = $1", brand_id)
        if not brand:
            return
        talents = await conn.fetch("SELECT * FROM talents WHERE is_published = TRUE")

    for talent in talents:
        try:
            score, rationale = await score_talent_for_brand(dict(brand), dict(talent))
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO brand_fit_scores (brand_id, talent_id, score, rationale, computed_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (brand_id, talent_id) DO UPDATE
                      SET score = EXCLUDED.score,
                          rationale = EXCLUDED.rationale,
                          computed_at = NOW()
                    """,
                    brand_id, talent["id"], score, rationale,
                )
        except Exception as e:
            print(f"Brand scoring error for talent {talent['id']}: {e}")


async def trigger_scoring_for_campaign(project_id: str):
    """Compute and cache fit scores for all published talents against this campaign's criteria."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        project = await conn.fetchrow("SELECT * FROM brand_projects WHERE id = $1", project_id)
        if not project:
            return
        project_dict = dict(project)
        if not _has_criteria(project_dict):
            return  # No criteria set - skip scoring
        talents = await conn.fetch("SELECT * FROM talents WHERE is_published = TRUE")

    for talent in talents:
        try:
            score, rationale = await score_talent_for_campaign(project_dict, dict(talent))
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO campaign_fit_scores (project_id, talent_id, score, rationale, computed_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (project_id, talent_id) DO UPDATE
                      SET score = EXCLUDED.score,
                          rationale = EXCLUDED.rationale,
                          computed_at = NOW()
                    """,
                    project_id, talent["id"], score, rationale,
                )
        except Exception as e:
            print(f"Campaign scoring error for talent {talent['id']}: {e}")
