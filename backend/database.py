"""
GreenCoin — Database Setup
SQLAlchemy engine, session factory, and base model.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import redis
import logging

from config import settings

logger = logging.getLogger(__name__)

# ── PostgreSQL ────────────────────────────────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Redis ─────────────────────────────────────────────────────────────────────
redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    """Return the shared Redis client, initialize if needed."""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=3,
        )
    return redis_client


def init_db():
    """Create all tables (idempotent). Called on app startup."""
    from models import user, action, credit, corporate  # noqa: F401 — registers models
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables initialized")


def ping_redis() -> bool:
    """Health-check Redis connection."""
    try:
        client = get_redis()
        client.ping()
        logger.info("✅ Redis connected")
        return True
    except Exception as e:
        logger.warning(f"⚠️  Redis unavailable: {e} — credit cache disabled")
        return False
