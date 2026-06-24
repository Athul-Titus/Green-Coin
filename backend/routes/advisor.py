from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routes.auth import get_current_user

router = APIRouter()

# Action recommendations with credit projections
RECOMMENDATIONS = {
    "urban": [
        {"action": "cycling",          "monthly_credits": 120,
         "tip": "Cycle to work 3x/week"},
        {"action": "plant_based_meal", "monthly_credits": 90,
         "tip": "Switch 2 meals/day to plant-based"},
        {"action": "public_transport", "monthly_credits": 60,
         "tip": "Use metro instead of cab"},
        {"action": "led_switch",       "monthly_credits": 20,
         "tip": "Switch all bulbs to LED"},
        {"action": "composting",       "monthly_credits": 30,
         "tip": "Compost kitchen waste daily"},
    ],
    "suburban": [
        {"action": "solar_energy",     "monthly_credits": 200,
         "tip": "Install solar water heater"},
        {"action": "ev_charging",      "monthly_credits": 160,
         "tip": "Switch to EV for daily commute"},
        {"action": "plant_based_meal", "monthly_credits": 90,
         "tip": "Reduce meat to 3x/week"},
        {"action": "composting",       "monthly_credits": 30,
         "tip": "Compost kitchen and garden waste"},
        {"action": "led_switch",       "monthly_credits": 20,
         "tip": "LED lighting throughout home"},
    ],
    "default": [
        {"action": "plant_based_meal", "monthly_credits": 90,
         "tip": "Start with plant-based meals"},
        {"action": "cycling",          "monthly_credits": 80,
         "tip": "Cycle for short trips"},
        {"action": "composting",       "monthly_credits": 30,
         "tip": "Compost kitchen waste"},
        {"action": "led_switch",       "monthly_credits": 20,
         "tip": "Switch to LED bulbs"},
        {"action": "public_transport", "monthly_credits": 60,
         "tip": "Use public transport"},
    ]
}

@router.get("/plan")
async def get_plan(
    current_user: User = Depends(get_current_user)
):
    neighborhood = current_user.neighborhood_type or "default"
    recs = RECOMMENDATIONS.get(neighborhood,
                               RECOMMENDATIONS["default"])

    total_monthly = sum(r["monthly_credits"] for r in recs)

    return {
        "user_id":          current_user.id,
        "recommendations":  recs,
        "projected_monthly_min": int(total_monthly * 0.7),
        "projected_monthly_max": int(total_monthly * 1.2),
        "user_segment":     neighborhood,
    }

@router.get("/forecast")
async def get_forecast(
    current_user: User = Depends(get_current_user)
):
    # Simple forecast based on current balance
    base = current_user.total_credits
    return {
        "month_1": int(base * 1.1),
        "month_2": int(base * 1.2),
        "month_3": int(base * 1.35),
        "trend":   "increasing",
    }
