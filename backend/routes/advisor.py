"""GreenCoin — Advisor Routes (plan, forecast, peers)"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models.user import User
from routes.auth import get_current_user
from ml.green_advisor import GreenAdvisor
from ml.credit_forecaster import CreditForecaster

router = APIRouter(prefix="/advisor", tags=["advisor"])


@router.get("/plan")
def get_advisor_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get personalized green action plan for the current user."""
    advisor = GreenAdvisor()
    profile = current_user.lifestyle_profile or {}
    profile["city"] = current_user.city
    profile["neighborhood_type"] = current_user.neighborhood_type

    plan = advisor.generate_plan(profile)
    return {
        "user_id": str(current_user.id),
        "cluster": plan["cluster"],
        "recommendations": plan["recommendations"],
        "projected_monthly_credits": plan["projected_monthly_credits"],
        "green_score": current_user.green_score,
    }


@router.get("/forecast")
def get_forecast(
    months: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get LSTM-based credit earnings forecast."""
    forecaster = CreditForecaster()
    # Get last 90 days of credit history
    from models.credit import CarbonCredit
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=90)
    credits = (
        db.query(CarbonCredit)
        .filter(
            CarbonCredit.user_id == current_user.id,
            CarbonCredit.minted_at >= cutoff,
        )
        .order_by(CarbonCredit.minted_at)
        .all()
    )
    history = [{"date": c.minted_at.isoformat(), "amount": c.amount} for c in credits]
    result = forecaster.forecast_earnings(str(current_user.id), history, months=months)
    return result


@router.get("/peers")
def get_peer_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get peer comparison data for users in same cluster."""
    advisor = GreenAdvisor()
    profile = current_user.lifestyle_profile or {}
    cluster_info = advisor.get_cluster_stats(profile)

    # Calculate user's own monthly average
    from models.credit import CarbonCredit
    from datetime import datetime, timedelta
    from sqlalchemy import func
    cutoff = datetime.utcnow() - timedelta(days=30)
    user_monthly = (
        db.query(func.sum(CarbonCredit.amount))
        .filter(
            CarbonCredit.user_id == current_user.id,
            CarbonCredit.minted_at >= cutoff,
        )
        .scalar() or 0.0
    )

    return {
        "your_monthly_credits": round(user_monthly, 2),
        "your_monthly_inr": round(user_monthly * 50, 2),
        "peer_cluster": cluster_info["label"],
        "peer_avg_monthly_credits": cluster_info["avg_monthly_credits"],
        "peer_avg_monthly_inr": cluster_info["avg_monthly_inr"],
        "top_earner_monthly_credits": cluster_info["top_earner_monthly_credits"],
        "your_percentile": cluster_info.get("percentile", 50),
        "message": f"Users like you in {cluster_info['label']} earn ₹{cluster_info['avg_monthly_inr']:,.0f}/month on average",
    }
