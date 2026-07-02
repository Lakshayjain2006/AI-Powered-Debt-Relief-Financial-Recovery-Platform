import os
import datetime
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import google.generativeai as genai

from app.database import get_db
from app import models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Advisor & Letter Generator"])

# Load API Key from environment
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
    gemini_available = True
else:
    gemini_available = False

# ---------------------------------------------------------------------------
# Helper: Heuristic fallback when Gemini API key is missing
# ---------------------------------------------------------------------------
def get_heuristic_reply(user_message: str, current_user: models.User, debts: List[models.Loan]) -> str:
    text = user_message.lower()
    if not debts:
        return "It looks like you don't have any debts entered yet! Go to the 'Debt Tracker' page, add your active accounts, and I will be able to analyze them and suggest a plan."

    total_debt = sum(d.outstanding_amount for d in debts)
    total_min = sum(d.min_payment for d in debts)
    
    monthly_income = current_user.profile.monthly_income if current_user.profile else 85000.0
    monthly_expenses = current_user.profile.monthly_expenses if current_user.profile else 42000.0
    extra_payment = current_user.profile.extra_payment if current_user.profile else 5000.0
    strategy_name = current_user.profile.strategy if current_user.profile else "avalanche"

    net_savings = monthly_income - (monthly_expenses + total_min)
    high_apr_debt = sorted(debts, key=lambda x: x.interest_rate, reverse=True)[0]

    if "compare" in text or "avalanche" in text or "snowball" in text or "saving" in text:
        return (
            f"Comparing your repayment philosophies:\n"
            f"• **Avalanche Strategy**: Focuses on paying off {high_apr_debt.creditor} ({high_apr_debt.interest_rate}% APR) first. This minimizes total interest.\n"
            f"• **Snowball Strategy**: Prioritizes smaller accounts first to build quick momentum.\n\n"
            f"Currently, your strategy is set to **{strategy_name}** with an extra payment of ₹{extra_payment}. "
            f"I advise allocating all extra cash towards your high-rate accounts to maximize interest savings."
        )

    if "budget" in text or "danger" in text or "dti" in text or "health" in text or "debt-to-income" in text:
        dti = (total_min / monthly_income * 100) if monthly_income > 0 else 0
        dti_status = "CRITICAL ALERT" if dti > 50 else ("HIGH RISK" if dti > 36 else "MANAGEABLE")
        cash_status = f"deficit of -₹{abs(round(net_savings))}/mo" if net_savings < 0 else f"surplus of ₹{round(net_savings)}/mo"
        return (
            f"Here is your financial security analysis:\n"
            f"• **Debt-to-Income (DTI)**: **{dti:.1f}%** ({dti_status})\n"
            f"• **Monthly Cashflow**: You have a {cash_status}.\n\n"
            f"If you'd like, I can help you draft a hardship letter to request interest reduction from your largest creditors."
        )

    if "negotiate" in text or "creditor" in text or "interest" in text or "letter" in text:
        return (
            f"To negotiate your high APR debt, I recommend targeting your highest interest account first: **{high_apr_debt.creditor}** at **{high_apr_debt.interest_rate}% APR**.\n\n"
            f"Here is the battle plan:\n"
            f"1. Open the **Hardship Letters** generator in the side menu.\n"
            f"2. Select the **Request Interest Reduction (Hardship)** template.\n"
            f"3. Select **{high_apr_debt.creditor}** as your creditor.\n"
            f"4. Copy the generated correspondence and send it to their customer service."
        )

    return (
        f"I've analyzed your financial ledger. You currently owe **₹{total_debt:,.2f}** across **{len(debts)} creditors** "
        f"with a monthly extra payment of **₹{extra_payment}**.\n\n"
        f"Please feel free to ask me questions like:\n"
        f"• 'Compare my Avalanche vs. Snowball saving stats'\n"
        f"• 'Am I in budget danger?'\n"
        f"• 'Help me negotiate my highest interest debt ({high_apr_debt.creditor})'"
    )


