from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db
from models import User, GreenAction, CarbonCredit
from routes.auth import get_current_user

router = APIRouter()

# Credit rates per action type
CREDIT_RATES = {
    "cycling":           4,   # per km
    "walking":           2,   # per km
    "plant_based_meal":  15,  # per meal
    "solar_energy":      10,  # per kWh
    "public_transport":  2,   # per km
    "composting":        3,   # per kg
    "ev_charging":       8,   # per kWh
    "led_switch":        20,  # one-time
}

class LogActionRequest(BaseModel):
    action_type:     str
    quantity:        float   # km / meals / kWh / kg
    proof_data:      Optional[dict] = None

class ActionResponse(BaseModel):
    id:              str
    action_type:     str
    claimed_credits: int
    awarded_credits: int
    trust_score:     float
    status:          str
    created_at:      datetime

    class Config:
        from_attributes = True

@router.post("/log", response_model=ActionResponse)
async def log_action(
    request: LogActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate credits
    rate = CREDIT_RATES.get(request.action_type, 5)
    claimed_credits = int(rate * request.quantity)

    # Simple trust score for now (ML layer adds later)
    trust_score = 75.0

    # Apply trust multiplier
    awarded_credits = int(claimed_credits * (trust_score / 100))

    # Create action record
    action = GreenAction(
        user_id         = current_user.id,
        action_type     = request.action_type,
        claimed_credits = claimed_credits,
        awarded_credits = awarded_credits,
        trust_score     = trust_score,
        status          = "verified",
        proof_data      = request.proof_data or {},
    )
    db.add(action)

    # Mint carbon credits
    credit = CarbonCredit(
        user_id       = current_user.id,
        action_id     = action.id,
        amount        = awarded_credits,
        status        = "available",
        quality_score = trust_score,
    )
    db.add(credit)

    # Update user totals
    current_user.total_credits     += awarded_credits
    current_user.available_credits += awarded_credits

    db.commit()
    db.refresh(action)

    return action

@router.get("/history")
async def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actions = db.query(GreenAction).filter(
        GreenAction.user_id == current_user.id
    ).order_by(GreenAction.created_at.desc()).limit(50).all()

    return actions

@router.get("/types")
async def get_action_types():
    return [
        {
            "type": k,
            "credit_rate": v,
            "unit": "km" if k in ["cycling","walking",
                                   "public_transport"]
                    else "meal" if k == "plant_based_meal"
                    else "kWh" if k in ["solar_energy",
                                        "ev_charging"]
                    else "kg" if k == "composting"
                    else "one-time"
        }
        for k, v in CREDIT_RATES.items()
    ]
