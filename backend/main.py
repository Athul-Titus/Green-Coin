from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
import models  # ensures all models are registered

# Import all routers
from routes.auth import router as auth_router
from routes.actions import router as actions_router
from routes.credits import router as credits_router
from routes.advisor import router as advisor_router
from routes.marketplace import router as marketplace_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    yield
    print("🔴 Shutting down")

app = FastAPI(
    title="GreenCoin API",
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS — CRITICAL FIX ───────────────────────
# This is the most common cause of "Registration failed"
# Frontend on :5174 must be allowed to call backend on :8000

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ───────────────────────
app.include_router(auth_router,        prefix="/auth",        tags=["auth"])
app.include_router(actions_router,     prefix="/actions",     tags=["actions"])
app.include_router(credits_router,     prefix="/credits",     tags=["credits"])
app.include_router(advisor_router,     prefix="/advisor",     tags=["advisor"])
app.include_router(marketplace_router, prefix="/marketplace", tags=["marketplace"])

@app.get("/")
async def root():
    return {"status": "GreenCoin API running ✅"}

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}
