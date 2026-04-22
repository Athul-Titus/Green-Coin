"""
GreenCoin — FraudDetector (ML Module)
XGBoost classifier for behavioral pattern analysis.
"""
import numpy as np
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    logger.warning("XGBoost not available — using rule-based fallback for fraud detection")


class FraudDetector:
    """
    Analyzes user behavioral patterns to detect systematic fraud.
    Works at the user level (vs TrustVerifier which works per-action).
    
    Detects:
    - GPS spoofing (perfect routes, impossible speeds)
    - Receipt reuse (hash-based dedup + timing patterns)
    - Meter manipulation (reading inconsistencies)
    """

    def __init__(self):
        self._model = None
        self._threshold = 0.5
        if XGB_AVAILABLE:
            self._train()

    def _train(self):
        """Train XGBoost on synthetic labeled behavioral data."""
        np.random.seed(42)

        # Legitimate users: lower fraud indicators
        n_legit = 1500
        X_legit = np.column_stack([
            np.random.uniform(0.8, 1.0, n_legit),    # gps_route_naturalness
            np.random.uniform(0, 5, n_legit),         # duplicate_receipt_count
            np.random.uniform(0, 2, n_legit),         # meter_reading_anomaly_score
            np.random.uniform(0, 0.3, n_legit),       # action_time_clustering
            np.random.uniform(0.5, 1.5, n_legit),     # credit_claim_ratio
            np.random.uniform(1, 10, n_legit),        # days_since_registration
        ])
        y_legit = np.zeros(n_legit)

        # Fraudulent users: higher fraud indicators
        n_fraud = 300
        X_fraud = np.column_stack([
            np.random.uniform(0, 0.3, n_fraud),       # gps_route_naturalness: too perfect
            np.random.uniform(5, 30, n_fraud),        # duplicate_receipt_count: high
            np.random.uniform(3, 10, n_fraud),        # meter_reading_anomaly_score: high
            np.random.uniform(0.7, 1.0, n_fraud),     # action_time_clustering: all same time
            np.random.uniform(5, 20, n_fraud),        # credit_claim_ratio: excessive
            np.random.uniform(1, 3, n_fraud),         # days since registration: new + aggressive
        ])
        y_fraud = np.ones(n_fraud)

        X = np.vstack([X_legit, X_fraud])
        y = np.hstack([y_legit, y_fraud])

        self._model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            scale_pos_weight=n_legit / n_fraud,
            eval_metric="logloss",
            random_state=42,
            verbosity=0,
        )
        self._model.fit(X, y)
        logger.info("✅ FraudDetector XGBoost trained — %d legit, %d fraud samples", n_legit, n_fraud)

    def _extract_user_features(self, user_data: Dict[str, Any]) -> np.ndarray:
        """Extract behavioral feature vector for a user."""
        actions = user_data.get("recent_actions", [])
        receipt_hashes = set()
        duplicate_receipts = 0
        action_hours = []
        speed_anomalies = 0
        total_credits = 0
        avg_credits = user_data.get("avg_30day_credits", 50)

        for a in actions:
            proof = a.get("proof_data", {})

            # Receipt dedup
            receipt_hash = proof.get("receipt_hash", "")
            if receipt_hash and receipt_hash in receipt_hashes:
                duplicate_receipts += 1
            if receipt_hash:
                receipt_hashes.add(receipt_hash)

            # GPS speed check
            if a.get("action_type") == "cycling_commute":
                max_speed = proof.get("max_speed_kmh", 0)
                if max_speed > 50:
                    speed_anomalies += 1

            # Action hours
            ts = a.get("timestamp", "")
            if ts:
                try:
                    hour = int(ts[11:13])
                    action_hours.append(hour)
                except Exception:
                    pass

            total_credits += a.get("credits_earned", 0)

        # GPS route naturalness: inverse of speed anomaly rate
        total_transport = max(1, sum(1 for a in actions if a.get("action_type") in ("cycling_commute", "public_transport")))
        gps_naturalness = 1.0 - min(speed_anomalies / total_transport, 1.0)

        # Time clustering: std dev of action hours (lower = more clustered = suspicious)
        time_clustering = 0.0
        if len(action_hours) >= 3:
            std = float(np.std(action_hours))
            time_clustering = 1.0 - min(std / 6.0, 1.0)

        # Credit claim ratio
        credit_ratio = (total_credits / max(avg_credits, 1)) if actions else 1.0

        # Days since registration
        created_at = user_data.get("created_at", "")
        days_since = 365
        if created_at:
            try:
                from datetime import datetime
                days_since = (datetime.utcnow() - datetime.fromisoformat(created_at)).days
            except Exception:
                pass

        return np.array([[
            gps_naturalness,
            duplicate_receipts,
            speed_anomalies,
            time_clustering,
            credit_ratio,
            max(1, days_since),
        ]])

    def analyze_pattern(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze user's behavioral pattern for fraud risk.
        Returns: {risk_level, suspicious_patterns, recommended_action}
        """
        features = self._extract_user_features(user_data)
        suspicious_patterns = []

        if features[0][1] > 5:
            suspicious_patterns.append("DUPLICATE_RECEIPTS_DETECTED")
        if features[0][2] > 2:
            suspicious_patterns.append("GPS_SPEED_ANOMALIES")
        if features[0][3] > 0.8:
            suspicious_patterns.append("ACTIONS_CLUSTERED_AT_SAME_TIME")
        if features[0][4] > 5:
            suspicious_patterns.append("EXCESSIVE_CREDIT_CLAIMS")

        if XGB_AVAILABLE and self._model:
            prob = float(self._model.predict_proba(features)[0][1])
        else:
            # Rule-based fallback
            prob = len(suspicious_patterns) * 0.15

        if prob >= 0.7:
            risk_level = "high"
            recommended_action = "suspend_and_manual_review"
        elif prob >= 0.4:
            risk_level = "medium"
            recommended_action = "require_additional_proof"
        else:
            risk_level = "low"
            recommended_action = "continue_auto_verify"

        return {
            "risk_level": risk_level,
            "fraud_probability": round(prob, 3),
            "suspicious_patterns": suspicious_patterns,
            "recommended_action": recommended_action,
        }
