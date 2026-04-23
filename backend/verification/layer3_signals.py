"""
GreenCoin Verification — Layer 3: Cross-Signal Fusion
Verifies actions by cross-checking multiple independent data sources (GPS, battery, weather, OCR).
"""
import time
import math
import base64
import hashlib
import httpx
import numpy as np
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from verification.models import GreenActionSubmission, LayerResult, GPSTrace, GPSPoint
from models.verification import ReceiptHash
from config import settings

logger = logging.getLogger("greencoin.verification.layer3")

class CrossSignalVerifier:
    def __init__(self, db: Session):
        self.db = db

    SIGNAL_WEIGHTS = {
        'cycling': {
            'gps': 0.25, 'accel': 0.25, 'battery': 0.10,
            'cell_towers': 0.15, 'weather': 0.05,
            'historical_pattern': 0.10, 'third_party': 0.10
        },
        'walking': {
            'gps': 0.20, 'accel': 0.30, 'battery': 0.10,
            'cell_towers': 0.15, 'weather': 0.05,
            'historical_pattern': 0.10, 'third_party': 0.10
        },
        'public_transport': {
            'gps': 0.25, 'nfc_tap': 0.35, 'cell_towers': 0.20,
            'historical_pattern': 0.10, 'third_party': 0.10
        },
        'plant_based_meal': {
            'receipt_ocr': 0.35, 'location': 0.25,
            'time_plausibility': 0.20, 'historical_pattern': 0.20
        },
        'solar_energy': {
            'smart_meter_api': 0.50, 'weather': 0.30,
            'historical_pattern': 0.20
        },
        'ev_charging': {
            'charger_api': 0.60, 'location': 0.25,
            'historical_pattern': 0.15
        },
        'composting': {
            'weight_photo': 0.40, 'periodic_checkin': 0.35,
            'historical_pattern': 0.25
        }
    }

    async def verify_action(self, action: GreenActionSubmission) -> LayerResult:
        start = time.time()
        flags = []
        
        weights = self.SIGNAL_WEIGHTS.get(
            action.action_type,
            {'historical_pattern': 1.0}
        )
        
        signal_scores = {}
        
        if 'gps' in weights and action.gps_trace:
            signal_scores['gps'], gps_flags = self._verify_gps(action.gps_trace, action.action_type)
            flags.extend(gps_flags)
            
        if 'battery' in weights:
            signal_scores['battery'] = self._verify_battery_drain(
                action.battery_start_pct, action.battery_end_pct, 
                action.claimed_credits, action.action_type
            )
            
        if 'weather' in weights and action.gps_trace and len(action.gps_trace.points) > 0:
            signal_scores['weather'] = await self._verify_weather(
                action.gps_trace.points[0], action.timestamp, action.action_type
            )
            
        if 'receipt_ocr' in weights and action.receipt_image_b64:
            ocr_result = await self._verify_receipt(action.receipt_image_b64, action.user_id, action.timestamp)
            signal_scores['receipt_ocr'] = ocr_result['score']
            if ocr_result.get('duplicate'):
                flags.append('DUPLICATE_RECEIPT_DETECTED')
            if ocr_result.get('no_plant_based_items'):
                flags.append('NO_PLANT_BASED_ITEMS_ON_RECEIPT')
                
        signal_scores['historical_pattern'] = 0.8  # Stubbed for now
        
        # Weighted fusion
        total_weight = 0
        weighted_sum = 0
        for signal, score in signal_scores.items():
            w = weights.get(signal, 0)
            weighted_sum += score * w
            total_weight += w
            
        trust_score = weighted_sum / total_weight if total_weight > 0 else 0.5
        
        return LayerResult(
            layer=3,
            trust_score=float(trust_score),
            flags=flags,
            signals=signal_scores,
            processing_time_ms=int((time.time() - start) * 1000)
        )

    def _verify_gps(self, trace: GPSTrace, action_type: str) -> tuple[float, list]:
        flags = []
        if not trace.points or len(trace.points) < 3:
            return 0.2, flags
            
        actual_distance = sum(
            self._haversine(trace.points[i], trace.points[i+1])
            for i in range(len(trace.points) - 1)
        )
        
        distance_ratio = (actual_distance / 1000.0) / (trace.claimed_distance_km + 0.01)
        distance_score = max(0.0, min(1.0, 1.0 - abs(1.0 - distance_ratio)))
        
        speeds_kmh = [p.speed_mps * 3.6 for p in trace.points]
        avg_speed = np.mean(speeds_kmh)
        
        speed_ranges = {
            'cycling': (5, 40),
            'walking': (2, 8),
            'running': (5, 20),
            'public_transport': (10, 80),
        }
        
        min_speed, max_speed = speed_ranges.get(action_type, (0, 100))
        speed_score = 1.0 if min_speed <= avg_speed <= max_speed else 0.2
        
        teleport_detected = False
        for i in range(1, len(trace.points)):
            p1, p2 = trace.points[i-1], trace.points[i]
            time_delta = (p2.timestamp - p1.timestamp).total_seconds()
            if time_delta > 0:
                instant_speed = (self._haversine(p1, p2) / 1000.0) / (time_delta / 3600.0)
                if instant_speed > 200:
                    teleport_detected = True
                    break
                    
        if teleport_detected:
            flags.append("GPS_TELEPORTATION_DETECTED")
            return 0.0, flags
            
        return (distance_score * 0.5) + (speed_score * 0.5), flags

    async def _verify_receipt(self, image_b64: str, user_id: str, timestamp: datetime) -> dict:
        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception:
            return {'score': 0.0, 'duplicate': False, 'no_plant_based_items': True}
            
        image_hash = hashlib.sha256(image_bytes).hexdigest()
        
        existing = self.db.query(ReceiptHash).filter(ReceiptHash.perceptual_hash == image_hash).first()
        if existing and existing.user_id != user_id:
             return {'score': 0.0, 'duplicate': True}
             
        if not existing:
            rh = ReceiptHash(user_id=user_id, perceptual_hash=image_hash, submitted_at=timestamp)
            self.db.add(rh)
            self.db.commit()
            
        # Call Google Vision API (Real Integration)
        if not settings.GOOGLE_VISION_API_KEY:
            # Fallback to demo logic
            from services.ocr_verifier import ReceiptOCR
            ocr_text = ReceiptOCR(demo_mode=True)._extract_text_demo(image_b64)
        else:
            url = f"https://vision.googleapis.com/v1/images:annotate?key={settings.GOOGLE_VISION_API_KEY}"
            payload = {
                "requests": [{
                    "image": {"content": image_b64},
                    "features": [{"type": "TEXT_DETECTION"}]
                }]
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    responses = data.get('responses', [])
                    if responses and 'fullTextAnnotation' in responses[0]:
                        ocr_text = responses[0]['fullTextAnnotation']['text']
                    else:
                        ocr_text = ""
                else:
                    ocr_text = ""
                    
        plant_based_keywords = [
            'tofu', 'tempeh', 'lentil', 'chickpea', 'quinoa',
            'spinach', 'kale', 'broccoli', 'mushroom', 'avocado',
            'dal', 'rajma', 'soya', 'oat', 'almond milk',
            'vegan', 'vegetarian', 'plant-based', 'salad'
        ]
        
        found_keywords = [kw for kw in plant_based_keywords if kw.lower() in ocr_text.lower()]
        
        if not found_keywords:
            return {'score': 0.3, 'no_plant_based_items': True}
            
        keyword_score = min(len(found_keywords) / 3.0, 1.0)
        return {'score': keyword_score, 'duplicate': False}

    def _verify_battery_drain(self, battery_start: int, battery_end: int, claimed_credits: int, action_type: str) -> float:
        drain_pct = battery_start - battery_end
        if drain_pct < 0: return 0.5  # Charging?
        
        expected_drain_per_minute = {
            'cycling': 0.08,
            'walking': 0.06,
            'public_transport': 0.05,
            'solar_energy': 0.02,
        }
        
        expected_rate = expected_drain_per_minute.get(action_type, 0.05)
        estimated_minutes = claimed_credits / 4.0
        expected_drain = expected_rate * estimated_minutes
        
        if expected_drain == 0:
            return 0.7
            
        drain_ratio = drain_pct / expected_drain
        score = 1.0 - abs(1.0 - drain_ratio) * 0.5
        return max(0.2, min(1.0, score))

    async def _verify_weather(self, location: GPSPoint, timestamp: datetime, action_type: str) -> float:
        # Check OpenWeather API (Real Integration)
        # Note: OpenWeatherMap usually needs LAT/LON and API KEY
        # We will check if API Key exists, else return neutral score
        api_key = getattr(settings, 'OPENWEATHER_API_KEY', None)
        if not api_key:
            return 0.85
            
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={location.latitude}&lon={location.longitude}&appid={api_key}&units=metric"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    weather_main = data.get('weather', [{}])[0].get('main', '').lower()
                    
                    if action_type in ['cycling', 'walking']:
                        if 'rain' in weather_main or 'storm' in weather_main:
                            return 0.3
                    elif action_type == 'solar_energy':
                        if 'clear' in weather_main:
                            return 1.0
                        elif 'clouds' in weather_main:
                            return 0.6
                        else:
                            return 0.2
        except Exception:
            pass
            
        return 0.85

    def _haversine(self, p1: GPSPoint, p2: GPSPoint) -> float:
        R = 6371000
        phi1 = math.radians(p1.latitude)
        phi2 = math.radians(p2.latitude)
        delta_phi = math.radians(p2.latitude - p1.latitude)
        delta_lambda = math.radians(p2.longitude - p1.longitude)
        a = math.sin(delta_phi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
