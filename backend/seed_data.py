"""
GreenCoin — Database Seed Script
Creates demo users, 90 days of action history, credit bundles, and completed purchase.
Run: python seed_data.py
"""
import sys
import os
import uuid
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DEMO_MODE", "True")

from database import SessionLocal, init_db, engine
from models.user import User
from models.action import GreenAction
from models.credit import CarbonCredit, CreditBundle, BundlePurchase, ESGCertificate
import hashlib

def hash_pw(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

ACTION_RATES = {
    "cycling_commute": 4, "public_transport": 2, "plant_based_meal": 5,
    "solar_energy": 10, "composting": 3, "ev_charging": 8,
    "led_switch": 20, "no_flight": 50,
}

INDIVIDUAL_PROFILES = [
    {"full_name": "Arjun Sharma",    "city": "Bangalore",  "neighborhood_type": "urban",
     "lifestyle_profile": {"commute": "cycling", "diet": "vegetarian", "energy": "partial_solar"},
     "preferred_actions": ["cycling_commute", "plant_based_meal", "composting"]},
    {"full_name": "Priya Nair",      "city": "Kochi",      "neighborhood_type": "urban",
     "lifestyle_profile": {"commute": "public_transport", "diet": "vegan", "energy": "solar"},
     "preferred_actions": ["public_transport", "plant_based_meal", "solar_energy"]},
    {"full_name": "Rahul Mehta",     "city": "Mumbai",     "neighborhood_type": "suburban",
     "lifestyle_profile": {"commute": "public_transport", "diet": "flexitarian", "energy": "grid"},
     "preferred_actions": ["public_transport", "led_switch", "composting"]},
    {"full_name": "Sneha Reddy",     "city": "Hyderabad",  "neighborhood_type": "suburban",
     "lifestyle_profile": {"commute": "ev_charging", "diet": "vegetarian", "energy": "partial_solar"},
     "preferred_actions": ["ev_charging", "plant_based_meal", "solar_energy"]},
    {"full_name": "Vikram Singh",    "city": "Delhi",      "neighborhood_type": "urban",
     "lifestyle_profile": {"commute": "cycling", "diet": "omnivore", "energy": "grid"},
     "preferred_actions": ["cycling_commute", "no_flight", "composting"]},
    {"full_name": "Ananya Iyer",     "city": "Chennai",    "neighborhood_type": "suburban",
     "lifestyle_profile": {"commute": "public_transport", "diet": "vegan", "energy": "solar"},
     "preferred_actions": ["public_transport", "plant_based_meal", "solar_energy"]},
    {"full_name": "Rohan Gupta",     "city": "Pune",       "neighborhood_type": "urban",
     "lifestyle_profile": {"commute": "cycling", "diet": "flexitarian", "energy": "partial_solar"},
     "preferred_actions": ["cycling_commute", "plant_based_meal", "led_switch"]},
    {"full_name": "Kavya Menon",     "city": "Thiruvananthapuram", "neighborhood_type": "suburban",
     "lifestyle_profile": {"commute": "public_transport", "diet": "vegetarian", "energy": "solar"},
     "preferred_actions": ["solar_energy", "composting", "plant_based_meal"]},
    {"full_name": "Aditya Joshi",    "city": "Ahmedabad",  "neighborhood_type": "suburban",
     "lifestyle_profile": {"commute": "ev_charging", "diet": "vegetarian", "energy": "partial_solar"},
     "preferred_actions": ["ev_charging", "solar_energy", "composting"]},
    {"full_name": "Divya Krishnan",  "city": "Mysore",     "neighborhood_type": "rural",
     "lifestyle_profile": {"commute": "cycling", "diet": "vegan", "energy": "solar"},
     "preferred_actions": ["solar_energy", "composting", "cycling_commute"]},
]


def seed():
    print("GreenCoin Seed Script Starting...")
    init_db()
    db = SessionLocal()

    try:
        # ── Individual Users ──────────────────────────────
        print("Creating 10 individual users...")
        individual_ids = []
        for p in INDIVIDUAL_PROFILES:
            existing = db.query(User).filter(User.email == f"{p['full_name'].lower().replace(' ', '.')}@demo.greencoin.io").first()
            if existing:
                individual_ids.append(existing.id)
                continue

            user = User(
                email=f"{p['full_name'].lower().replace(' ', '.')}@demo.greencoin.io",
                password_hash=hash_pw("greencoin123"),
                full_name=p["full_name"],
                user_type="individual",
                city=p["city"],
                neighborhood_type=p["neighborhood_type"],
                lifestyle_profile=p["lifestyle_profile"],
                green_score=random.randint(55, 92),
            )
            db.add(user)
            db.flush()
            individual_ids.append(user.id)

        # ── 90 Days of Action History ─────────────────────
        print("Generating 90 days of action history...")
        all_credits = []
        total_credits_per_user = {}

        for i, (user_id, profile) in enumerate(zip(individual_ids, INDIVIDUAL_PROFILES)):
            user_total = 0
            for days_ago in range(90, 0, -1):
                action_date = datetime.utcnow() - timedelta(days=days_ago)
                # Each user logs 1-3 actions per day
                num_actions = random.randint(1, 3)
                for _ in range(num_actions):
                    if random.random() < 0.3:  # 30% chance of a rest day per action slot
                        continue
                    action_type = random.choice(profile["preferred_actions"])
                    quantity = {
                        "cycling_commute": random.uniform(2, 15),
                        "public_transport": random.uniform(5, 30),
                        "plant_based_meal": random.randint(1, 3),
                        "solar_energy": random.uniform(1, 8),
                        "composting": random.uniform(0.2, 2),
                        "ev_charging": random.uniform(5, 30),
                        "led_switch": 1,
                        "no_flight": 1,
                    }.get(action_type, 1)

                    trust_score = random.randint(70, 98)
                    base_credits = quantity * ACTION_RATES[action_type]
                    multiplier = 0.5 + trust_score / 200
                    credits_earned = round(base_credits * multiplier, 2)

                    action = GreenAction(
                        user_id=user_id,
                        action_type_code=action_type,
                        quantity=round(quantity, 2),
                        proof_data={"demo": True, "quantity": round(quantity, 2)},
                        verification_status="verified",
                        trust_score=trust_score,
                        fraud_flags=[],
                        credits_earned=credits_earned,
                        timestamp=action_date,
                    )
                    db.add(action)
                    db.flush()

                    credit = CarbonCredit(
                        user_id=user_id,
                        action_id=action.id,
                        amount=credits_earned,
                        quality_score=min(100, int(trust_score * 0.95 + 5)),
                        status="available",
                        minted_at=action_date,
                    )
                    db.add(credit)
                    all_credits.append(credit)
                    user_total += credits_earned

            total_credits_per_user[str(user_id)] = user_total

        db.flush()
        print(f"  > Created ~500+ credit records")

        # ── Credit Bundles ────────────────────────────────
        print("Creating 3 credit bundles...")
        bundles = [
            CreditBundle(
                name="Kerala Green Transport Bundle",
                description="Verified cycling and public transport credits from Kerala contributors",
                total_credits=5000,
                total_users=243,
                action_types=[
                    {"type": "cycling_commute", "credits": 3000, "pct": 60},
                    {"type": "public_transport", "credits": 2000, "pct": 40},
                ],
                region="Kerala, India",
                quality_score=88,
                price_per_tonne=4500,
                status="available",
            ),
            CreditBundle(
                name="Bangalore Solar + EV Bundle",
                description="Solar energy and EV charging credits from Bangalore tech workers",
                total_credits=8000,
                total_users=412,
                action_types=[
                    {"type": "solar_energy", "credits": 5000, "pct": 62},
                    {"type": "ev_charging", "credits": 3000, "pct": 38},
                ],
                region="Karnataka, India",
                quality_score=92,
                price_per_tonne=5200,
                status="available",
            ),
            CreditBundle(
                name="Pan-India Diet & Waste Bundle",
                description="Plant-based meal and composting credits from across India",
                total_credits=3500,
                total_users=178,
                action_types=[
                    {"type": "plant_based_meal", "credits": 2500, "pct": 71},
                    {"type": "composting", "credits": 1000, "pct": 29},
                ],
                region="Pan-India",
                quality_score=85,
                price_per_tonne=3800,
                status="available",
            ),
        ]
        for b in bundles:
            db.add(b)
        db.flush()

        # ── Corporate Accounts ────────────────────────────
        print("Creating 2 corporate accounts...")
        corp1 = db.query(User).filter(User.email == "sustainability@infosys.demo").first()
        if not corp1:
            corp1 = User(
                email="sustainability@infosys.demo",
                password_hash=hash_pw("corporate123"),
                full_name="Infosys ESG Team",
                user_type="corporate",
                company_name="Infosys Limited",
                esg_target_tonnes=1000.0,
            )
            db.add(corp1)

        corp2 = db.query(User).filter(User.email == "esg@tata.demo").first()
        if not corp2:
            corp2 = User(
                email="esg@tata.demo",
                password_hash=hash_pw("corporate123"),
                full_name="Tata Group Sustainability",
                user_type="corporate",
                company_name="Tata Consultancy Services",
                esg_target_tonnes=2500.0,
            )
            db.add(corp2)
        db.flush()

        # ── Completed Purchase + Certificate ──────────────
        print("Creating 1 completed purchase with certificate...")
        bundle_to_sell = bundles[0]
        purchase = BundlePurchase(
            bundle_id=bundle_to_sell.id,
            corporate_id=corp1.id,
            credits_purchased=bundle_to_sell.total_credits,
            price_paid=bundle_to_sell.total_credits / 100.0 * bundle_to_sell.price_per_tonne,
            invoice_number="GC-INV-20240115-A1B2C3D4",
            purchased_at=datetime.utcnow() - timedelta(days=30),
        )
        db.add(purchase)
        bundle_to_sell.status = "sold"
        db.flush()

        cert = ESGCertificate(
            purchase_id=purchase.id,
            corporate_id=corp1.id,
            certificate_number="GC-2024-INFOSYS-001",
            tonnes_offset=bundle_to_sell.total_credits / 100.0,
            action_breakdown={"cycling_commute": 3000, "public_transport": 2000},
            sdgs_addressed=[3, 11, 13],
            qr_code="https://verify.greencoin.io/cert/GC-2024-INFOSYS-001",
        )
        db.add(cert)

        db.commit()
        print("\n> Seed complete!")
        print(f"   Individual users: {len(individual_ids)}")
        print(f"   Credit bundles: 3 (1 sold, 2 available)")
        print(f"   Corporate accounts: 2")
        print(f"\n> Demo credentials:")
        print(f"   Individual: arjun.sharma@demo.greencoin.io / greencoin123")
        print(f"   Corporate:  sustainability@infosys.demo / corporate123")

    except Exception as e:
        db.rollback()
        print(f"X Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
