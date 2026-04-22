"""GreenCoin — GreenAction SQLAlchemy Model"""
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy import String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class GreenAction(Base):
    __tablename__ = "green_actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type_code = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    quantity = Column(Float, nullable=False, default=1.0)  # km / meals / kWh / kg
    proof_data = Column(JSON, default=dict)  # GPS trace / receipt URL / meter reading
    verification_status = Column(String(20), nullable=False, default="pending")
    trust_score = Column(Integer, nullable=True)  # 0-100
    fraud_flags = Column(JSON, default=list)
    credits_earned = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="actions")
    credit = relationship("CarbonCredit", back_populates="action", uselist=False)

    def __repr__(self):
        return f"<GreenAction {self.action_type_code} [{self.verification_status}]>"
