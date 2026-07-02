import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # holds hashed_password
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("FinancialProfile", uselist=False, back_populates="owner", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="owner", cascade="all, delete-orphan")
    settlement_records = relationship("SettlementRecord", back_populates="owner", cascade="all, delete-orphan")
    ai_history = relationship("AIHistory", back_populates="owner", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="owner", cascade="all, delete-orphan")

    @property
    def id(self):
        return self.user_id

    @property
    def monthly_income(self):
        return self.profile.monthly_income if self.profile else 85000.0

    @property
    def monthly_expenses(self):
        return self.profile.monthly_expenses if self.profile else 42000.0

    @property
    def extra_payment(self):
        return self.profile.extra_payment if self.profile else 5000.0

    @property
    def strategy(self):
        return self.profile.strategy if self.profile else "avalanche"

    @property
    def onboarding_completed(self):
        return self.profile.onboarding_completed if self.profile else False



class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    monthly_income = Column(Float, default=85000.0)
    monthly_expenses = Column(Float, default=42000.0)
    existing_debts = Column(Float, default=0.0)  # Sum of all outstanding loans
    financial_health_score = Column(Integer, default=100)
    extra_payment = Column(Float, default=5000.0)
    strategy = Column(String, default="avalanche")
    onboarding_completed = Column(Boolean, default=False)

    owner = relationship("User", back_populates="profile")


class Loan(Base):
    __tablename__ = "loans"

    loan_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    loan_type = Column(String, default="Credit Card")  # e.g., 'Credit Card', 'Auto Loan'
    loan_amount = Column(Float, default=0.0)  # Original loan amount
    outstanding_amount = Column(Float, nullable=False)  # Current balance
    interest_rate = Column(Float, nullable=False)  # APR %
    due_date = Column(String, nullable=True)  # Payment due date

    # Compatibility fields for payoff timelines and calculators
    creditor = Column(String, nullable=False, default="")
    min_payment = Column(Float, nullable=False, default=0.0)
    emi = Column(Float, nullable=True)
    overdue_months = Column(Integer, default=0)

    owner = relationship("User", back_populates="loans")

    @property
    def id(self):
        return self.loan_id

    @property
    def balance(self):
        return self.outstanding_amount

    @property
    def apr(self):
        return self.interest_rate

    @property
    def category(self):
        return self.loan_type



class SettlementRecord(Base):
    __tablename__ = "settlement_records"

    settlement_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.loan_id", ondelete="CASCADE"), nullable=True)
    settlement_prediction = Column(String, nullable=False)  # e.g., 'Likely', 'Critical Stress'
    recommended_amount = Column(Float, nullable=False)
    priority_level = Column(String, nullable=False)  # e.g., 'High', 'Medium', 'Low'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="settlement_records")
    loan = relationship("Loan")


class AIHistory(Base):
    __tablename__ = "ai_histories"

    history_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    negotiation_strategy = Column(String, nullable=True)  # e.g., 'hardship', 'settlement'
    settlement_letter = Column(Text, nullable=True)
    ai_response = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Added columns for compatibility & metadata
    creditor_name = Column(String, nullable=True)
    settlement_percent = Column(Float, nullable=True)

    owner = relationship("User", back_populates="ai_history")

    @property
    def id(self):
        return self.history_id

    @property
    def template_type(self):
        return self.negotiation_strategy

    @property
    def letter_preview(self):
        return self.settlement_letter[:300] if self.settlement_letter else ""



class ChatHistory(Base):
    __tablename__ = "chat_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    sender = Column(String, nullable=False)  # 'user' or 'ai'
    text = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="chat_history")
