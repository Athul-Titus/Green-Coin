"""
GreenCoin Verification — SQLAlchemy Models
Database tables for tracking devices, biometrics, audits, and trust metrics.
"""
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base

class Device(Base):
    __tablename__ = "devices"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fingerprint_hash = Column(String(64), nullable=False, unique=True, index=True)
    trust_level = Column(String(20), default="new")  # new/building/trusted/verified
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

class BiometricProfile(Base):
    __tablename__ = "biometric_profiles"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    profile_vector = Column(JSON, nullable=False)
    std_vector = Column(JSON, nullable=False)
    session_count = Column(Integer, default=0)
    confidence = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ReceiptHash(Base):
    __tablename__ = "receipt_hashes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    perceptual_hash = Column(String(64), nullable=False, index=True)
    action_id = Column(String(36), ForeignKey("green_actions.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

class GraphEdge(Base):
    __tablename__ = "graph_edges"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id_a = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id_b = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    weight = Column(Float, default=0.0)
    edge_types = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AuditRequestDB(Base):
    __tablename__ = "audit_requests"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action_id = Column(String(36), ForeignKey("green_actions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    audit_type = Column(String(20), nullable=False) # VIDEO_SELFIE/DOCUMENT/LIVE_LOCATION/COMMUNITY
    deadline = Column(DateTime(timezone=True), nullable=False)
    credits_held = Column(Integer, default=0)
    status = Column(String(20), default="pending")  # pending/passed/failed/expired
    instructions = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditResponseDB(Base):
    __tablename__ = "audit_responses"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String(36), ForeignKey("audit_requests.id", ondelete="CASCADE"), nullable=False, unique=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    audit_type = Column(String(20), nullable=False)
    media_url = Column(String(255), nullable=True)  # Path to saved file
    result = Column(String(20), nullable=True)      # passed/failed
    confidence = Column(Float, nullable=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

class UserTrustScore(Base):
    __tablename__ = "user_trust_scores"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    score = Column(Float, default=0.5)
    level = Column(String(20), default="building")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserStrike(Base):
    __tablename__ = "user_strikes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String(255), nullable=False)
    action_id = Column(String(36), ForeignKey("green_actions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FraudFlag(Base):
    __tablename__ = "fraud_flags"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    flag_type = Column(String(50), nullable=False)
    evidence = Column(JSON, default=dict)
    severity = Column(String(20), default="medium") # low/medium/high/critical
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CommunityVote(Base):
    __tablename__ = "community_votes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String(36), ForeignKey("audit_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    voter_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vote = Column(String(20), nullable=False) # plausible/suspicious
    created_at = Column(DateTime(timezone=True), server_default=func.now())
