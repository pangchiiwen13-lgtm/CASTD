"""Quick DB verification — lists all tables and their columns."""
import asyncio
import asyncpg

DB_URL = "postgresql://neondb_owner:npg_ZrH0IPXx1bGT@ep-red-silence-aossuqc4.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

async def main():
    conn = await asyncpg.connect(DB_URL)

    tables = await conn.fetch("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)

    print(f"Tables in Northstar database ({len(tables)} found):\n")
    for t in tables:
        cols = await conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        """, t["table_name"])
        print(f"  {t['table_name']} ({len(cols)} columns)")
        for c in cols[:4]:
            print(f"    - {c['column_name']} ({c['data_type']})")
        if len(cols) > 4:
            print(f"    ... +{len(cols)-4} more")
        print()

    await conn.close()

asyncio.run(main())
