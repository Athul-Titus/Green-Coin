"""GreenCoin — AdvisorPlan & UserCluster Models"""
import uuid
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy import String
from sqlalchemy.sql import func
from database import Base


class AdvisorPlan(Base):
    __tablename__ = "advisor_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    cluster_label = Column(String(50))
    recommendations = Column(JSON, default=list)
    forecast = Column(JSON, default=dict)
    peer_stats = Column(JSON, default=dict)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())


class UserCluster(Base):
    __tablename__ = "user_clusters"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    cluster_id = Column(Integer, nullable=False)
    cluster_label = Column(String(50), nullable=False)
    feature_vector = Column(JSON, default=dict)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
