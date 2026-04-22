"""
GreenCoin — Credit Minter Service
Calculates, creates, and records carbon credit transactions.
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Any

from sqlalchemy.orm import Session
from models.credit import CarbonCredit
from models.action import GreenAction
from config import settings

logger = logging.getLogger(__name__)

# Base credit rates per unit
ACTION_RATES = {
    "cycling_commute":  4.0,
    "public_transport": 2.0,
    "plant_based_meal": 5.0,
    "solar_energy":     10.0,
    "composting":       3.0,
    "ev_charging":      8.0,
    "led_switch":       20.0,
    "no_flight":        50.0,
}


class CreditMinter:
    """
    Mints CarbonCredit records when an action is verified.
    
    Formula:
        base_credits = quantity × rate_per_unit
        quality_multiplier = 0.5 + (trust_score / 200)  [range: 0.5 – 1.0]
        credits_minted = base_credits × quality_multiplier
    """

    def __init__(self, db: Session):
        self.db = db

    def _quality_multiplier(self, trust_score: int) -> float:
        """Map trust score (0-100) to a [0.5, 1.0] quality multiplier."""
        return 0.5 + (trust_score / 200.0)

    def _quality_score(self, trust_score: int) -> int:
        """Map trust score to quality score (same scale, used for bundle quality)."""
        return min(100, int(trust_score * 0.95 + 5))

    def mint(self, action: GreenAction, trust_score: int) -> Dict[str, Any]:
        """
        Create a CarbonCredit record for a verified action.
        Updates Redis balance cache.
        
        Returns: {credits_minted, new_balance, quality_score}
        """
        rate = ACTION_RATES.get(action.action_type_code, 1.0)
        base_credits = action.quantity * rate
        multiplier = self._quality_multiplier(trust_score)
        credits_minted = round(base_credits * multiplier, 2)
        quality_score = self._quality_score(trust_score)

        credit = CarbonCredit(
            user_id=action.user_id,
            action_id=action.id,
            amount=credits_minted,
            quality_score=quality_score,
            status="available",
        )
        self.db.add(credit)
        self.db.flush()

        # Update Redis balance cache
        new_balance = self._update_balance_cache(str(action.user_id), credits_minted)

        logger.info(
            "💰 Minted %.2f credits for user %s (action: %s, trust: %d)",
            credits_minted, action.user_id, action.action_type_code, trust_score
        )

        return {
            "credits_minted": credits_minted,
            "base_credits": round(base_credits, 2),
            "quality_multiplier": round(multiplier, 3),
            "quality_score": quality_score,
            "new_balance": new_balance,
            "credit_id": str(credit.id),
            "inr_value": round(credits_minted * settings.CREDIT_TO_INR, 2),
        }

    def _update_balance_cache(self, user_id: str, amount: float) -> float:
        """Increment user's available balance in Redis. Returns new total."""
        try:
            from database import get_redis
            redis = get_redis()
            cache_key = f"balance:{user_id}"
            # Increment available balance
            redis.hincrbyfloat(cache_key, "available", amount)
            redis.hincrbyfloat(cache_key, "total", amount)
            redis.expire(cache_key, 300)
            new_balance = float(redis.hget(cache_key, "available") or amount)
            return round(new_balance, 2)
        except Exception as e:
            logger.debug(f"Redis balance update skipped: {e}")
            return 0.0
