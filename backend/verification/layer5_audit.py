"""
GreenCoin Verification — Layer 5: Spot Audit System
Probabilistic auditing based on trust scores and action risk profiles.
"""
import time
import random
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

from verification.models import GreenActionSubmission, LayerResult
from models.verification import AuditRequestDB, UserTrustScore

logger = logging.getLogger("greencoin.verification.layer5")

class SpotAuditSystem:
    def __init__(self, db: Session):
        self.db = db
        
    def should_audit(self, action: GreenActionSubmission, current_trust_score: float) -> tuple[bool, str]:
        """
        Determine if an action should be flagged for a spot audit.
        Higher risk/lower trust = higher probability of audit.
        """
        # 1. High value actions are always audited if trust is low
        if action.claimed_credits > 100 and current_trust_score < 0.6:
            return True, "VIDEO_SELFIE"
            
        # 2. Base probability calculation
        # If trust is 1.0, audit chance is 1%. If trust is 0.0, audit chance is 90%
        base_prob = 0.9 - (current_trust_score * 0.89)
        
        # 3. Action type modifiers
        modifiers = {
            'solar_energy': 1.5,   # High value, easy to spoof without API
            'plant_based_meal': 0.5, # Low value, high volume
            'cycling': 1.0
        }
        
        final_prob = min(base_prob * modifiers.get(action.action_type, 1.0), 1.0)
        
        if random.random() < final_prob:
            # Select audit type based on action
            if action.action_type in ['cycling', 'walking']:
                return True, "LIVE_LOCATION"
            elif action.action_type == 'plant_based_meal':
                return True, "COMMUNITY" # Send to community for visual vote
            else:
                return True, "DOCUMENT" # Request utility bill or formal doc
                
        return False, ""

    def create_audit(self, action: GreenActionSubmission, audit_type: str) -> str:
        """
        Create a pending audit request in the database.
        Locks the credits until the audit is resolved.
        """
        deadline = datetime.utcnow() + timedelta(hours=48)
        instructions = "Please complete the required verification to unlock your credits."
        
        if audit_type == "VIDEO_SELFIE":
            instructions = "Record a 5-second video selfie showing your face and surroundings."
        elif audit_type == "LIVE_LOCATION":
            instructions = "Share your live location via the app for the next 2 minutes."
        elif audit_type == "DOCUMENT":
            instructions = "Upload a clear photo of the relevant utility bill or receipt."
            
        audit = AuditRequestDB(
            action_id=action.action_id,
            user_id=action.user_id,
            audit_type=audit_type,
            deadline=deadline,
            credits_held=action.claimed_credits,
            instructions=instructions
        )
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(audit)
        
        return audit.id

    def verify_action(self, action: GreenActionSubmission, current_trust_score: float) -> LayerResult:
        start = time.time()
        
        # Check if user has active unresolved audits (Strike system)
        pending_audits = self.db.query(AuditRequestDB).filter(
            AuditRequestDB.user_id == action.user_id,
            AuditRequestDB.status == "pending"
        ).count()
        
        if pending_audits >= 3:
            return LayerResult(
                layer=5,
                trust_score=0.0,
                flags=["TOO_MANY_PENDING_AUDITS"],
                signals={'pending_audits': pending_audits},
                processing_time_ms=int((time.time() - start) * 1000)
            )
            
        requires_audit, audit_type = self.should_audit(action, current_trust_score)
        
        flags = []
        signals = {}
        if requires_audit:
            flags.append("AUDIT_TRIGGERED")
            signals['audit_type'] = audit_type
            
        return LayerResult(
            layer=5,
            trust_score=1.0 if not requires_audit else 0.5, # Doesn't immediately fail them
            flags=flags,
            signals=signals,
            processing_time_ms=int((time.time() - start) * 1000)
        )
