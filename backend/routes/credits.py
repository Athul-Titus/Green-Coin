"""GreenCoin — Credits Routes (balance, history, withdraw)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List
from datetime import datetime

from database import get_db, get_redis
from models.credit import CarbonCredit
from models.user import User
from routes.auth import get_current_user
from config import settings

router = APIRouter(prefix="/credits", tags=["credits"])


class CreditTx(BaseModel):
    id: str
    amount: float
    quality_score: int
    status: str
    action_type: Optional[str] = None
    minted_at: datetime

    class Config:
        from_attributes = True


class BalanceResponse(BaseModel):
    total_credits: float
    available_credits: float
    sold_credits: float
    reserved_credits: float
    inr_value: float
    tonnes_equivalent: float


from typing import Optional


@router.get("/balance", response_model=BalanceResponse)
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Try Redis cache first
    redis = get_redis()
    cache_key = f"balance:{current_user.id}"
    try:
        cached = redis.hgetall(cache_key)
        if cached:
            total = float(cached.get("total", 0))
            available = float(cached.get("available", 0))
            sold = float(cached.get("sold", 0))
            reserved = float(cached.get("reserved", 0))
            return BalanceResponse(
                total_credits=total,
                available_credits=available,
                sold_credits=sold,
                reserved_credits=reserved,
                inr_value=available * settings.CREDIT_TO_INR,
                tonnes_equivalent=available / settings.CREDITS_PER_TONNE,
            )
    except Exception:
        pass  # Redis unavailable — fall through to DB

    # Compute from DB
    rows = (
        db.query(CarbonCredit.status, func.sum(CarbonCredit.amount).label("total"))
        .filter(CarbonCredit.user_id == current_user.id)
        .group_by(CarbonCredit.status)
        .all()
    )
    totals = {row.status: float(row.total or 0) for row in rows}
    available = totals.get("available", 0.0)
    sold = totals.get("sold", 0.0)
    reserved = totals.get("reserved", 0.0)
    total = available + sold + reserved

    # Cache for 60 seconds
    try:
        redis.hset(cache_key, mapping={
            "total": total, "available": available,
            "sold": sold, "reserved": reserved,
        })
        redis.expire(cache_key, 60)
    except Exception:
        pass

    return BalanceResponse(
        total_credits=total,
        available_credits=available,
        sold_credits=sold,
        reserved_credits=reserved,
        inr_value=available * settings.CREDIT_TO_INR,
        tonnes_equivalent=available / settings.CREDITS_PER_TONNE,
    )


@router.get("/history")
def get_credit_history(
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    credits = (
        db.query(CarbonCredit)
        .filter(CarbonCredit.user_id == current_user.id)
        .order_by(desc(CarbonCredit.minted_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for c in credits:
        action_type = None
        if c.action:
            action_type = c.action.action_type_code
        result.append({
            "id": str(c.id),
            "amount": c.amount,
            "quality_score": c.quality_score,
            "status": c.status,
            "action_type": action_type,
            "minted_at": c.minted_at.isoformat(),
            "inr_value": c.amount * settings.CREDIT_TO_INR,
        })
    return result


@router.post("/withdraw")
def withdraw(
    amount: float,
    bank_account: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request a credit withdrawal (demo: just returns success)."""
    available = (
        db.query(func.sum(CarbonCredit.amount))
        .filter(
            CarbonCredit.user_id == current_user.id,
            CarbonCredit.status == "available",
        )
        .scalar() or 0.0
    )
    if amount > available:
        raise HTTPException(400, f"Insufficient credits. Available: {available:.2f}")

    return {
        "message": "Withdrawal request submitted",
        "credits_requested": amount,
        "inr_amount": amount * settings.CREDIT_TO_INR,
        "bank_account": f"****{bank_account[-4:]}",
        "estimated_settlement": "2-3 business days",
        "status": "processing",
    }
