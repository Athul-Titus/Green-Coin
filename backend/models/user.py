"""GreenCoin — User SQLAlchemy Model"""
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Enum
from sqlalchemy import String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class UserType(str, enum.Enum):
    individual = "individual"
    corporate = "corporate"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    user_type = Column(String(20), nullable=False, default="individual")
    full_name = Column(String(255))
    phone = Column(String(20))
    location = Column(String(255))
    city = Column(String(100))
    neighborhood_type = Column(String(50))  # urban/suburban/rural
    lifestyle_profile = Column(JSON, default=dict)
    green_score = Column(Integer, default=0)

    # Corporate-specific
    company_name = Column(String(255))
    company_gstin = Column(String(20))
    esg_target_tonnes = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    actions = relationship("GreenAction", back_populates="user", lazy="dynamic")
    credits = relationship("CarbonCredit", back_populates="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.email} [{self.user_type}]>"
