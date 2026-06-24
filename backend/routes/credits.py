from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, CarbonCredit, GreenAction
from routes.auth import get_current_user

router = APIRouter()

@router.get("/balance")
async def get_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return {
        "total_credits":     current_user.total_credits,
        "available_credits": current_user.available_credits,
        "held_credits":      current_user.total_credits - 
                             current_user.available_credits,
        "inr_value":         current_user.available_credits,
    }

@router.get("/history")
async def get_credit_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    credits = db.query(CarbonCredit).filter(
        CarbonCredit.user_id == current_user.id
    ).order_by(CarbonCredit.created_at.desc()).limit(50).all()

    return credits
