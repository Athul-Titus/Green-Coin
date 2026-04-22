"""
GreenCoin — Configuration
Reads all settings from environment / .env file.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────
    APP_NAME: str = "GreenCoin"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    BACKEND_PORT: int = 8000

    # ── Database ─────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./greencoin.db"

    # ── Redis ────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Auth ─────────────────────────────────────────
    JWT_SECRET: str = "dev_secret_please_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # ── Demo Mode ────────────────────────────────────
    DEMO_MODE: bool = True  # Uses mock APIs — no real keys required

    # ── External APIs ────────────────────────────────
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_VISION_API_KEY: str = ""
    CLAUDE_API_KEY: str = ""
    MAPBOX_TOKEN: str = ""

    # ── Credit Economy ───────────────────────────────
    CREDIT_TO_INR: float = 50.0          # 1 credit = ₹50
    CREDITS_PER_TONNE: float = 100.0     # 100 credits = 1 tonne CO₂

    # ── CORS ─────────────────────────────────────────
    USER_FRONTEND_URL: str = "http://localhost:5173"
    CORP_FRONTEND_URL: str = "http://localhost:5174"

    @property
    def allowed_origins(self) -> List[str]:
        return [
            self.USER_FRONTEND_URL,
            self.CORP_FRONTEND_URL,
            "http://localhost:3000",
            "http://localhost:5175",
        ]

    # ── Action Type Rates ────────────────────────────
    ACTION_RATES: dict = {
        "cycling_commute":  {"rate": 4,  "unit": "km",       "max_daily": 60},
        "public_transport": {"rate": 2,  "unit": "km",       "max_daily": 100},
        "plant_based_meal": {"rate": 5,  "unit": "meal",     "max_daily": 25},
        "solar_energy":     {"rate": 10, "unit": "kWh",      "max_daily": 500},
        "composting":       {"rate": 3,  "unit": "kg",       "max_daily": 30},
        "ev_charging":      {"rate": 8,  "unit": "kWh",      "max_daily": 200},
        "led_switch":       {"rate": 20, "unit": "one-time", "max_daily": 20},
        "no_flight":        {"rate": 50, "unit": "flight",   "max_daily": 50},
    }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
