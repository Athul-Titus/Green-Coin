import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import user, action, credit, corporate, verification  # load all mappers
from verification.models import GreenActionSubmission, DeviceFingerprint, GPSTrace, GPSPoint, SensorData, BiometricSession
from verification.layer1_device import DeviceFingerprinter
from verification.pipeline import VerificationPipeline

def create_mock_clean_action(user_id: str):
    return GreenActionSubmission(
        action_id="clean_action_123",
        user_id=user_id,
        action_type="cycling",
        claimed_credits=50,
        timestamp=datetime.utcnow(),
        device_fingerprint=DeviceFingerprint(
            imei_hash="hash_123", mac_hash="mac_123", os_version="iOS 17",
            screen_resolution="1170x2532", cpu_cores=6, installed_apps_hash="apps_123",
            sim_hash="sim_123", carrier="Verizon", timezone="America/New_York"
        ),
        battery_start_pct=90,
        battery_end_pct=85,
        gps_trace=GPSTrace(
            claimed_distance_km=2.0,
            claimed_duration_minutes=15,
            claimed_action_type="cycling",
            points=[
                GPSPoint(latitude=40.7128, longitude=-74.0060, altitude=10, accuracy_meters=5, timestamp=datetime.utcnow(), speed_mps=5.0),
                GPSPoint(latitude=40.7138, longitude=-74.0070, altitude=10, accuracy_meters=5, timestamp=datetime.utcnow(), speed_mps=5.5),
                GPSPoint(latitude=40.7148, longitude=-74.0080, altitude=10, accuracy_meters=5, timestamp=datetime.utcnow(), speed_mps=4.8),
            ]
        ),
        # Add some noise to accelerometer to simulate movement
        sensor_data=SensorData(
            accelerometer_x=[1.5, -2.0, 3.1], accelerometer_y=[12.8, 6.5, 14.2], accelerometer_z=[2.5, -1.6, 4.4],
            gyroscope_x=[0.5], gyroscope_y=[0.2], gyroscope_z=[-0.1],
            sampling_rate_hz=50, duration_seconds=900
        )
    )

def create_mock_fraud_action(user_id: str):
    # GPS Teleportation (200+ km/h in cities) and Battery mismatch
    return GreenActionSubmission(
        action_id="fraud_action_999",
        user_id=user_id,
        action_type="cycling",
        claimed_credits=5000,
        timestamp=datetime.utcnow(),
        device_fingerprint=DeviceFingerprint(
            imei_hash="hash_123", mac_hash="mac_123", os_version="iOS 17",
            screen_resolution="1170x2532", cpu_cores=6, installed_apps_hash="apps_123",
            sim_hash="sim_123", carrier="Verizon", timezone="America/New_York"
        ),
        battery_start_pct=50,
        battery_end_pct=50, # 0 drain but claimed 5000 credits
        gps_trace=GPSTrace(
            claimed_distance_km=20.0,
            claimed_duration_minutes=5, # 20km in 5 mins = 240km/h cycling
            claimed_action_type="cycling",
            points=[
                GPSPoint(latitude=40.7128, longitude=-74.0060, altitude=10, accuracy_meters=0.1, timestamp=datetime.utcnow(), speed_mps=66.0),
                GPSPoint(latitude=40.8128, longitude=-74.1060, altitude=10, accuracy_meters=0.1, timestamp=datetime.utcnow(), speed_mps=66.0),
            ]
        ),
        sensor_data=SensorData(
            # Perfect stillness (mocking)
            accelerometer_x=[0.0, 0.0], accelerometer_y=[9.81, 9.81], accelerometer_z=[0.0, 0.0],
            gyroscope_x=[0.0], gyroscope_y=[0.0], gyroscope_z=[0.0],
            sampling_rate_hz=50, duration_seconds=300
        )
    )

async def run_tests():
    db = SessionLocal()
    try:
        user_id = "test_user_001"
        
        # Ensure user exists in DB to prevent ForeignKeyViolation
        from models.user import User
        from models.action import GreenAction
        
        existing_user = db.query(User).filter(User.id == user_id).first()
        if not existing_user:
            test_user = User(id=user_id, email="test001@example.com", password_hash="pw", full_name="Test User", user_type="individual")
            db.add(test_user)
            db.commit()
            
        # Ensure dummy actions exist in DB to prevent strike foreign key errors
        if not db.query(GreenAction).filter(GreenAction.id == "clean_action_123").first():
            db.add(GreenAction(id="clean_action_123", user_id=user_id, action_type_code="cycling", quantity=1.0, credits_earned=0))
        if not db.query(GreenAction).filter(GreenAction.id == "fraud_action_999").first():
            db.add(GreenAction(id="fraud_action_999", user_id=user_id, action_type_code="cycling", quantity=1.0, credits_earned=0))
        db.commit()

        print("\n--- Registering Device ---")
        layer1 = DeviceFingerprinter(db)
        fp = DeviceFingerprint(
            imei_hash="hash_123", mac_hash="mac_123", os_version="iOS 17",
            screen_resolution="1170x2532", cpu_cores=6, installed_apps_hash="apps_123",
            sim_hash="sim_123", carrier="Verizon", timezone="America/New_York"
        )
        try:
            reg_res = layer1.register_device(user_id, fp)
            token = reg_res['device_token']
            print("Device registered successfully.")
        except ValueError:
            # Already registered
            import jwt
            from config import settings
            token = jwt.encode({
                'user_id': user_id,
                'fingerprint_hash': layer1._hash_fingerprint(fp),
                'device_id': 'test',
                'registered_at': datetime.utcnow().isoformat(),
                'exp': datetime.utcnow() + datetime.timedelta(days=365)
            }, settings.DEVICE_SECRET, algorithm='HS256')
            print("Device was already registered. Forcing token generation.")

        pipeline = VerificationPipeline(db)

        print("\n--- Testing Clean Action ---")
        clean = create_mock_clean_action(user_id)
        res_clean = await pipeline.verify(clean, token)
        print(f"Status: {res_clean.status}")
        print(f"Composite Trust Score: {res_clean.composite_trust_score:.2f}")
        print(f"Credits Awarded: {res_clean.credits_awarded}")
        print(f"Flags: {res_clean.flags}")
        
        print("\n--- Testing Fraudulent Action (GPS Spoof & Teleport) ---")
        fraud = create_mock_fraud_action(user_id)
        res_fraud = await pipeline.verify(fraud, token)
        print(f"Status: {res_fraud.status}")
        print(f"Composite Trust Score: {res_fraud.composite_trust_score:.2f}")
        print(f"Credits Awarded: {res_fraud.credits_awarded}")
        print(f"Flags: {res_fraud.flags}")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_tests())