# ---------------------------------------------------------------------------
# Helper: Heuristic settlement analysis (fallback for Scenario 1)
# ---------------------------------------------------------------------------
def compute_heuristic_settlement(current_user: models.User, debts: List[models.Loan], target_debt: models.Loan = None) -> dict:
    """Compute stress level, settlement %, and health insights without AI."""
    total_debt = sum(d.outstanding_amount for d in debts)
    total_min = sum(d.min_payment for d in debts)
    
    monthly_income = current_user.profile.monthly_income if current_user.profile else 85000.0
    monthly_expenses = current_user.profile.monthly_expenses if current_user.profile else 42000.0

    dti = (total_min / monthly_income * 100) if monthly_income > 0 else 0
    net_savings = monthly_income - (monthly_expenses + total_min)
    avg_apr = sum(d.interest_rate for d in debts) / len(debts) if debts else 0
    max_overdue = max((d.overdue_months for d in debts), default=0)

    # Stress score (0–100, higher = worse)
    stress_score = 0
    if dti > 50:       stress_score += 35
    elif dti > 36:     stress_score += 25
    elif dti > 20:     stress_score += 15
    else:              stress_score += 5

    if net_savings < 0:         stress_score += 30
    elif net_savings < 5000:    stress_score += 15
    elif net_savings < 15000:   stress_score += 5

    if avg_apr > 24:   stress_score += 20
    elif avg_apr > 18: stress_score += 12
    elif avg_apr > 12: stress_score += 5

    if max_overdue > 6:  stress_score += 15
    elif max_overdue > 3: stress_score += 8
    elif max_overdue > 0: stress_score += 4

    stress_score = min(100, stress_score)

    if stress_score >= 75:   stress_level = "Critical"
    elif stress_score >= 50: stress_level = "High"
    elif stress_score >= 25: stress_level = "Medium"
    else:                    stress_level = "Low"

    # Settlement recommendation % (lower stress → higher we can negotiate from position of strength)
    if stress_level == "Critical":  settlement_pct = 35.0
    elif stress_level == "High":    settlement_pct = 45.0
    elif stress_level == "Medium":  settlement_pct = 55.0
    else:                           settlement_pct = 65.0

    # Financial health insights
    insights_lines = []
    if dti > 36:
        insights_lines.append(f"• ⚠️ Your DTI is **{dti:.1f}%** — above the healthy 36% ceiling. Creditors will see you as high risk.")
    else:
        insights_lines.append(f"• ✅ Your DTI is **{dti:.1f}%** — within manageable range.")

    if net_savings < 0:
        insights_lines.append(f"• 🔴 Monthly **cash deficit of ₹{abs(round(net_savings)):,}** — your expenses exceed income after debt minimums.")
    else:
        insights_lines.append(f"• 💰 Monthly **surplus of ₹{round(net_savings):,}** available after all minimum payments.")

    if avg_apr > 18:
        insights_lines.append(f"• 📈 Average APR is **{avg_apr:.1f}%** — high interest is accelerating your total debt load.")

    if max_overdue > 0:
        insights_lines.append(f"• 📅 You have accounts **{max_overdue} month(s) overdue** — negotiation is time-sensitive.")

    if target_debt:
        specific = (
            f"Analysis for **{target_debt.creditor}** (₹{target_debt.outstanding_amount:,.0f} @ {target_debt.interest_rate}% APR): "
            f"Recommend proposing a {settlement_pct:.0f}% lump-sum settlement = ₹{target_debt.outstanding_amount * settlement_pct / 100:,.0f}."
        )
    else:
        specific = None

    # Recommended action
    if stress_level in ("Critical", "High"):
        action = "Open the Hardship Letters tool and immediately generate a settlement letter for your highest-APR creditor."
    elif stress_level == "Medium":
        action = "Consider drafting a hardship payment plan request to reduce minimum payments and improve cash flow."
    else:
        action = "Your situation is manageable. Focus extra payments on your highest APR debt using the Avalanche strategy."

    return {
        "debt_stress_level": stress_level,
        "debt_stress_score": stress_score,
        "settlement_recommendation_pct": settlement_pct,
        "financial_health_insights": "\n".join(insights_lines),
        "recommended_action": action,
        "specific_debt_analysis": specific,
        "ai_powered": False,
    }


