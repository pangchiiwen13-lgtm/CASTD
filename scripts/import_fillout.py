"""
One-time import from FillOut form submissions into Northstar PostgreSQL (Neon).

FillOut API: GET https://api.fillout.com/v1/api/forms/3jhguC1BD9us/submissions
Auth: Bearer sk_prod_...

Usage:
  python scripts/import_fillout.py

Requires:
  pip install httpx asyncpg python-dotenv
  FILLOUT_API_KEY and DATABASE_URL in .env (at scripts/ level or root)
"""
import asyncio
import httpx
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

FILLOUT_API_KEY = os.getenv("FILLOUT_API_KEY", "sk_prod_ABd0QWtz925gDLYmDjXyaH6r3vK0Ta59RsY4kaB37y9U1ORMwtNDX8PjiZOzD7uGmEt9FYPizdIvzez3n2VKrxVdBs2NoV8XuRv_53097")
FILLOUT_FORM_ID = "3jhguC1BD9us"
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_ZrH0IPXx1bGT@ep-red-silence-aossuqc4.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
).replace("postgresql+asyncpg://", "postgresql://")


def extract_answer(questions: list[dict], label_fragment: str) -> str | None:
    """Case-insensitive substring match on question label."""
    for q in questions:
        if label_fragment.lower() in q.get("name", "").lower():
            v = q.get("value")
            if isinstance(v, list):
                return ", ".join(str(x) for x in v)
            return str(v) if v is not None else None
    return None


def parse_submission(sub: dict) -> dict:
    qs = sub.get("questions", [])
    ig_handle = extract_answer(qs, "instagram") or extract_answer(qs, "ig handle") or ""
    ig_username = ig_handle.lstrip("@").lower()
    name = extract_answer(qs, "name") or ig_username or "Unknown"
    age_str = extract_answer(qs, "age") or ""
    phone = extract_answer(qs, "phone") or extract_answer(qs, "whatsapp") or ""

    langs_raw = extract_answer(qs, "language") or ""
    languages = [l.strip() for l in langs_raw.split(",") if l.strip()] if langs_raw else []

    content_raw = extract_answer(qs, "content") or extract_answer(qs, "type of content") or ""
    content_types = [c.strip() for c in content_raw.split(",") if c.strip()]

    experience = extract_answer(qs, "experience") or extract_answer(qs, "past work") or ""

    try:
        age = int(age_str.strip())
    except ValueError:
        age = None

    return {
        "ig_username": ig_username or f"unknown_{sub.get('submissionId', '')[:8]}",
        "name": name,
        "age": age,
        "ig_handle": ig_handle.lstrip("@") if ig_handle else None,
        "languages": languages,
        "content_types": content_types,
        "experience_summary": experience or None,
        "bio": extract_answer(qs, "bio") or extract_answer(qs, "about") or None,
    }


async def main():
    if not DATABASE_URL:
        print("DATABASE_URL not set in .env")
        return

    # Fetch all submissions from FillOut
    print("Fetching FillOut submissions...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.fillout.com/v1/api/forms/{FILLOUT_FORM_ID}/submissions",
            headers={"Authorization": f"Bearer {FILLOUT_API_KEY}"},
            params={"limit": 150},
        )
    resp.raise_for_status()
    submissions = resp.json().get("responses", [])
    print(f"  Got {len(submissions)} submissions")

    # Connect to Neon
    print(f"Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)

    inserted = 0
    skipped = 0
    for sub in submissions:
        talent = parse_submission(sub)
        if not talent["ig_username"] or talent["ig_username"].startswith("unknown_"):
            print(f"  SKIP: no IG handle — submissionId={sub.get('submissionId')}")
            skipped += 1
            continue

        try:
            await conn.execute(
                """
                INSERT INTO talents (ig_username, name, age, ig_handle, languages,
                  content_types, experience_summary, bio)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                ON CONFLICT (ig_username) DO UPDATE SET
                  name = EXCLUDED.name,
                  age = EXCLUDED.age,
                  ig_handle = EXCLUDED.ig_handle,
                  languages = EXCLUDED.languages,
                  content_types = EXCLUDED.content_types,
                  experience_summary = EXCLUDED.experience_summary,
                  bio = EXCLUDED.bio
                """,
                talent["ig_username"], talent["name"], talent["age"], talent["ig_handle"],
                talent["languages"], talent["content_types"], talent["experience_summary"], talent["bio"],
            )
            print(f"  OK  {talent['ig_username']} ({talent['name']})")
            inserted += 1
        except Exception as e:
            print(f"  ERR {talent['ig_username']}: {e}")
            skipped += 1

    await conn.close()
    print(f"\nDone: {inserted} inserted/updated, {skipped} skipped.")
    print("\nNext steps:")
    print("  1. Log into the admin panel at /admin/talents")
    print("  2. Add photos, vibe_tags, content_types for each talent")
    print("  3. Toggle is_published = true when a profile is complete")


if __name__ == "__main__":
    asyncio.run(main())
