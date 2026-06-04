"""
Brand-fit scoring using DeepSeek. Adapted from talent_recruitment/ai_handler.py.
Scores are 0–100 and cached in brand_fit_scores table.
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

USER_TEMPLATE = """
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


async def score_talent_for_brand(brand: dict, talent: dict) -> tuple[int, str]:
    prompt = USER_TEMPLATE.format(
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


async def trigger_scoring_for_brand(brand_id: str):
    """Compute and cache fit scores for all published talents for this brand."""
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
            print(f"Scoring error for talent {talent['id']}: {e}")
