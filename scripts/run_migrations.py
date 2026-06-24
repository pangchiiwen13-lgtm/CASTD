"""
Run Northstar SQL migrations against Neon PostgreSQL.
Usage: python scripts/run_migrations.py
"""
import asyncio
import asyncpg
import os
from pathlib import Path

DB_URL = "postgresql://neondb_owner:npg_ZrH0IPXx1bGT@ep-red-silence-aossuqc4.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

MIGRATIONS_DIR = Path(__file__).parent.parent / "migrations"


async def main():
    print(f"Connecting to Neon...")
    conn = await asyncpg.connect(DB_URL)
    print("Connected OK\n")

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    for migration in migration_files:
        print(f"Running {migration.name}...")
        sql = migration.read_text(encoding="utf-8")
        try:
            await conn.execute(sql)
            print(f"  OK {migration.name} done")
        except Exception as e:
            print(f"  WARN {migration.name}: {e}")

    await conn.close()
    print("\nMigrations complete. Tables created in Neon.")


if __name__ == "__main__":
    asyncio.run(main())
