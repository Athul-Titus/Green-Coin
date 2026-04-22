"""
GreenCoin — GPS Verifier Service
Parses and validates GPS traces for transport-based green actions.
"""
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from haversine import haversine, Unit
    HAVERSINE_AVAILABLE = True
except ImportError:
    HAVERSINE_AVAILABLE = False


def _haversine_km(p1: Dict, p2: Dict) -> float:
    """Calculate distance between two lat/lng points in km."""
    if HAVERSINE_AVAILABLE:
        return haversine((p1["lat"], p1["lng"]), (p2["lat"], p2["lng"]))
    # Fallback: simplified equirectangular approximation
    import math
    R = 6371
    dlat = math.radians(p2["lat"] - p1["lat"])
    dlng = math.radians(p2["lng"] - p1["lng"])
    a = math.sin(dlat/2)**2 + math.cos(math.radians(p1["lat"])) * math.cos(math.radians(p2["lat"])) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


class GPSVerifier:
    """
    Verifies GPS traces submitted as proof for transport actions.
    
    Checks:
    - Minimum number of points
    - Total distance calculation
    - Speed plausibility per segment
    - Route continuity (no teleporting)
    """

    # Max speed thresholds (km/h) per transport mode
    MAX_SPEEDS = {
        "cycling_commute":  70,   # generous: pro racer + downhill
        "public_transport": 200,  # high-speed rail
        "no_flight":        0,    # no GPS required
    }

    MIN_DISTANCE_KM = 0.2  # Minimum meaningful trip distance

    def verify(self, trace: List[Dict], action_type: str = "cycling_commute") -> Dict[str, Any]:
        """
        Verify a GPS trace.
        
        Args:
            trace: List of {lat, lng, timestamp} dicts
            action_type: The green action type
            
        Returns:
            {verified, distance_km, avg_speed_kmh, max_speed_kmh, trust_score, flags}
        """
        flags = []

        if len(trace) < 2:
            return {
                "verified": False,
                "distance_km": 0,
                "flags": ["INSUFFICIENT_GPS_POINTS"],
                "trust_score": 0,
            }

        # Calculate segment-by-segment stats
        segments = []
        total_distance = 0.0
        total_time_hours = 0.0

        for i in range(1, len(trace)):
            p1, p2 = trace[i-1], trace[i]
            try:
                dist = _haversine_km(p1, p2)
                t1 = datetime.fromisoformat(p1["timestamp"])
                t2 = datetime.fromisoformat(p2["timestamp"])
                dt_h = (t2 - t1).total_seconds() / 3600

                if dt_h <= 0:
                    flags.append("TIMESTAMP_INCONSISTENCY")
                    continue

                speed = dist / dt_h
                segments.append({"distance": dist, "speed": speed, "time_h": dt_h})
                total_distance += dist
                total_time_hours += dt_h
            except Exception as e:
                flags.append(f"PARSE_ERROR_POINT_{i}")
                continue

        if not segments:
            return {
                "verified": False,
                "distance_km": 0,
                "flags": flags + ["NO_VALID_SEGMENTS"],
                "trust_score": 10,
            }

        avg_speed = total_distance / total_time_hours if total_time_hours > 0 else 0
        max_speed = max(s["speed"] for s in segments)
        max_allowed = self.MAX_SPEEDS.get(action_type, 100)

        # Check: teleporting (segment distance > 50 km in under 5 minutes)
        for seg in segments:
            if seg["distance"] > 50 and seg["time_h"] < (5/60):
                flags.append("TELEPORTATION_DETECTED")

        # Check: max speed exceeded
        if max_allowed > 0 and max_speed > max_allowed:
            flags.append(f"MAX_SPEED_EXCEEDED_{int(max_speed)}KMH")

        # Check: minimum distance
        if total_distance < self.MIN_DISTANCE_KM:
            flags.append("TRIP_TOO_SHORT")

        # Trust score: start at 100, subtract for issues
        trust_score = 100
        trust_score -= len(flags) * 25
        trust_score = max(0, trust_score)
        verified = trust_score >= 50 and total_distance >= self.MIN_DISTANCE_KM

        return {
            "verified": verified,
            "distance_km": round(total_distance, 3),
            "avg_speed_kmh": round(avg_speed, 1),
            "max_speed_kmh": round(max_speed, 1),
            "num_points": len(trace),
            "duration_minutes": round(total_time_hours * 60, 1),
            "trust_score": trust_score,
            "flags": flags,
        }