# ---------------------------------------------------------------------------
# GET /ai/status
# ---------------------------------------------------------------------------
@router.get("/status")
def get_ai_status():
    return {
        "gemini_available": gemini_available,
        "model": "gemini-2.5-flash" if gemini_available else None,
        "mode": "AI-Powered" if gemini_available else "Heuristic Fallback"
    }


# ---------------------------------------------------------------------------
# GET /ai/chat/history
# ---------------------------------------------------------------------------
@router.get("/chat/history", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == current_user.user_id
    ).order_by(models.ChatHistory.timestamp.asc()).all()

    if not history:
        monthly_income = current_user.profile.monthly_income if current_user.profile else 85000.0
        
        welcome_text = "Hello! I am FinRelief's AI Assistant. I've analyzed your profile. "
        debts = db.query(models.Loan).filter(models.Loan.user_id == current_user.user_id).all()
        if debts:
            total_debt = sum(d.outstanding_amount for d in debts)
            total_min = sum(d.min_payment for d in debts)
            dti = (total_min / monthly_income * 100) if monthly_income > 0 else 0
            welcome_text += f"Your total debt is ₹{total_debt:,.2f}, and your Debt-to-Income ratio is {dti:.1f}%. "
        else:
            welcome_text += "You currently don't have any debts added to your ledger. "
        welcome_text += "How can I assist you in your financial recovery today? I can help draft negotiation letters, suggest custom budgets, or compare repayment strategies."

        welcome_msg = models.ChatHistory(
            user_id=current_user.user_id,
            sender="ai",
            text=welcome_text,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(welcome_msg)
        db.commit()
        db.refresh(welcome_msg)
        history = [welcome_msg]

    return history


# ---------------------------------------------------------------------------
# POST /ai/chat
# ---------------------------------------------------------------------------
@router.post("/chat", response_model=schemas.ChatMessageResponse)
def chat_with_advisor(
    message: schemas.ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_msg = models.ChatHistory(
        user_id=current_user.user_id,
        sender="user",
        text=message.text,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    monthly_income = current_user.profile.monthly_income if current_user.profile else 85000.0
    monthly_expenses = current_user.profile.monthly_expenses if current_user.profile else 42000.0
    extra_payment = current_user.profile.extra_payment if current_user.profile else 5000.0
    strategy_name = current_user.profile.strategy if current_user.profile else "avalanche"

    debts = db.query(models.Loan).filter(models.Loan.user_id == current_user.user_id).all()
    total_debt = sum(d.outstanding_amount for d in debts)
    total_min = sum(d.min_payment for d in debts)
    net_savings = monthly_income - (monthly_expenses + total_min)

    debts_summary = "\n".join([
        f"- Creditor: {d.creditor}, Balance: ₹{d.outstanding_amount}, APR: {d.interest_rate}%, Category: {d.loan_type}, "
        f"Min Payment: ₹{d.min_payment}, EMI: {'₹' + str(d.emi) if d.emi else 'N/A'}, "
        f"Overdue Months: {d.overdue_months}"
        for d in debts
    ])

    ai_reply = ""

    if gemini_available:
        try:
            system_prompt = (
                f"You are FinRelief's AI Assistant, a highly professional and empathetic debt advisor. "
                f"You help borrowers optimize budgets, lower interest rates, and navigate debt settlement. "
                f"The borrower's current financial profile:\n"
                f"- Monthly Income: ₹{monthly_income}\n"
                f"- Monthly Living Expenses (excluding debt payments): ₹{monthly_expenses}\n"
                f"- Extra Monthly Payoff Payment: ₹{extra_payment}\n"
                f"- Active repayment strategy: {strategy_name}\n"
                f"- Net Monthly Surplus (Savings): ₹{net_savings}\n"
                f"- Active tracked debts:\n{debts_summary if debts else 'None'}\n\n"
                f"Respond directly, helpfully, and concisely to the user's message. "
                f"Always structure recommendations using markdown bullets, and specify currencies in INR (₹). "
                f"If the user asks to negotiate or draft a letter, remind them to use the 'Hardship Letters' menu."
            )

            prev_messages = db.query(models.ChatHistory).filter(
                models.ChatHistory.user_id == current_user.user_id
            ).order_by(models.ChatHistory.timestamp.desc()).limit(6).all()

            conversation_history = ""
            for msg in reversed(prev_messages):
                conversation_history += f"{msg.sender.upper()}: {msg.text}\n"

            prompt = f"{system_prompt}\n\nCONVERSATION HISTORY:\n{conversation_history}\nUSER: {message.text}\nAI:"

            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            ai_reply = response.text.strip()
        except Exception as e:
            ai_reply = get_heuristic_reply(message.text, current_user, debts)
    else:
        ai_reply = get_heuristic_reply(message.text, current_user, debts)

    ai_msg = models.ChatHistory(
        user_id=current_user.user_id,
        sender="ai",
        text=ai_reply,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ai_msg


# ---------------------------------------------------------------------------
# POST /ai/settlement-analysis  (Scenario 1 — core endpoint with DB logging)
# ---------------------------------------------------------------------------
@router.post("/settlement-analysis", response_model=schemas.SettlementAnalysisResponse)
def run_settlement_analysis(
    req: schemas.SettlementAnalysisRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    debts = db.query(models.Loan).filter(models.Loan.user_id == current_user.user_id).all()
    if not debts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No debts found. Please add at least one debt account before running analysis."
        )

    target_debt = None
    if req.debt_id:
        target_debt = db.query(models.Loan).filter(
            models.Loan.loan_id == req.debt_id,
            models.Loan.user_id == current_user.user_id
        ).first()

    monthly_income = current_user.profile.monthly_income if current_user.profile else 85000.0
    monthly_expenses = current_user.profile.monthly_expenses if current_user.profile else 42000.0

    result = None
    # Try Gemini first for rich analysis
    if gemini_available:
        try:
            total_debt = sum(d.outstanding_amount for d in debts)
            total_min = sum(d.min_payment for d in debts)
            net_savings = monthly_income - (monthly_expenses + total_min)
            dti = (total_min / monthly_income * 100) if monthly_income > 0 else 0
            avg_apr = sum(d.interest_rate for d in debts) / len(debts)

            debts_detail = "\n".join([
                f"  - {d.creditor}: ₹{d.outstanding_amount:,.0f} @ {d.interest_rate}% APR, "
                f"Min Payment ₹{d.min_payment:,.0f}, "
                f"{'EMI ₹' + str(d.emi) if d.emi else ''}, "
                f"Overdue: {d.overdue_months} months"
                for d in debts
            ])

            target_context = ""
            if target_debt:
                target_context = (
                    f"\nFocus the settlement recommendation on this specific debt: "
                    f"{target_debt.creditor} (₹{target_debt.outstanding_amount:,.0f} @ {target_debt.interest_rate}% APR, "
                    f"overdue {target_debt.overdue_months} months)."
                )

            prompt = (
                f"You are an expert debt settlement analyst. Analyze the following borrower profile and provide a structured assessment.\n\n"
                f"BORROWER PROFILE:\n"
                f"- Monthly Income: ₹{monthly_income:,.0f}\n"
                f"- Monthly Living Expenses: ₹{monthly_expenses:,.0f}\n"
                f"- Net Monthly Surplus: ₹{net_savings:,.0f}\n"
                f"- Debt-to-Income Ratio: {dti:.1f}%\n"
                f"- Average APR: {avg_apr:.1f}%\n"
                f"- Total Outstanding Debt: ₹{total_debt:,.0f}\n"
                f"- Active Debts:\n{debts_detail}\n"
                f"{target_context}\n\n"
                f"Respond ONLY as a JSON object with these exact keys (no markdown, no explanation):\n"
                f"{{\n"
                f'  "debt_stress_level": "Low|Medium|High|Critical",\n'
                f'  "debt_stress_score": <integer 0-100>,\n'
                f'  "settlement_recommendation_pct": <float, e.g. 45.0>,\n'
                f'  "financial_health_insights": "<markdown bullets with ₹ values>",\n'
                f'  "recommended_action": "<one sentence action>",\n'
                f'  "specific_debt_analysis": "<one sentence about the target debt, or null>"\n'
                f"}}"
            )

            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            raw = response.text.strip()

            # Clean up Gemini's response (may wrap in ```json ... ```)
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            import json
            parsed = json.loads(raw)
            parsed["ai_powered"] = True
            result = parsed

        except Exception:
            pass

    # Heuristic fallback if Gemini fails or is unavailable
    if not result:
        result = compute_heuristic_settlement(current_user, debts, target_debt)

    # 1. Save SettlementRecord history entry to DB
    total_debt = sum(d.outstanding_amount for d in debts)
    recommended_pct = float(result.get("settlement_recommendation_pct", 50.0))
    rec_amount = float(total_debt * recommended_pct / 100.0)
    
    if target_debt:
        rec_amount = float(target_debt.outstanding_amount * recommended_pct / 100.0)

    db_record = models.SettlementRecord(
        user_id=current_user.user_id,
        loan_id=target_debt.loan_id if target_debt else None,
        settlement_prediction=f"{result.get('debt_stress_level', 'Medium')} Stress Analysis Result",
        recommended_amount=rec_amount,
        priority_level=result.get("debt_stress_level", "Medium"),
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_record)
    
    # Save the score back to FinancialProfile
    if current_user.profile:
        current_user.profile.financial_health_score = int(100 - result.get("debt_stress_score", 0))
    
    db.commit()

    return schemas.SettlementAnalysisResponse(**result)


# ---------------------------------------------------------------------------
# GET /ai/settlement-history (Get past settlement logs)
# ---------------------------------------------------------------------------
@router.get("/settlement-history", response_model=List[schemas.SettlementRecordResponse])
def get_settlement_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.SettlementRecord).filter(
        models.SettlementRecord.user_id == current_user.user_id
    ).order_by(models.SettlementRecord.created_at.desc()).all()


# ---------------------------------------------------------------------------
# GET /ai/negotiation-history  (Scenario 3 — mapped to AIHistory)
# ---------------------------------------------------------------------------
@router.get("/negotiation-history", response_model=List[schemas.NegotiationHistoryResponse])
def get_negotiation_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Load from AIHistory and serialize as NegotiationHistoryResponse
    history = db.query(models.AIHistory).filter(
        models.AIHistory.user_id == current_user.user_id
    ).order_by(models.AIHistory.generated_at.desc()).all()
    
    # NegotiationHistoryResponse expects 'id', 'creditor_name', 'template_type', 'settlement_percent', 'letter_preview', 'generated_at'
    # All of these are available directly or via properties on models.AIHistory
    return history


# ---------------------------------------------------------------------------
# POST /ai/generate-letter  (Scenario 2 — logs output in AIHistory)
# ---------------------------------------------------------------------------
@router.post("/generate-letter", response_model=schemas.LetterResponse)
def generate_hardship_letter(
    letter_req: schemas.LetterRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    creditor_name = "[Creditor Name]"
    debt_balance = 0.0
    debt_id_for_history = None

    if letter_req.creditor_id:
        try:
            debt_id = int(letter_req.creditor_id)
            db_debt = db.query(models.Loan).filter(
                models.Loan.loan_id == debt_id,
                models.Loan.user_id == current_user.user_id
            ).first()
            if db_debt:
                creditor_name = db_debt.creditor
                debt_balance = db_debt.outstanding_amount
                debt_id_for_history = db_debt.loan_id
        except ValueError:
            pass

    today = datetime.date.today().strftime("%B %d, %Y")
    letter_content = ""

    if gemini_available:
        try:
            prompt = (
                f"You are an expert financial writer. Draft a professional, highly formal letter of request "
                f"on behalf of {letter_req.user_name} (Address: {letter_req.user_address}) "
                f"dated {today}.\n\n"
            )

            if letter_req.template_type == 'hardship':
                prompt += (
                    f"The letter is to the Hardship Department of {creditor_name} regarding an outstanding debt balance of ₹{debt_balance:,.2f}.\n"
                    f"The user is experiencing financial hardship due to unforeseen costs and wants to request a lower interest rate "
                    f"and propose a fixed monthly payment plan of ₹{letter_req.proposed_payment} per month.\n"
                    f"Make the tone urgent yet professional, expressing a strong desire to pay rather than default."
                )
            elif letter_req.template_type == 'validation':
                prompt += (
                    f"The letter is to the Disputes and Collections Department of {creditor_name} regarding an alleged balance of ₹{debt_balance:,.2f}.\n"
                    f"This is a formal Debt Validation Request under collection guidelines. Request detailed contract verification, "
                    f"legality proof, and ledger accounting history. Make it firm, clear, and assertive."
                )
            elif letter_req.template_type == 'settlement':
                proposed_val = 0.0
                try:
                    pct = float(letter_req.settlement_percent or "50")
                    proposed_val = debt_balance * (pct / 100.0)
                except ValueError:
                    pass
                prompt += (
                    f"The letter is to the Settlements Department of {creditor_name} regarding a balance of ₹{debt_balance:,.2f}.\n"
                    f"Propose a one-time cash lump-sum settlement of ₹{proposed_val:,.2f} (which is {letter_req.settlement_percent}% of the balance) "
                    f"in exchange for reporting the account status as 'Paid in Full / Settled' and removing any collection marks. "
                    f"Make it clear that this offer is made in good faith to resolve the issue without bankruptcy."
                )
            else:
                raise HTTPException(status_code=400, detail="Invalid template type requested")

            prompt += "\n\nProvide ONLY the complete letter text. Use placeholders like [Insert Account Number] where appropriate."

            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            letter_content = response.text.strip()

        except HTTPException:
            raise
        except Exception:
            letter_content = ""

    # Static fallback template generator (used when Gemini unavailable or errored)
    if not letter_content:
        if letter_req.template_type == 'hardship':
            letter_content = (
                f"Date: {today}\n\n"
                f"To: Hardship & Assistance Department\n"
                f"Creditor: {creditor_name}\n\n"
                f"RE: Request for Interest Rate Reduction & Hardship Assistance\n"
                f"Account Reference: [Insert Account Number Here]\n\n"
                f"Dear Assistance Officer,\n\n"
                f"I am writing this letter to request temporary financial hardship relief regarding my outstanding balance of ₹{debt_balance:,.2f}. "
                f"Recently, I have experienced a severe financial constraint due to unforeseen cost changes, which has impacted my cash flow.\n\n"
                f"I am fully committed to fulfilling my obligations and want to avoid default. However, with my current interest rate, "
                f"my minimum payments are no longer sustainable. I am requesting that you consider:\n"
                f"1. Temporarily reducing my interest rate (APR) for the next 12 months.\n"
                f"2. Setting a fixed hardship payment plan of ₹{letter_req.proposed_payment or '5,000'} per month.\n\n"
                f"I have attached a copy of my current basic cashflow and would appreciate your department contacting me at [Insert Phone Number Here] "
                f"or via my email [Insert Email Here] to confirm if we can arrange this agreement.\n\n"
                f"Thank you very much for your time and understanding.\n\n"
                f"Sincerely,\n\n"
                f"{letter_req.user_name}\n"
                f"{letter_req.user_address}"
            )
        elif letter_req.template_type == 'validation':
            letter_content = (
                f"Date: {today}\n\n"
                f"To: Billing Disputes & Collection Department\n"
                f"Agency: {creditor_name}\n\n"
                f"RE: Formal Debt Validation Request\n"
                f"Account Reference: [Insert Reference / Account Number Here]\n\n"
                f"To Whom It May Concern,\n\n"
                f"I am writing this letter in response to recent contact regarding an alleged debt of ₹{debt_balance:,.2f}. "
                f"I am formally requesting validation of this debt.\n\n"
                f"Please provide me with the following documentation:\n"
                f"1. Proof that your agency has the legal authority to collect debts in my home state.\n"
                f"2. A copy of the original contract signed by myself and the original creditor.\n"
                f"3. A complete ledger history of the debt, accounting for all payments made, interest accrued, and fees assessed.\n"
                f"4. Verification that the statute of limitations for collecting this debt has not expired.\n\n"
                f"Please note that if you fail to provide this validation within 30 days, you must cease all collection activities and delete "
                f"any negative trade lines reported to the credit bureaus immediately.\n\n"
                f"Sincerely,\n\n"
                f"{letter_req.user_name}\n"
                f"{letter_req.user_address}"
            )
        elif letter_req.template_type == 'settlement':
            proposed_val = 0.0
            try:
                pct = float(letter_req.settlement_percent or "50")
                proposed_val = debt_balance * (pct / 100.0)
            except ValueError:
                pass
            letter_content = (
                f"Date: {today}\n\n"
                f"To: Credit Accounts Settlement Division\n"
                f"Creditor: {creditor_name}\n\n"
                f"RE: Written Proposal for Accord and Satisfaction / Debt Settlement Offer\n"
                f"Account Reference: [Insert Account Number Here]\n\n"
                f"Dear Settlement Manager,\n\n"
                f"I am writing to offer a mutual settlement proposal regarding my outstanding balance of ₹{debt_balance:,.2f}. "
                f"I am currently reviewing my liabilities to resolve all accounts.\n\n"
                f"I am prepared to offer a one-time, lump-sum payment of ₹{proposed_val:,.2f} "
                f"(equal to {letter_req.settlement_percent or '50'}% of the total balance) as full and final payment in exchange for the following terms:\n"
                f"1. Your company agrees to accept this amount as full settlement of the account balance.\n"
                f"2. You agree to report the account status as 'Paid in Full' or 'Settled in Full', or completely delete the trade line from my credit bureau history.\n"
                f"3. You agree that no remaining balance will be sold, transferred, or assigned to any third-party debt buyer.\n\n"
                f"This offer is made in good faith to avoid legal conflicts or filing bankruptcy. If you accept these terms, please sign and return a written confirmation. "
                f"Upon receipt, I will release the payment immediately.\n\n"
                f"Sincerely,\n\n"
                f"{letter_req.user_name}\n"
                f"{letter_req.user_address}"
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid template type requested")

    # --- Save to negotiation history (AIHistory / ai_histories) ---
    settlement_pct_val = None
    if letter_req.template_type == 'settlement' and letter_req.settlement_percent:
        try:
            settlement_pct_val = float(letter_req.settlement_percent)
        except ValueError:
            pass

    history_entry = models.AIHistory(
        user_id=current_user.user_id,
        negotiation_strategy=letter_req.template_type,
        settlement_letter=letter_content,
        creditor_name=creditor_name,
        settlement_percent=settlement_pct_val,
        generated_at=datetime.datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()

    return {"content": letter_content}
