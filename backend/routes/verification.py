"""
GreenCoin Verification — API Routes
Endpoints for registering devices, submitting actions for verification, and handling audits.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.user import User
from verification.models import DeviceFingerprint, GreenActionSubmission, VerificationResult, AuditResponse
from verification.layer1_device import DeviceFingerprinter
from verification.pipeline import VerificationPipeline
from models.verification import AuditRequestDB, AuditResponseDB

router = APIRouter(prefix="/verify", tags=["Verification"])

@router.post("/register-device")
def register_device(
    user_id: str,
    fingerprint: DeviceFingerprint,
    db: Session = Depends(get_db)
):
    """Register a new device and receive a JWT device token."""
    device_manager = DeviceFingerprinter(db)
    try:
        return device_manager.register_device(user_id, fingerprint)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/submit-action", response_model=VerificationResult)
async def submit_action(
    action: GreenActionSubmission,
    device_token: Optional[str] = Header(None, alias="X-Device-Token"),
    db: Session = Depends(get_db)
):
    """
    Submit a green action for multi-layer verification.
    """
    if not device_token:
        raise HTTPException(status_code=401, detail="X-Device-Token header is required")
        
    from models.action import GreenAction
    # Ensure the action exists in the database to prevent foreign key constraint errors
    existing_action = db.query(GreenAction).filter(GreenAction.id == action.action_id).first()
    if not existing_action:
        new_action = GreenAction(
            id=action.action_id,
            user_id=action.user_id,
            action_type_code=action.action_type,
            quantity=1.0,
            verification_status="verifying",
            credits_earned=0.0
        )
        db.add(new_action)
        db.commit()
        
    pipeline = VerificationPipeline(db)
    result = await pipeline.verify(action, device_token)
    
    # In a full system, if approved, we'd add the credits to the user's wallet here.
    if result.status == "APPROVED" or result.status == "PARTIAL":
        user = db.query(User).filter(User.id == action.user_id).first()
        if user:
            user.balance += result.credits_awarded
            user.total_carbon_saved += (result.credits_awarded * 0.1)  # Rough conversion metric
            db.commit()
            
    return result

@router.post("/audit/respond")
def respond_to_audit(
    response: AuditResponse,
    db: Session = Depends(get_db)
):
    """Submit required media/data for a pending spot audit."""
    audit = db.query(AuditRequestDB).filter(
        AuditRequestDB.id == response.audit_id,
        AuditRequestDB.user_id == response.user_id,
        AuditRequestDB.status == "pending"
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found or already resolved")
        
    # Store response for manual or AI review
    resp_db = AuditResponseDB(
        audit_id=audit.id,
        user_id=response.user_id,
        audit_type=response.audit_type,
        # Normally we would save base64 media to S3/Cloud storage and save URL here
        media_url="mock_storage_url_due_to_b64" 
    )
    db.add(resp_db)
    
    # Mark audit as resolved for the MVP (In prod, this goes to queue)
    audit.status = "passed"
    
    # Release credits
    user = db.query(User).filter(User.id == response.user_id).first()
    if user:
        user.balance += audit.credits_held
        
    db.commit()
    
    return {"message": "Audit response received and credits released (MVP mode)"}

@router.get("/status/{action_id}")
def get_verification_status(action_id: str, db: Session = Depends(get_db)):
    """Check the status of a specific verification."""
    # Since our pipeline is mostly sync, this is for async edge cases or audit checks
    audit = db.query(AuditRequestDB).filter(AuditRequestDB.action_id == action_id).first()
    if audit:
        return {"status": "AUDIT_PENDING", "audit_id": audit.id, "audit_type": audit.audit_type, "instructions": audit.instructions}
    
    return {"status": "PROCESSED"}
