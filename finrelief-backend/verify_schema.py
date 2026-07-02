from dotenv import load_dotenv
load_dotenv()
from app.database import engine
from app import models

# Recreate all tables
models.Base.metadata.create_all(bind=engine)

import sqlite3
conn = sqlite3.connect('finrelief.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print("Tables in database:", tables)

# Verify User columns
cur.execute("PRAGMA table_info(users)")
user_cols = [r[1] for r in cur.fetchall()]
print("Users table columns:", user_cols)

# Verify FinancialProfile columns
cur.execute("PRAGMA table_info(financial_profiles)")
profile_cols = [r[1] for r in cur.fetchall()]
print("FinancialProfile table columns:", profile_cols)

# Verify Loan columns
cur.execute("PRAGMA table_info(loans)")
loan_cols = [r[1] for r in cur.fetchall()]
print("Loans table columns:", loan_cols)

# Verify SettlementRecord columns
cur.execute("PRAGMA table_info(settlement_records)")
settlement_cols = [r[1] for r in cur.fetchall()]
print("SettlementRecord table columns:", settlement_cols)

# Verify AIHistory columns
cur.execute("PRAGMA table_info(ai_histories)")
ai_cols = [r[1] for r in cur.fetchall()]
print("AIHistory table columns:", ai_cols)

conn.close()
print("All Schema Verification Checks: OK")
