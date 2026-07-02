from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])

@router.get("/", response_model=schemas.UserResponse)
def read_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.profile:
        current_user.profile = models.FinancialProfile(user_id=current_user.user_id)
        db.add(current_user.profile)
        db.commit()
        db.refresh(current_user)
    return current_user

@router.put("/", response_model=schemas.UserResponse)
def update_profile(
    profile_update: schemas.ProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.profile:
        current_user.profile = models.FinancialProfile(user_id=current_user.user_id)
        db.add(current_user.profile)
        db.commit()
        db.refresh(current_user)
        
    update_data = profile_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user.profile, key, value)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/reset", response_model=schemas.UserResponse)
def reset_profile_data(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Delete all user loans (debts)
    db.query(models.Loan).filter(models.Loan.user_id == current_user.user_id).delete()

    # Delete chat history
    db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.user_id).delete()

    # Delete AI negotiation history (AIHistory)
    db.query(models.AIHistory).filter(models.AIHistory.user_id == current_user.user_id).delete()

    # Delete settlement records
    db.query(models.SettlementRecord).filter(models.SettlementRecord.user_id == current_user.user_id).delete()
    
    # Reset profile cashflow details
    if not current_user.profile:
        current_user.profile = models.FinancialProfile(user_id=current_user.user_id)
        db.add(current_user.profile)
        
    current_user.profile.monthly_income = 50000.0
    current_user.profile.monthly_expenses = 25000.0
    current_user.profile.extra_payment = 0.0
    current_user.profile.strategy = "avalanche"
    current_user.profile.onboarding_completed = False
    current_user.profile.existing_debts = 0.0
    current_user.profile.financial_health_score = 100
    
    db.commit()
    db.refresh(current_user)
    return current_user
