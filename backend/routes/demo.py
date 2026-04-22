"""GreenCoin — Demo Simulation Route
Runs a full end-to-end journey without real GPS/receipts.
Perfect for live hackathon demos.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import random

from database import get_db
from models.user import User
from models.action import GreenAction
from models.credit import CarbonCredit, CreditBundle, BundlePurchase
from routes.auth import get_current_user
from ml.trust_verify import TrustVerifier
from ml.green_advisor import GreenAdvisor
from ml.credit_forecaster import CreditForecaster
from services.credit_minter import CreditMinter
from services.certificate_generator import CertificateGenerator

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/run")
def run_demo(db: Session = Depends(get_db)):
    """
    Full hackathon demo simulation:
    1. Create a demo individual user
    2. Log a cycling action with mock GPS
    3. Run TrustVerifier → get trust score
    4. Mint credits
    5. Show GreenAdvisor plan update
    6. Simulate corporate purchase → generate ESG certificate
    """
    results = {}

    # ── Step 1: Create demo individual ───────────────────────────────────────
    import hashlib
    def hash_pw(p): return hashlib.sha256(p.encode()).hexdigest()

    demo_email = f"demo_{uuid.uuid4().hex[:6]}@greencoin.demo"
    individual = User(
        email=demo_email,
        password_hash=hash_pw("demo1234"),
        full_name="Arjun Sharma (Demo)",
        user_type="individual",
        city="Bangalore",
        neighborhood_type="urban",
        lifestyle_profile={
            "commute": "cycling",
            "diet": "vegetarian",
            "energy": "partial_solar",
        },
        green_score=72,
    )
    db.add(individual)
    db.flush()
    results["step1_user_created"] = {
        "user_id": str(individual.id),
        "email": demo_email,
        "city": "Bangalore",
    }

    # ── Step 2: Log cycling action with mock GPS ──────────────────────────────
    mock_gps = {
        "trace": [
            {"lat": 12.9716, "lng": 77.5946, "timestamp": "2024-01-15T08:00:00"},
            {"lat": 12.9750, "lng": 77.5980, "timestamp": "2024-01-15T08:05:00"},
            {"lat": 12.9800, "lng": 77.6020, "timestamp": "2024-01-15T08:10:00"},
            {"lat": 12.9850, "lng": 77.6060, "timestamp": "2024-01-15T08:15:00"},
            {"lat": 12.9900, "lng": 77.6100, "timestamp": "2024-01-15T08:20:00"},
        ],
        "distance_km": 4.2,
        "transport_mode": "cycling",
    }
    action = GreenAction(
        user_id=individual.id,
        action_type_code="cycling_commute",
        quantity=4.2,
        proof_data=mock_gps,
        verification_status="pending",
    )
    db.add(action)
    db.flush()
    results["step2_action_logged"] = {
        "action_id": str(action.id),
        "type": "cycling_commute",
        "distance_km": 4.2,
    }

    # ── Step 3: Run TrustVerifier ─────────────────────────────────────────────
    verifier = TrustVerifier()
    trust_result = verifier.verify_action({
        "user_id": str(individual.id),
        "action_type": "cycling_commute",
        "quantity": 4.2,
        "proof_data": mock_gps,
        "timestamp": datetime.utcnow().isoformat(),
    })
    action.trust_score = trust_result["trust_score"]
    action.fraud_flags = trust_result["flags"]
    action.verification_status = "verified" if trust_result["trust_score"] >= 50 else "rejected"
    results["step3_trust_verification"] = trust_result

    # ── Step 4: Mint Credits ──────────────────────────────────────────────────
    minter = CreditMinter(db)
    mint_result = minter.mint(action, trust_result["trust_score"])
    action.credits_earned = mint_result["credits_minted"]
    results["step4_credits_minted"] = mint_result

    # ── Step 5: GreenAdvisor Plan ─────────────────────────────────────────────
    advisor = GreenAdvisor()
    plan = advisor.generate_plan(individual.lifestyle_profile or {})
    results["step5_advisor_plan"] = {
        "cluster": plan["cluster"],
        "top_recommendation": plan["recommendations"][0] if plan["recommendations"] else None,
        "projected_monthly_credits": plan["projected_monthly_credits"],
    }

    # ── Step 6: Corporate Purchase + Certificate ──────────────────────────────
    # Find or create a demo bundle
    bundle = db.query(CreditBundle).filter(CreditBundle.status == "available").first()
    if not bundle:
        bundle = CreditBundle(
            name="Kerala Green Transport Bundle",
            description="Verified cycling and public transport credits from Kerala",
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
        )
        db.add(bundle)
        db.flush()

    # Check if a demo corporate exists
    corp_email = "infosys_demo@greencoin.demo"
    corporate = db.query(User).filter(User.email == corp_email).first()
    if not corporate:
        corporate = User(
            email=corp_email,
            password_hash=hash_pw("corp1234"),
            full_name="Infosys Sustainability Team",
            user_type="corporate",
            company_name="Infosys Limited",
            esg_target_tonnes=1000.0,
        )
        db.add(corporate)
        db.flush()

    purchase = BundlePurchase(
        bundle_id=bundle.id,
        corporate_id=corporate.id,
        credits_purchased=bundle.total_credits,
        price_paid=bundle.total_price,
        invoice_number=f"GC-DEMO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
    )
    db.add(purchase)
    db.flush()

    gen = CertificateGenerator()
    cert_result = gen.generate(purchase, bundle, corporate, db)

    results["step6_corporate_purchase"] = {
        "corporate": corporate.company_name,
        "bundle": bundle.name,
        "tonnes_purchased": bundle.total_credits / 100.0,
        "price_paid_inr": bundle.total_price,
        "certificate_id": cert_result.get("certificate_id"),
        "certificate_number": cert_result.get("certificate_number"),
        "download_url": cert_result.get("download_url"),
    }

    db.commit()

    return {
        "demo_completed": True,
        "timestamp": datetime.utcnow().isoformat(),
        "journey": results,
        "message": "🎉 Full GreenCoin demo completed successfully!"
    }
