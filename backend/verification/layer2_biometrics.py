"""
GreenCoin Verification — Layer 2: Behavioral Biometrics
Detects GPS spoofing and verifies behavioral profiles using sensor data.
"""
import time
import math
import numpy as np
from datetime import datetime
import logging

from verification.models import BiometricSession, GPSTrace, GPSPoint, SensorData, GreenActionSubmission, LayerResult
from models.verification import BiometricProfile
from sqlalchemy.orm import Session

logger = logging.getLogger("greencoin.verification.layer2")

class BehavioralBiometrics:
    def __init__(self, db: Session):
        self.db = db

    def build_user_profile(self, user_id: str, sessions: list[BiometricSession]) -> None:
        """
        Build behavioral profile from first 7 days of use.
        Minimum 5 sessions needed for reliable profile.
        """
        if len(sessions) < 5:
            return
        
        feature_vectors = [self._extract_features(s) for s in sessions]
        
        profile = np.mean(feature_vectors, axis=0)
        std = np.std(feature_vectors, axis=0)
        
        existing = self.db.query(BiometricProfile).filter(BiometricProfile.user_id == user_id).first()
        if existing:
            existing.profile_vector = profile.tolist()
            existing.std_vector = std.tolist()
            existing.session_count += len(sessions)
            existing.confidence = min(existing.session_count / 10.0, 1.0)
        else:
            new_profile = BiometricProfile(
                user_id=user_id,
                profile_vector=profile.tolist(),
                std_vector=std.tolist(),
                session_count=len(sessions),
                confidence=min(len(sessions) / 10.0, 1.0)
            )
            self.db.add(new_profile)
        
        self.db.commit()

    def verify_session(self, user_id: str, current_session: BiometricSession) -> float:
        """
        Compare current session to stored profile.
        Returns similarity score 0.0 to 1.0.
        """
        profile = self.db.query(BiometricProfile).filter(BiometricProfile.user_id == user_id).first()
        
        if not profile or profile.confidence < 0.5:
            return 0.65  # Neutral — benefit of doubt
        
        current_vector = self._extract_features(current_session)
        stored_vector = np.array(profile.profile_vector)
        std_vector = np.array(profile.std_vector)
        
        # Mahalanobis distance
        diff = current_vector - stored_vector
        normalized = diff / (std_vector + 1e-8)
        distance = np.sqrt(np.sum(normalized ** 2))
        
        similarity = 1.0 / (1.0 + distance / 5.0)
        return float(np.clip(similarity, 0.0, 1.0))

    def detect_gps_spoofing(self, gps_trace: GPSTrace, sensor_data: SensorData) -> tuple[bool, float, list]:
        """
        CRITICAL: Detect GPS spoofing by cross-checking
        GPS coordinates against accelerometer readings.
        """
        flags = []
        
        if not gps_trace or not sensor_data:
            return False, 0.5, ['INSUFFICIENT_DATA']
            
        if len(gps_trace.points) < 2:
            return False, 0.5, ['INSUFFICIENT_GPS_POINTS']
        
        # Calculate GPS-derived speed
        gps_speeds = []
        for i in range(1, len(gps_trace.points)):
            p1 = gps_trace.points[i-1]
            p2 = gps_trace.points[i]
            dist = self._haversine(p1, p2)
            time_delta = (p2.timestamp - p1.timestamp).total_seconds()
            if time_delta > 0:
                gps_speeds.append((dist / 1000.0) / (time_delta / 3600.0))  # km/h
        
        avg_gps_speed = np.mean(gps_speeds) if gps_speeds else 0
        
        # Calculate accelerometer magnitude
        accel_magnitudes = [
            np.sqrt(x**2 + y**2 + z**2)
            for x, y, z in zip(
                sensor_data.accelerometer_x,
                sensor_data.accelerometer_y,
                sensor_data.accelerometer_z
            )
        ]
        avg_accel = np.mean(accel_magnitudes) if accel_magnitudes else 9.81
        
        # Gravity = 9.81 m/s²
        net_accel = abs(avg_accel - 9.81)
        
        # Rule 1: Moving fast (GPS) but physically still (accel)
        if avg_gps_speed > 5.0 and net_accel < 0.15:
            flags.append('GPS_SPEED_ACCEL_MISMATCH')
            
        # Rule 2: Cycling claimed but no rhythmic pedaling pattern
        if gps_trace.claimed_action_type == 'cycling':
            pedaling_detected = self._detect_pedaling_pattern(
                sensor_data.accelerometer_z,
                sensor_data.sampling_rate_hz
            )
            if not pedaling_detected and avg_gps_speed > 8:
                flags.append('NO_CYCLING_PATTERN_DETECTED')
                
        # Rule 3: Walking claimed but no step pattern
        if gps_trace.claimed_action_type == 'walking':
            steps_detected = self._detect_step_pattern(
                sensor_data.accelerometer_y,
                sensor_data.sampling_rate_hz
            )
            if not steps_detected:
                flags.append('NO_WALKING_PATTERN_DETECTED')
                
        # Rule 4: Route smoothness (mock GPS routes are mathematically perfect)
        accuracy_variance = np.var([p.accuracy_meters for p in gps_trace.points])
        if accuracy_variance < 0.01:
            flags.append('CONSTANT_GPS_ACCURACY')
            
        is_spoofed = len(flags) >= 2
        confidence = min(len(flags) / 3, 1.0)
        
        return is_spoofed, confidence, flags

    def _haversine(self, p1: GPSPoint, p2: GPSPoint) -> float:
        """Calculate distance in meters between two GPS points."""
        R = 6371000  # radius of Earth in meters
        phi1 = math.radians(p1.latitude)
        phi2 = math.radians(p2.latitude)
        delta_phi = math.radians(p2.latitude - p1.latitude)
        delta_lambda = math.radians(p2.longitude - p1.longitude)
        
        a = math.sin(delta_phi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    def _detect_pedaling_pattern(self, accel_z: list, sampling_rate: int) -> bool:
        if len(accel_z) < sampling_rate * 5:
            return False
            
        fft = np.fft.rfft(accel_z)
        freqs = np.fft.rfftfreq(len(accel_z), 1/sampling_rate)
        magnitude = np.abs(fft)
        
        cycling_mask = (freqs >= 0.8) & (freqs <= 2.0)
        cycling_power = np.sum(magnitude[cycling_mask])
        total_power = np.sum(magnitude)
        
        if total_power == 0: return False
        return (cycling_power / total_power) > 0.3

    def _detect_step_pattern(self, accel_y: list, sampling_rate: int) -> bool:
        if len(accel_y) < sampling_rate * 5:
            return False
        
        fft = np.fft.rfft(accel_y)
        freqs = np.fft.rfftfreq(len(accel_y), 1/sampling_rate)
        magnitude = np.abs(fft)
        
        walking_mask = (freqs >= 1.5) & (freqs <= 2.5) # 90-150 steps per min
        walking_power = np.sum(magnitude[walking_mask])
        total_power = np.sum(magnitude)
        
        if total_power == 0: return False
        return (walking_power / total_power) > 0.25

    def _extract_features(self, session: BiometricSession) -> np.ndarray:
        features = [
            np.mean(session.key_hold_durations) if session.key_hold_durations else 0,
            np.std(session.key_hold_durations) if session.key_hold_durations else 0,
            np.mean(session.inter_key_intervals) if session.inter_key_intervals else 0,
            np.std(session.inter_key_intervals) if session.inter_key_intervals else 0,
            np.mean(session.touch_pressures) if session.touch_pressures else 0,
            np.std(session.touch_pressures) if session.touch_pressures else 0,
            np.mean(session.scroll_velocities) if session.scroll_velocities else 0,
            np.percentile(session.scroll_velocities, 25) if session.scroll_velocities else 0,
            np.percentile(session.scroll_velocities, 75) if session.scroll_velocities else 0,
        ]
        
        if len(session.tap_coordinates) > 1:
            diffs = np.diff(session.tap_coordinates, axis=0)
            features.append(np.mean(np.linalg.norm(diffs, axis=1)))
        else:
            features.append(0.0)
            
        return np.array(features)

    def verify_action(self, action: GreenActionSubmission) -> LayerResult:
        start = time.time()
        flags = []
        signals = {}
        scores = []
        
        if action.gps_trace and action.sensor_data:
            is_spoofed, spoof_confidence, spoof_flags = self.detect_gps_spoofing(
                action.gps_trace, action.sensor_data
            )
            flags.extend(spoof_flags)
            signals['gps_spoof_detected'] = is_spoofed
            signals['spoof_confidence'] = float(spoof_confidence)
            
            if is_spoofed:
                scores.append(0.0)
            else:
                scores.append(1.0 - spoof_confidence * 0.5)
                
        if action.biometric_session:
            biometric_score = self.verify_session(action.user_id, action.biometric_session)
            signals['biometric_similarity'] = biometric_score
            scores.append(biometric_score)
            
            if biometric_score < 0.4:
                flags.append('BIOMETRIC_MISMATCH')
                
        trust_score = np.mean(scores) if scores else 0.6
        
        return LayerResult(
            layer=2,
            trust_score=float(trust_score),
            flags=flags,
            signals=signals,
            processing_time_ms=int((time.time() - start) * 1000)
        )
