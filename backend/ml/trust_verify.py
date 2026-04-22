"""
GreenCoin — TrustVerifier (ML Module)
Uses IsolationForest anomaly detection + hard rules to score action trustworthiness.
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from datetime import datetime, time
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class TrustVerifier:
    """
    Verifies green action submissions and returns a trust score (0-100).
    
    Pipeline:
    1. Extract feature vector from action data
    2. Score with IsolationForest (trained on synthetic clean data)
    3. Apply hard rules engine for domain-specific fraud patterns
    4. Combine into final trust_score with explanation flags
    """

    # Action speed limits (km/h) — above these = physically impossible
    SPEED_LIMITS = {
        "cycling_commute":  50.0,   # Faster than pro cyclists
        "public_transport": 200.0,  # Bullet train speed
        "no_flight":        0.0,    # No GPS required
    }

    # Max daily claims per action type (credits)
    MAX_DAILY_CREDITS = {
        "cycling_commute":   60,
        "public_transport": 100,
        "plant_based_meal":  25,
        "solar_energy":     500,
        "composting":        30,
        "ev_charging":      200,
        "led_switch":        20,
        "no_flight":         50,
    }

    def __init__(self):
        self._model = None
        self._scaler = None
        self._train()

    def _train(self):
        """Train IsolationForest on synthetic legitimate action data."""
        np.random.seed(42)
        n = 2000

        # Legitimate user feature distribution
        X = np.column_stack([
            np.random.poisson(3, n),            # action_frequency (per day)
            np.random.uniform(0.5, 30, n),      # claimed_distance (km)
            np.random.randint(6, 22, n),        # hour_of_day
            np.random.uniform(0.8, 1.0, n),     # speed_consistency (0-1)
            np.random.uniform(0, 2, n),         # location_variance (km)
            np.random.uniform(0.5, 1.5, n),     # peer_deviation (ratio to avg)
        ])

        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        self._model = IsolationForest(
            n_estimators=200,
            contamination=0.05,
            random_state=42,
            n_jobs=-1,
        )
        self._model.fit(X_scaled)
        logger.info("✅ TrustVerifier IsolationForest trained on %d samples", n)

    def _extract_features(self, action_data: Dict[str, Any]) -> np.ndarray:
        """Extract numerical feature vector from raw action data."""
        action_type = action_data.get("action_type", "")
        quantity = float(action_data.get("quantity", 1.0))
        proof = action_data.get("proof_data", {})

        # Temporal feature
        ts = action_data.get("timestamp", datetime.utcnow().isoformat())
        try:
            hour = datetime.fromisoformat(ts).hour
        except Exception:
            hour = 12

        # GPS features
        gps_trace = proof.get("trace", [])
        speed_consistency = 1.0
        location_variance = 0.5
        if len(gps_trace) >= 2:
            speeds = self._calculate_speeds(gps_trace)
            if speeds:
                avg_spd = np.mean(speeds)
                speed_consistency = 1.0 - min(np.std(speeds) / (avg_spd + 1e-6), 1.0)
                location_variance = float(np.std([p["lat"] for p in gps_trace]) * 111)

        # Claim size vs peer average (simplified)
        action_rates = {
            "cycling_commute": 4, "public_transport": 2, "plant_based_meal": 5,
            "solar_energy": 10, "composting": 3, "ev_charging": 8,
            "led_switch": 20, "no_flight": 50,
        }
        rate = action_rates.get(action_type, 5)
        claimed_credits = quantity * rate
        peer_avg = self.MAX_DAILY_CREDITS.get(action_type, 50) * 0.3
        peer_deviation = claimed_credits / (peer_avg + 1e-6)

        return np.array([[
            1,                       # action_frequency
            quantity,               # claimed_distance / quantity
            hour,                   # hour_of_day
            speed_consistency,
            location_variance,
            peer_deviation,
        ]])

    def _calculate_speeds(self, trace: List[Dict]) -> List[float]:
        """Calculate speed between GPS trace points (km/h)."""
        speeds = []
        for i in range(1, len(trace)):
            p1, p2 = trace[i-1], trace[i]
            try:
                from haversine import haversine, Unit
                dist = haversine((p1["lat"], p1["lng"]), (p2["lat"], p2["lng"]))
                t1 = datetime.fromisoformat(p1["timestamp"])
                t2 = datetime.fromisoformat(p2["timestamp"])
                dt_hours = (t2 - t1).total_seconds() / 3600
                if dt_hours > 0:
                    speeds.append(dist / dt_hours)
            except Exception:
                continue
        return speeds

    def _apply_hard_rules(
        self, action_data: Dict[str, Any], features: np.ndarray
    ) -> List[str]:
        """Domain-specific fraud detection rules."""
        flags = []
        action_type = action_data.get("action_type", "")
        quantity = float(action_data.get("quantity", 1.0))
        proof = action_data.get("proof_data", {})
        gps_trace = proof.get("trace", [])

        # Rule 1: Cycling speed > 50 km/h
        if action_type == "cycling_commute" and len(gps_trace) >= 2:
            speeds = self._calculate_speeds(gps_trace)
            if speeds and max(speeds) > 50:
                flags.append("CYCLING_SPEED_EXCEEDED_50KMH")

        # Rule 2: Claimed distance impossibly large
        if action_type in ("cycling_commute", "public_transport") and quantity > 200:
            flags.append("DISTANCE_EXCEEDS_DAILY_MAXIMUM")

        # Rule 3: Peer deviation > 10× (claims 10× more than user's 30-day avg)
        peer_deviation = float(features[0][5])
        if peer_deviation > 10.0:
            flags.append("CLAIM_10X_ABOVE_PEER_AVERAGE")

        # Rule 4: Same GPS coordinates (location_variance < 0.01 km for transport)
        if action_type in ("cycling_commute", "public_transport"):
            location_variance = float(features[0][4])
            if location_variance < 0.01 and len(gps_trace) > 3:
                flags.append("STATIC_GPS_COORDINATES_DETECTED")

        # Rule 5: Night-time cycling (unusual but not impossible)
        hour = int(features[0][2])
        if action_type == "cycling_commute" and (hour < 4 or hour > 23):
            flags.append("UNUSUAL_ACTIVITY_HOUR")

        return flags

    def verify_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main verification method.
        Returns: {trust_score: int (0-100), flags: list[str], recommendation: str}
        """
        features = self._extract_features(action_data)
        flags = self._apply_hard_rules(action_data, features)

        # IsolationForest score: +1 = inlier (normal), -1 = outlier (anomaly)
        X_scaled = self._scaler.transform(features)
        raw_score = self._model.decision_function(X_scaled)[0]
        # Normalize: typical range [-0.3, 0.3] → map to [0, 1]
        normalized = (raw_score + 0.3) / 0.6
        normalized = max(0.0, min(1.0, normalized))
        ml_score = int(normalized * 100)

        # Penalty for each hard rule flag (20 points each)
        penalty = len(flags) * 20
        trust_score = max(0, min(100, ml_score - penalty))

        # Recommendation
        if trust_score >= 80:
            recommendation = "auto_verify"
        elif trust_score >= 50:
            recommendation = "verify_with_caution"
        else:
            recommendation = "manual_review"

        return {
            "trust_score": trust_score,
            "ml_score": ml_score,
            "flags": flags,
            "recommendation": recommendation,
        }
