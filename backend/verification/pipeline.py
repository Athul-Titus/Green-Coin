"""
GreenCoin Verification — Master Pipeline Orchestrator
Sequentially executes all 5 verification layers and computes the final verification result.
"""
import time
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from verification.models import GreenActionSubmission, VerificationResult, LayerResult
from verification.layer1_device import DeviceFingerprinter
from verification.layer2_biometrics import BehavioralBiometrics
from verification.layer3_signals import CrossSignalVerifier
from verification.layer4_graph import SocialGraphAnalyzer
from verification.layer5_audit import SpotAuditSystem
from verification.credit_cap import CreditCapSystem
from models.verification import UserTrustScore, UserStrike, FraudFlag

logger = logging.getLogger("greencoin.verification.pipeline")

class VerificationPipeline:
    def __init__(self, db: Session):
        self.db = db
        self.layer1 = DeviceFingerprinter(db)
        self.layer2 = BehavioralBiometrics(db)
        self.layer3 = CrossSignalVerifier(db)
        self.layer4 = SocialGraphAnalyzer(db)
        self.layer5 = SpotAuditSystem(db)
        self.cap_system = CreditCapSystem(db)

    async def verify(self, action: GreenActionSubmission, device_token: str) -> VerificationResult:
        """
        Run the full 5-layer verification pipeline.
        """
        all_results: list[LayerResult] = []
        all_flags: list[str] = []
        
        # --- Layer 1: Device Fingerprinting (Synchronous) ---
        l1_result = self.layer1.verify_action_device(action, device_token)
        all_results.append(l1_result)
        all_flags.extend(l1_result.flags)
        
        # Hard fail if token invalid or user mismatch
        if 'INVALID_DEVICE_TOKEN' in l1_result.flags or 'TOKEN_USER_MISMATCH' in l1_result.flags:
            return self._create_rejection(action, all_results, all_flags, "Invalid Device Token")
            
        # --- Layer 2: Behavioral Biometrics (Synchronous) ---
        l2_result = self.layer2.verify_action(action)
        all_results.append(l2_result)
        all_flags.extend(l2_result.flags)
        
        if 'GPS_TELEPORTATION_DETECTED' in l2_result.flags or 'GPS_SPEED_ACCEL_MISMATCH' in l2_result.flags:
            self._log_fraud(action.user_id, "GPS_SPOOFING", l2_result.signals, action.action_id)
            return self._create_rejection(action, all_results, all_flags, "GPS Spoofing Detected")
            
        # --- Layer 3: Cross-Signal Fusion (Async) ---
        l3_result = await self.layer3.verify_action(action)
        all_results.append(l3_result)
        all_flags.extend(l3_result.flags)
        
        if 'DUPLICATE_RECEIPT_DETECTED' in l3_result.flags:
            self._log_fraud(action.user_id, "DUPLICATE_RECEIPT", l3_result.signals, action.action_id)
            return self._create_rejection(action, all_results, all_flags, "Duplicate Submission")
            
        # --- Layer 4: Social Graph Analysis (Synchronous) ---
        l4_result = self.layer4.verify_action(action)
        all_results.append(l4_result)
        all_flags.extend(l4_result.flags)
        
        # Calculate Composite Trust Score
        weights = [0.15, 0.25, 0.40, 0.20] # Weights for Layers 1-4
        composite_score = sum(res.trust_score * w for res, w in zip(all_results, weights))
        
        # Update User Trust Database
        self._update_user_trust(action.user_id, composite_score)
        
        # --- Layer 5: Spot Audit System (Synchronous) ---
        l5_result = self.layer5.verify_action(action, composite_score)
        all_results.append(l5_result)
        all_flags.extend(l5_result.flags)
        
        audit_required = 'AUDIT_TRIGGERED' in l5_result.flags
        audit_type = l5_result.signals.get('audit_type')
        
        if audit_required:
            self.layer5.create_audit(action, audit_type)
            return VerificationResult(
                action_id=action.action_id,
                user_id=action.user_id,
                layer_results=all_results,
                composite_trust_score=composite_score,
                credit_multiplier=0.0,
                credits_awarded=0,
                audit_required=True,
                audit_type=audit_type,
                status="AUDIT_PENDING",
                flags=all_flags,
                timestamp=datetime.utcnow()
            )
            
        # --- Credit Caps ---
        # If we reach here, it's a pass. Apply caps.
        awarded_credits, cap_flags = self.cap_system.check_and_apply_caps(action.user_id, action.claimed_credits)
        all_flags.extend(cap_flags)
        
        # Credit Multiplier (Gamification based on trust)
        multiplier = 1.0
        if composite_score > 0.8:
            multiplier = 1.1 # 10% bonus for high trust
        elif composite_score < 0.4:
            multiplier = 0.5 # 50% penalty for low trust
            
        final_credits = int(awarded_credits * multiplier)
        
        status = "APPROVED" if awarded_credits == action.claimed_credits else "PARTIAL"
        
        return VerificationResult(
            action_id=action.action_id,
            user_id=action.user_id,
            layer_results=all_results,
            composite_trust_score=composite_score,
            credit_multiplier=multiplier,
            credits_awarded=final_credits,
            audit_required=False,
            audit_type=None,
            status=status,
            flags=all_flags,
            timestamp=datetime.utcnow()
        )

    def _create_rejection(self, action: GreenActionSubmission, results: list, flags: list, reason: str) -> VerificationResult:
        """Helper to format a hard rejection."""
        return VerificationResult(
            action_id=action.action_id,
            user_id=action.user_id,
            layer_results=results,
            composite_trust_score=0.0,
            credit_multiplier=0.0,
            credits_awarded=0,
            audit_required=False,
            status="REJECTED",
            flags=flags + [f"REJECTION_REASON:{reason}"],
            timestamp=datetime.utcnow()
        )

    def _log_fraud(self, user_id: str, flag_type: str, evidence: dict, action_id: str):
        flag = FraudFlag(user_id=user_id, flag_type=flag_type, evidence=evidence, severity="high")
        strike = UserStrike(user_id=user_id, reason=flag_type, action_id=action_id)
        self.db.add(flag)
        self.db.add(strike)
        self.db.commit()

    def _update_user_trust(self, user_id: str, new_score: float):
        trust = self.db.query(UserTrustScore).filter(UserTrustScore.user_id == user_id).first()
        if trust:
            # Exponential moving average for stability
            trust.score = (trust.score * 0.7) + (new_score * 0.3)
            if trust.score > 0.8: trust.level = "trusted"
            elif trust.score > 0.95: trust.level = "verified"
            elif trust.score < 0.3: trust.level = "suspicious"
        else:
            trust = UserTrustScore(user_id=user_id, score=new_score, level="building")
            self.db.add(trust)
        self.db.commit()
