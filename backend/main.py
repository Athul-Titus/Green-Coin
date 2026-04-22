"""
GreenCoin — FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from config import settings
from database import init_db, ping_redis

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("greencoin")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info(f"🌱 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"   Demo mode: {'ON ✓' if settings.DEMO_MODE else 'OFF'}")
    init_db()
    ping_redis()
    # Pre-warm ML models
    from ml.trust_verify import TrustVerifier
    from ml.green_advisor import GreenAdvisor
    TrustVerifier()  # trains IsolationForest on synthetic data
    GreenAdvisor()   # fits KMeans
    logger.info("🤖 ML models ready")
    yield
    logger.info("👋 GreenCoin shutting down")


app = FastAPI(
    title="GreenCoin API",
    description="AI-powered carbon credit marketplace",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (certificates) ───────────────────────────────────────────────
os.makedirs("certificates", exist_ok=True)
app.mount("/certificates", StaticFiles(directory="certificates"), name="certificates")

# ── Routers ───────────────────────────────────────────────────────────────────
from routes.auth import router as auth_router
from routes.actions import router as actions_router
from routes.credits import router as credits_router
from routes.marketplace import router as marketplace_router
from routes.advisor import router as advisor_router
from routes.demo import router as demo_router

app.include_router(auth_router)
app.include_router(actions_router)
app.include_router(credits_router)
app.include_router(marketplace_router)
app.include_router(advisor_router)
app.include_router(demo_router)


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
    }


@app.get("/", tags=["root"])
def root():
    return {
        "message": f"🌱 Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "demo": "POST /demo/run",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.BACKEND_PORT, reload=settings.DEBUG)
