import sqlite3

db_path = 'finrelief.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check existing columns in debts table
cur.execute('PRAGMA table_info(debts)')
cols = [row[1] for row in cur.fetchall()]
print('Existing debts cols:', cols)

# Add missing columns
if 'emi' not in cols:
    cur.execute('ALTER TABLE debts ADD COLUMN emi REAL')
    print('Added: emi')
if 'overdue_months' not in cols:
    cur.execute('ALTER TABLE debts ADD COLUMN overdue_months INTEGER DEFAULT 0')
    print('Added: overdue_months')

conn.commit()
conn.close()
print('Migration complete.')
