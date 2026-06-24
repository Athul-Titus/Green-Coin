from sqlalchemy import (
    Column, String, Integer, Float,
    Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id           = Column(String, primary_key=True,
                          default=generate_uuid)
    full_name    = Column(String, nullable=False)
    email        = Column(String, unique=True,
                          nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    user_type    = Column(String, default="individual")
                  # individual / corporate

    # Lifestyle profile from onboarding
    location          = Column(String, nullable=True)
    neighborhood_type = Column(String, nullable=True)
    commute_type      = Column(String, nullable=True)
    diet_type         = Column(String, nullable=True)
    has_solar         = Column(Boolean, default=False)
    has_led           = Column(Boolean, default=False)
    has_smart_meter   = Column(Boolean, default=False)
    has_ev_charger    = Column(Boolean, default=False)

    # Trust and credits
    trust_score       = Column(Float, default=50.0)
    total_credits     = Column(Integer, default=0)
    available_credits = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now())
    updated_at = Column(DateTime(timezone=True),
                        onupdate=func.now())

    # Relationships
    actions     = relationship("GreenAction",
                               back_populates="user")
    credits     = relationship("CarbonCredit",
                               back_populates="user")

class GreenAction(Base):
    __tablename__ = "green_actions"

    id             = Column(String, primary_key=True,
                            default=generate_uuid)
    user_id        = Column(String,
                            ForeignKey("users.id"),
                            nullable=False)
    action_type    = Column(String, nullable=False)
    claimed_credits = Column(Integer, default=0)
    awarded_credits = Column(Integer, default=0)
    trust_score    = Column(Float, default=0.0)
    status         = Column(String, default="pending")
                   # pending/verified/rejected/audit_pending
    proof_data     = Column(JSON, nullable=True)
    created_at     = Column(DateTime(timezone=True),
                            server_default=func.now())

    user = relationship("User", back_populates="actions")
    credits = relationship("CarbonCredit",
                           back_populates="action")

class CarbonCredit(Base):
    __tablename__ = "carbon_credits"

    id           = Column(String, primary_key=True,
                          default=generate_uuid)
    user_id      = Column(String,
                          ForeignKey("users.id"),
                          nullable=False)
    action_id    = Column(String,
                          ForeignKey("green_actions.id"),
                          nullable=True)
    amount       = Column(Integer, nullable=False)
    status       = Column(String, default="available")
                 # available/sold/held/reserved
    quality_score = Column(Float, default=0.0)
    created_at   = Column(DateTime(timezone=True),
                          server_default=func.now())

    user   = relationship("User", back_populates="credits")
    action = relationship("GreenAction",
                          back_populates="credits")

class CreditBundle(Base):
    __tablename__ = "credit_bundles"

    id              = Column(String, primary_key=True,
                             default=generate_uuid)
    total_credits   = Column(Integer, nullable=False)
    total_users     = Column(Integer, default=0)
    action_types    = Column(JSON, nullable=True)
    quality_score   = Column(Float, default=0.0)
    price_per_tonne = Column(Float, default=15.0)
    status          = Column(String, default="available")
    created_at      = Column(DateTime(timezone=True),
                             server_default=func.now())
