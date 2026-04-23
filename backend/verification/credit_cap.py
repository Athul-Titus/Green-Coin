"""
GreenCoin Verification — Credit Cap System
Enforces daily/monthly velocity limits to prevent massive fraud draining corporate pools.
"""
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.action import GreenAction
from models.verification import UserTrustScore

logger = logging.getLogger("greencoin.verification.credit_cap")

class CreditCapSystem:
    def __init__(self, db: Session):
        self.db = db
        
        # Base limits before trust multipliers
        self.DAILY_LIMIT_BASE = 500
        self.MONTHLY_LIMIT_BASE = 5000
        self.PER_ACTION_LIMIT_BASE = 150

    def get_user_limits(self, user_id: str) -> tuple[int, int, int]:
        """
        Calculate dynamic limits based on user trust score.
        Trusted users get higher caps.
        """
        trust = self.db.query(UserTrustScore).filter(UserTrustScore.user_id == user_id).first()
        score = trust.score if trust else 0.5
        
        # Multiplier scales from 0.5x to 3.0x based on trust
        multiplier = 0.5 + (score * 2.5)
        
        daily = int(self.DAILY_LIMIT_BASE * multiplier)
        monthly = int(self.MONTHLY_LIMIT_BASE * multiplier)
        per_action = int(self.PER_ACTION_LIMIT_BASE * multiplier)
        
        return daily, monthly, per_action

    def check_and_apply_caps(self, user_id: str, requested_credits: int) -> tuple[int, list]:
        """
        Check if requested credits exceed limits.
        Returns the safe amount to award (capped) and any flags generated.
        """
        flags = []
        daily_limit, monthly_limit, per_action_limit = self.get_user_limits(user_id)
        
        # 1. Per Action Cap
        awarded_credits = min(requested_credits, per_action_limit)
        if requested_credits > per_action_limit:
            flags.append("PER_ACTION_LIMIT_EXCEEDED")
            
        # 2. Daily Velocity Check
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_total_query = self.db.query(func.sum(GreenAction.credits_earned)).filter(
            GreenAction.user_id == user_id,
            GreenAction.timestamp >= today_start
        ).scalar()
        
        daily_total = daily_total_query or 0
        
        if daily_total + awarded_credits > daily_limit:
            available_today = max(0, daily_limit - daily_total)
            awarded_credits = min(awarded_credits, available_today)
            flags.append("DAILY_LIMIT_EXCEEDED")
            
        # 3. Monthly Velocity Check
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_total_query = self.db.query(func.sum(GreenAction.credits_earned)).filter(
            GreenAction.user_id == user_id,
            GreenAction.timestamp >= month_start
        ).scalar()
        
        monthly_total = monthly_total_query or 0
        
        if monthly_total + awarded_credits > monthly_limit:
            available_this_month = max(0, monthly_limit - monthly_total)
            awarded_credits = min(awarded_credits, available_this_month)
            flags.append("MONTHLY_LIMIT_EXCEEDED")
            
        return awarded_credits, flags
