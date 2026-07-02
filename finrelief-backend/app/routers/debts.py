from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/debts", tags=["Debts/Loans"])

def update_existing_debts_total(user_id: int, db: Session):
    loans = db.query(models.Loan).filter(models.Loan.user_id == user_id).all()
    total_outstanding = sum(l.outstanding_amount for l in loans)
    profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == user_id).first()
    if profile:
        profile.existing_debts = total_outstanding
        db.commit()

@router.get("/", response_model=List[schemas.DebtResponse])
def read_debts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure profile exists
    if not current_user.profile:
        current_user.profile = models.FinancialProfile(user_id=current_user.user_id)
        db.add(current_user.profile)
        db.commit()
    
    return db.query(models.Loan).filter(models.Loan.user_id == current_user.user_id).all()

@router.post("/", response_model=schemas.DebtResponse, status_code=status.HTTP_201_CREATED)
def create_debt(
    debt: schemas.DebtCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Map schemas.DebtCreate to models.Loan
    db_loan = models.Loan(
        user_id=current_user.user_id,
        loan_type=debt.category,
        loan_amount=debt.loan_amount if debt.loan_amount > 0 else debt.balance,
        outstanding_amount=debt.balance,
        interest_rate=debt.apr,
        due_date=debt.due_date,
        creditor=debt.creditor,
        min_payment=debt.min_payment,
        emi=debt.emi,
        overdue_months=debt.overdue_months
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    
    # Update existing_debts cached sum
    update_existing_debts_total(current_user.user_id, db)
    
    return db_loan

@router.put("/{debt_id}", response_model=schemas.DebtResponse)
def update_debt(
    debt_id: int,
    debt_update: schemas.DebtUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_loan = db.query(models.Loan).filter(
        models.Loan.loan_id == debt_id, 
        models.Loan.user_id == current_user.user_id
    ).first()
    
    if not db_loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt account not found or unauthorized access"
        )
    
    update_data = debt_update.model_dump(exclude_unset=True)
    
    # Map fields
    if "balance" in update_data:
        db_loan.outstanding_amount = update_data.pop("balance")
    if "apr" in update_data:
        db_loan.interest_rate = update_data.pop("apr")
    if "category" in update_data:
        db_loan.loan_type = update_data.pop("category")
    if "loan_amount" in update_data:
        db_loan.loan_amount = update_data.pop("loan_amount")
    if "due_date" in update_data:
        db_loan.due_date = update_data.pop("due_date")
        
    for key, value in update_data.items():
        setattr(db_loan, key, value)
        
    db.commit()
    db.refresh(db_loan)
    
    # Update existing_debts cached sum
    update_existing_debts_total(current_user.user_id, db)
    
    return db_loan

@router.delete("/{debt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_debt(
    debt_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_loan = db.query(models.Loan).filter(
        models.Loan.loan_id == debt_id, 
        models.Loan.user_id == current_user.user_id
    ).first()
    
    if not db_loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt account not found or unauthorized access"
        )
        
    db.delete(db_loan)
    db.commit()
    
    # Update existing_debts cached sum
    update_existing_debts_total(current_user.user_id, db)
    
    return None
