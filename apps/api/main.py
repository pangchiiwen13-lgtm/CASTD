from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import get_pool, close_pool
from config import settings
from auth import get_admin_user
from routers import talents, brands, inquiries, shortlists, confirmations, notifications, admin_settings, superstar, ratings, campaigns


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()  # warm up connection pool
    yield
    await close_pool()


app = FastAPI(title="CASTD API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(talents.router)
app.include_router(brands.router)
app.include_router(inquiries.router)
app.include_router(shortlists.router)
app.include_router(confirmations.router)
app.include_router(notifications.router)
app.include_router(admin_settings.router)
app.include_router(superstar.router)
app.include_router(ratings.router)
app.include_router(campaigns.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "castd-api"}


@app.get("/public/stats")
async def public_stats():
    """Real-time platform metrics for the landing page. No auth required."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        superstars = await conn.fetchval(
            "SELECT COUNT(*) FROM talents WHERE is_published = TRUE"
        )
        brands = await conn.fetchval("SELECT COUNT(*) FROM brands")
        completed = await conn.fetchval(
            "SELECT COUNT(*) FROM inquiries WHERE status IN ('confirmed', 'closed')"
        )
    return {
        "superstars": int(superstars),
        "brands": int(brands),
        "completed_matches": int(completed),
    }


@app.get("/admin/stats")
async def admin_stats(_: dict = Depends(get_admin_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        talent_total = await conn.fetchval("SELECT COUNT(*) FROM talents")
        talent_published = await conn.fetchval("SELECT COUNT(*) FROM talents WHERE is_published = TRUE")
        brand_count = await conn.fetchval("SELECT COUNT(*) FROM brands")
        inquiry_total = await conn.fetchval("SELECT COUNT(*) FROM inquiries")
        inquiry_open = await conn.fetchval("SELECT COUNT(*) FROM inquiries WHERE status = 'open'")
        inquiry_confirmed = await conn.fetchval("SELECT COUNT(*) FROM inquiries WHERE status = 'confirmed'")
        superstar_pending = await conn.fetchval(
            "SELECT COUNT(*) FROM talents WHERE profile_status = 'pending' AND is_published = FALSE AND user_id IS NOT NULL"
        )
    return {
        "talents": {"total": talent_total, "published": talent_published, "draft": talent_total - talent_published},
        "brands": {"total": brand_count},
        "inquiries": {"total": inquiry_total, "open": inquiry_open, "confirmed": inquiry_confirmed},
        "superstars_pending_approval": superstar_pending,
    }
