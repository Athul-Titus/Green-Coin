"""
GreenCoin Verification — Shared Pydantic Models
Defines all data structures for the Multi-Layer Verification Pipeline.
"""
from pydantic import BaseModel
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime

class DeviceFingerprint(BaseModel):
    imei_hash: str              # SHA-256 of IMEI
    mac_hash: str               # SHA-256 of MAC address
    os_version: str
    screen_resolution: str
    cpu_cores: int
    installed_apps_hash: str    # SHA-256 of sorted app list
    sim_hash: str               # SHA-256 of SIM ID
    carrier: str
    timezone: str

class SensorData(BaseModel):
    accelerometer_x: List[float]   # Raw readings at 50Hz
    accelerometer_y: List[float]
    accelerometer_z: List[float]
    gyroscope_x: List[float]
    gyroscope_y: List[float]
    gyroscope_z: List[float]
    sampling_rate_hz: int
    duration_seconds: int

class BiometricSession(BaseModel):
    key_hold_durations: List[float]    # milliseconds
    inter_key_intervals: List[float]   # milliseconds
    touch_pressures: List[float]       # normalized 0-1
    scroll_velocities: List[float]     # pixels/second
    tap_coordinates: List[Tuple[float, float]]  # (x, y) positions
    session_duration_seconds: int

class GPSPoint(BaseModel):
    latitude: float
    longitude: float
    altitude: float
    accuracy_meters: float
    timestamp: datetime
    speed_mps: float           # Speed from GPS chipset

class GPSTrace(BaseModel):
    points: List[GPSPoint]
    claimed_distance_km: float
    claimed_duration_minutes: int
    claimed_action_type: str  # cycling/walking/running

class GreenActionSubmission(BaseModel):
    action_id: str             # Generated UUID
    user_id: str
    action_type: str           # cycling/plant_meal/solar/etc
    claimed_credits: int
    timestamp: datetime
    
    # Sensor data
    gps_trace: Optional[GPSTrace] = None
    sensor_data: Optional[SensorData] = None
    biometric_session: Optional[BiometricSession] = None
    
    # Device data
    device_fingerprint: DeviceFingerprint
    battery_start_pct: int
    battery_end_pct: int
    wifi_bssid_hash: Optional[str] = None
    cell_tower_ids: List[str] = []
    
    # Proof data
    receipt_image_b64: Optional[str] = None
    meter_reading: Optional[float] = None
    third_party_activity_id: Optional[str] = None  # Strava/GoogleFit ID

class LayerResult(BaseModel):
    layer: int
    trust_score: float         # 0.0 to 1.0
    flags: List[str]           # List of anomalies detected
    signals: Dict[str, Any]    # Raw signal values
    processing_time_ms: int

class VerificationResult(BaseModel):
    action_id: str
    user_id: str
    layer_results: List[LayerResult]
    composite_trust_score: float
    credit_multiplier: float   # 0.0 to 1.0
    credits_awarded: int
    audit_required: bool
    audit_type: Optional[str] = None
    status: str  # APPROVED/PARTIAL/REJECTED/AUDIT_PENDING
    flags: List[str]
    timestamp: datetime

class AuditRequest(BaseModel):
    audit_id: str
    action_id: str
    user_id: str
    audit_type: str  # VIDEO_SELFIE/DOCUMENT/LIVE_LOCATION/COMMUNITY
    deadline: datetime
    credits_held: int
    instructions: str

class AuditResponse(BaseModel):
    audit_id: str
    user_id: str
    audit_type: str
    video_b64: Optional[str] = None
    document_b64: Optional[str] = None
    gps_ping: Optional[GPSPoint] = None
    submitted_at: datetime
