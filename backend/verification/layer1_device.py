"""
GreenCoin Verification — Layer 1: Device Fingerprinting
Handles device registration, token generation, and fingerprint validation.
"""
import time
import json
import hashlib
from datetime import datetime, timedelta
import jwt
import logging
from uuid import uuid4

from verification.models import DeviceFingerprint, GreenActionSubmission, LayerResult
from models.verification import Device
from sqlalchemy.orm import Session
from config import settings

logger = logging.getLogger("greencoin.verification.layer1")

class DeviceFingerprinter:
    def __init__(self, db: Session):
        self.db = db

    def register_device(self, user_id: str, fingerprint: DeviceFingerprint) -> dict:
        """
        Register device on first install.
        Generates cryptographic device token.
        Enforces one-device-one-account rule.
        """
        fingerprint_hash = self._hash_fingerprint(fingerprint)
        
        # Check if device already registered to different user
        existing = self.db.query(Device).filter(Device.fingerprint_hash == fingerprint_hash).first()
        if existing and existing.user_id != user_id:
            # NOTE: In a full production system, we might flag both accounts here (Sybil attempt)
            raise ValueError("DEVICE_ALREADY_REGISTERED: This device is linked to another account")
        
        # Generate JWT device token with fingerprint embedded
        device_token = jwt.encode({
            'user_id': user_id,
            'fingerprint_hash': fingerprint_hash,
            'device_id': str(uuid4()),
            'registered_at': datetime.utcnow().isoformat(),
            'exp': datetime.utcnow() + timedelta(days=365)
        }, settings.DEVICE_SECRET, algorithm='HS256')
        
        if not existing:
            # Store device record
            new_device = Device(
                user_id=user_id,
                fingerprint_hash=fingerprint_hash,
                trust_level="new"
            )
            self.db.add(new_device)
            self.db.commit()
            
        return {'device_token': device_token}

    def verify_action_device(self, action: GreenActionSubmission, device_token: str) -> LayerResult:
        """
        Verify device token on every action submission.
        Returns trust score based on device consistency.
        """
        start = time.time()
        flags = []
        signals = {}
        
        # Decode and verify token
        try:
            token_data = jwt.decode(
                device_token,
                settings.DEVICE_SECRET,
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            return LayerResult(
                layer=1, trust_score=0.0,
                flags=['EXPIRED_DEVICE_TOKEN'],
                signals={}, processing_time_ms=int((time.time()-start)*1000)
            )
        except jwt.InvalidTokenError:
            return LayerResult(
                layer=1, trust_score=0.0,
                flags=['INVALID_DEVICE_TOKEN'],
                signals={}, processing_time_ms=int((time.time()-start)*1000)
            )
        
        # Verify token belongs to this user
        if token_data['user_id'] != action.user_id:
            flags.append('TOKEN_USER_MISMATCH')
            return LayerResult(layer=1, trust_score=0.0,
                               flags=flags, signals={},
                               processing_time_ms=int((time.time()-start)*1000))
        
        # Check fingerprint consistency
        current_hash = self._hash_fingerprint(action.device_fingerprint)
        stored_hash = token_data['fingerprint_hash']
        
        if current_hash != stored_hash:
            flags.append('FINGERPRINT_CHANGED')
            # Assuming simple exact match for now. True similarity requires comparing raw JSON values which we don't store in token.
            # To handle minor updates (OS updates), we would need to store raw fingerprint components.
            # For this MVP, if hash doesn't match exactly, we heavily penalize.
            signals['fingerprint_similarity'] = 0.5
            return LayerResult(layer=1, trust_score=0.2,
                               flags=flags, signals=signals,
                               processing_time_ms=int((time.time()-start)*1000))
        
        # Account age score (new accounts trusted less)
        registered_at = datetime.fromisoformat(token_data['registered_at'])
        account_age_days = (datetime.utcnow() - registered_at).days
        age_score = min(account_age_days / 30, 1.0)
        signals['account_age_days'] = account_age_days
        signals['age_score'] = age_score
        
        # Submission frequency check - count actions in last hour
        from models.action import GreenAction
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_submissions = self.db.query(GreenAction).filter(
            GreenAction.user_id == action.user_id,
            GreenAction.timestamp >= one_hour_ago
        ).count()
        
        if recent_submissions > 10:
            flags.append('HIGH_FREQUENCY_SUBMISSIONS')
        
        frequency_score = max(0, 1 - (recent_submissions / 20))
        signals['recent_submissions'] = recent_submissions
        
        # Final score
        trust_score = (
            0.5 * (1.0 if not flags else 0.5) +
            0.3 * age_score +
            0.2 * frequency_score
        )
        
        return LayerResult(
            layer=1,
            trust_score=float(trust_score),
            flags=flags,
            signals=signals,
            processing_time_ms=int((time.time() - start) * 1000)
        )

    def _hash_fingerprint(self, fp: DeviceFingerprint) -> str:
        # Convert to dict, handle non-serializable elements if any
        fp_dict = fp.model_dump()
        data = json.dumps(fp_dict, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()
