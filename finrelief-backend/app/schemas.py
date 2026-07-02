from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    name: Optional[str] = None
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: int
    username: str
    name: Optional[str] = None
    email: Optional[str] = None
    monthly_income: float
    monthly_expenses: float
    extra_payment: float
    strategy: str
    onboarding_completed: bool

    model_config = ConfigDict(from_attributes=True)

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Debt/Loan Schemas (Combined for maximum compatibility and ERD alignment)
class DebtBase(BaseModel):
    creditor: str
    balance: float  # outstanding_amount
    apr: float      # interest_rate
    min_payment: float
    category: str = "Credit Card"  # loan_type
    emi: Optional[float] = None
    overdue_months: int = 0
    loan_amount: float = 0.0      # original loan amount (new ERD column)
    due_date: Optional[str] = None  # payment due date (new ERD column)

class DebtCreate(DebtBase):
    pass

class DebtUpdate(BaseModel):
    creditor: Optional[str] = None
    balance: Optional[float] = None
    apr: Optional[float] = None
    min_payment: Optional[float] = None
    category: Optional[str] = None
    emi: Optional[float] = None
    overdue_months: Optional[int] = None
    loan_amount: Optional[float] = None
    due_date: Optional[str] = None

class DebtResponse(DebtBase):
    id: int  # loan_id
    user_id: int

    model_config = ConfigDict(from_attributes=True)

# Profile Schemas
class ProfileUpdate(BaseModel):
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    extra_payment: Optional[float] = None
    strategy: Optional[str] = None
    onboarding_completed: Optional[bool] = None

# Chat Schemas
class ChatMessageCreate(BaseModel):
    text: str

class ChatMessageResponse(BaseModel):
    id: int
    sender: str  # 'user' or 'ai'
    text: str
    timestamp: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Letter Schemas
class LetterRequest(BaseModel):
    template_type: str  # 'hardship', 'validation', 'settlement'
    creditor_id: str  # Can be empty if none selected
    proposed_payment: Optional[str] = None
    settlement_percent: Optional[str] = None
    user_name: str
    user_address: str

class LetterResponse(BaseModel):
    content: str

# AI History response schema (corresponds to AI_HISTORY)
class AIHistoryResponse(BaseModel):
    history_id: int
    user_id: int
    negotiation_strategy: Optional[str] = None
    settlement_letter: Optional[str] = None
    ai_response: Optional[str] = None
    generated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Negotiation History Schemas (Scenario 2 & 3)
class NegotiationHistoryResponse(BaseModel):
    id: int
    creditor_name: str
    template_type: str
    settlement_percent: Optional[float] = None
    letter_preview: Optional[str] = None
    settlement_letter: Optional[str] = None
    generated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# Settlement Record Response (corresponds to SETTLEMENT_RECORDS)
class SettlementRecordResponse(BaseModel):
    settlement_id: int
    user_id: int
    loan_id: Optional[int] = None
    settlement_prediction: str
    recommended_amount: float
    priority_level: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Settlement Analysis Schemas (Scenario 1)
class SettlementAnalysisRequest(BaseModel):
    debt_id: Optional[int] = None  # None = analyze all debts holistically

class SettlementAnalysisResponse(BaseModel):
    debt_stress_level: str           # 'Low', 'Medium', 'High', 'Critical'
    debt_stress_score: int           # 0–100
    settlement_recommendation_pct: float  # e.g. 45.0 (%)
    financial_health_insights: str   # Markdown bullet text
    recommended_action: str          # Short action sentence
    specific_debt_analysis: Optional[str] = None  # If a specific debt was analyzed
    ai_powered: bool = False         # Was Gemini used?
