from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import CreditBundle
from routes.auth import get_current_user

router = APIRouter()

@router.get("/bundles")
async def list_bundles(
    db: Session = Depends(get_db)
):
    bundles = db.query(CreditBundle).filter(
        CreditBundle.status == "available"
    ).all()

    # If no bundles exist, return sample data for demo
    if not bundles:
        return [
            {
                "id":              "bundle-001",
                "name":            "Kerala Cycling Bundle #1",
                "total_credits":   1250,
                "total_users":     243,
                "action_types":    ["cycling", "walking"],
                "quality_score":   94.0,
                "price_per_tonne": 15.0,
                "total_price":     18750,
                "status":          "available",
            },
            {
                "id":              "bundle-002",
                "name":            "South India Solar Bundle #3",
                "total_credits":   2100,
                "total_users":     89,
                "action_types":    ["solar_energy", "ev_charging"],
                "quality_score":   97.0,
                "price_per_tonne": 18.0,
                "total_price":     37800,
                "status":          "available",
            },
            {
                "id":              "bundle-003",
                "name":            "Mixed Green Bundle #7",
                "total_credits":   800,
                "total_users":     156,
                "action_types":    ["plant_based_meal",
                                   "composting", "led_switch"],
                "quality_score":   88.0,
                "price_per_tonne": 12.0,
                "total_price":     9600,
                "status":          "available",
            },
        ]

    return bundles
