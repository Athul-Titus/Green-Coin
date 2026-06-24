from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# SQLite database file path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'greencoin.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    # check_same_thread=False is REQUIRED for SQLite + FastAPI
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# Dependency — use this in all routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
