"""GreenCoin — Marketplace Routes (bundles, purchase, certificate)"""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os

from database import get_db
from models.credit import CreditBundle, BundlePurchase, ESGCertificate
from models.user import User
from routes.auth import get_current_user

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


class BundleOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    total_credits: float
    total_tonnes: float
    total_users: int
    action_types: list
    region: Optional[str]
    quality_score: int
    price_per_tonne: float
    total_price: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/bundles", response_model=List[BundleOut])
def list_bundles(
    action_type: Optional[str] = None,
    region: Optional[str] = None,
    min_quality: int = 0,
    max_price: Optional[float] = None,
    sort_by: str = "created_at",
    db: Session = Depends(get_db),
):
    q = db.query(CreditBundle).filter(CreditBundle.status == "available")
    if region:
        q = q.filter(CreditBundle.region.ilike(f"%{region}%"))
    if min_quality:
        q = q.filter(CreditBundle.quality_score >= min_quality)
    if max_price:
        q = q.filter(CreditBundle.price_per_tonne <= max_price)

    bundles = q.order_by(desc(CreditBundle.created_at)).all()
    return [
        BundleOut(
            id=str(b.id),
            name=b.name,
            description=b.description,
            total_credits=b.total_credits,
            total_tonnes=b.total_tonnes,
            total_users=b.total_users,
            action_types=b.action_types or [],
            region=b.region,
            quality_score=b.quality_score,
            price_per_tonne=b.price_per_tonne,
            total_price=b.total_price,
            status=b.status,
            created_at=b.created_at,
        )
        for b in bundles
    ]


@router.post("/purchase", status_code=201)
def purchase_bundle(
    bundle_id: str,
    credits_to_buy: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.user_type != "corporate":
        raise HTTPException(403, "Only corporate accounts can purchase bundles")

    bundle = db.query(CreditBundle).filter(
        CreditBundle.id == uuid.UUID(bundle_id),
        CreditBundle.status == "available"
    ).first()
    if not bundle:
        raise HTTPException(404, "Bundle not found or already sold")

    credits_purchased = credits_to_buy or bundle.total_credits
    price_paid = (credits_purchased / 100.0) * bundle.price_per_tonne
    invoice_number = f"GC-INV-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

    purchase = BundlePurchase(
        bundle_id=bundle.id,
        corporate_id=current_user.id,
        credits_purchased=credits_purchased,
        price_paid=price_paid,
        invoice_number=invoice_number,
    )
    db.add(purchase)

    if credits_purchased >= bundle.total_credits:
        bundle.status = "sold"

    db.commit()
    db.refresh(purchase)

    # Generate ESG certificate
    from services.certificate_generator import CertificateGenerator
    gen = CertificateGenerator()
    cert_result = gen.generate(purchase, bundle, current_user, db)

    return {
        "purchase_id": str(purchase.id),
        "invoice_number": invoice_number,
        "credits_purchased": credits_purchased,
        "tonnes_purchased": credits_purchased / 100.0,
        "price_paid_inr": price_paid,
        "certificate_id": cert_result.get("certificate_id"),
        "download_url": cert_result.get("download_url"),
        "message": "Purchase successful! ESG certificate generated.",
    }


@router.get("/certificate/{certificate_id}")
def download_certificate(
    certificate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cert = db.query(ESGCertificate).filter(
        ESGCertificate.id == uuid.UUID(certificate_id)
    ).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")

    if cert.pdf_path and os.path.exists(cert.pdf_path):
        with open(cert.pdf_path, "rb") as f:
            content = f.read()
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=GreenCoin_Certificate_{cert.certificate_number}.pdf"},
        )

    # Fallback: return metadata
    return {
        "certificate_number": cert.certificate_number,
        "tonnes_offset": cert.tonnes_offset,
        "issued_at": cert.issued_at.isoformat(),
        "ghg_scope": cert.ghg_scope,
        "sdgs_addressed": cert.sdgs_addressed,
        "action_breakdown": cert.action_breakdown,
        "qr_code": cert.qr_code,
    }
