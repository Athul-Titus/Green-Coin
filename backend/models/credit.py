"""GreenCoin — Credit & Bundle SQLAlchemy Models"""
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class CarbonCredit(Base):
    __tablename__ = "carbon_credits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(UUID(as_uuid=True), ForeignKey("green_actions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    quality_score = Column(Integer, default=80)  # 0-100
    status = Column(String(20), default="available")  # available/reserved/sold
    minted_at = Column(DateTime(timezone=True), server_default=func.now())
    sold_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="credits")
    action = relationship("GreenAction", back_populates="credit")


class CreditBundle(Base):
    __tablename__ = "credit_bundles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    total_credits = Column(Float, nullable=False)
    total_users = Column(Integer, default=0)
    action_types = Column(JSON, default=list)    # breakdown [{type, credits, pct}]
    region = Column(String(100))
    quality_score = Column(Integer, default=80)
    price_per_tonne = Column(Float, nullable=False)
    status = Column(String(20), default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def total_tonnes(self):
        return self.total_credits / 100.0

    @property
    def total_price(self):
        return self.total_tonnes * self.price_per_tonne

    # Relationships
    purchases = relationship("BundlePurchase", back_populates="bundle")


class BundlePurchase(Base):
    __tablename__ = "bundle_purchases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bundle_id = Column(UUID(as_uuid=True), ForeignKey("credit_bundles.id"), nullable=False)
    corporate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    credits_purchased = Column(Float, nullable=False)
    price_paid = Column(Float, nullable=False)
    invoice_number = Column(String(50), unique=True)
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def tonnes_purchased(self):
        return self.credits_purchased / 100.0

    # Relationships
    bundle = relationship("CreditBundle", back_populates="purchases")
    certificate = relationship("ESGCertificate", back_populates="purchase", uselist=False)


class ESGCertificate(Base):
    __tablename__ = "esg_certificates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_id = Column(UUID(as_uuid=True), ForeignKey("bundle_purchases.id"), nullable=False)
    corporate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    certificate_number = Column(String(50), unique=True, nullable=False)
    tonnes_offset = Column(Float, nullable=False)
    action_breakdown = Column(JSON, default=dict)
    ghg_scope = Column(String(10), default="Scope 3")
    sdgs_addressed = Column(JSON, default=list)
    pdf_path = Column(String(500))
    qr_code = Column(Text)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    purchase = relationship("BundlePurchase", back_populates="certificate")
