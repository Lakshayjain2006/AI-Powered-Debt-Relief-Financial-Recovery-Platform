import React, { useState } from 'react';
import { useFinancialData } from '../context/FinancialDataContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  IndianRupee, 
  Percent, 
  Calendar, 
  Tag, 
  User, 
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function DebtTrackerPage() {
  const {
    debts,
    monthlyIncome,
    monthlyExpenses,
    totalDebt,
    totalMinPayment,
    netMonthlySavings,
    addDebt,
    updateDebt,
    deleteDebt,
    setMonthlyIncome,
    setMonthlyExpenses
  } = useFinancialData();

  // Local Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState(null);
  
  const [creditor, setCreditor] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [category, setCategory] = useState('Credit Card');
  const [emi, setEmi] = useState('');
  const [overdueMonths, setOverdueMonths] = useState(0);
  const [loanAmount, setLoanAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [formError, setFormError] = useState('');

  // Income/Expense local overrides
  const [tempIncome, setTempIncome] = useState(monthlyIncome);
  const [tempExpenses, setTempExpenses] = useState(monthlyExpenses);

  const resetForm = () => {
    setCreditor('');
    setBalance('');
    setApr('');
    setMinPayment('');
    setCategory('Credit Card');
    setEmi('');
    setOverdueMonths(0);
    setLoanAmount('');
    setDueDate('');
    setFormError('');
    setEditingDebtId(null);
  };

  const handleOpenEdit = (debt) => {
    setEditingDebtId(debt.id);
    setCreditor(debt.creditor);
    setBalance(debt.balance);
    setApr(debt.apr);
    setMinPayment(debt.minPayment);
    setCategory(debt.category);
    setEmi(debt.emi || '');
    setOverdueMonths(debt.overdueMonths || 0);
    setLoanAmount(debt.loanAmount || '');
    setDueDate(debt.dueDate || '');
    setShowAddForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!creditor.trim()) {
      setFormError('Creditor name is required.');
      return;
    }
    const balNum = parseFloat(balance);
    const aprNum = parseFloat(apr);
    const minNum = parseFloat(minPayment);

    if (isNaN(balNum) || balNum <= 0) {
      setFormError('Balance must be a positive number.');
      return;
    }
    if (isNaN(aprNum) || aprNum < 0 || aprNum > 100) {
      setFormError('Interest APR must be between 0% and 100%.');
      return;
    }
    if (isNaN(minNum) || minNum <= 0) {
      setFormError('Minimum payment must be greater than ₹0.');
      return;
    }
    if (minNum > balNum) {
      setFormError('Minimum payment cannot exceed the total balance.');
      return;
    }

    const loanAmtNum = parseFloat(loanAmount);
    const payload = {
      creditor: creditor.trim(),
      balance: balNum,
      apr: aprNum,
      minPayment: minNum,
      category,
      emi: emi !== '' ? parseFloat(emi) : null,
      overdueMonths: parseInt(overdueMonths) || 0,
      loanAmount: !isNaN(loanAmtNum) ? loanAmtNum : balNum,
      dueDate: dueDate || null
    };

    if (editingDebtId) {
      updateDebt({ ...payload, id: editingDebtId });
    } else {
      addDebt(payload);
    }

    setShowAddForm(false);
    resetForm();
  };

  const handleIncomeBlur = () => {
    const val = parseFloat(tempIncome);
    if (!isNaN(val) && val >= 0) {
      setMonthlyIncome(val);
    } else {
      setTempIncome(monthlyIncome);
    }
  };

  const handleExpensesBlur = () => {
    const val = parseFloat(tempExpenses);
    if (!isNaN(val) && val >= 0) {
      setMonthlyExpenses(val);
    } else {
      setTempExpenses(monthlyExpenses);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">Debt & Asset Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your active creditor list, interest rates, and monthly budget parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Budget Configuration (Income/Expenses) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
            <h3 className="text-lg font-bold text-white font-display mb-4">Cashflow Parameters</h3>
            
            <div className="space-y-5">
              {/* Income */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 flex justify-between">
                  <span>Monthly After-Tax Income</span>
                  <span className="text-emerald-400 font-bold">₹{monthlyIncome.toLocaleString()}</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="number" 
                    value={tempIncome} 
                    onChange={(e) => setTempIncome(e.target.value)}
                    onBlur={handleIncomeBlur}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Expenses */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 flex justify-between">
                  <span>Living Expenses (Rent/Food/etc)</span>
                  <span className="text-indigo-400 font-bold">₹{monthlyExpenses.toLocaleString()}</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input 
                    type="number" 
                    value={tempExpenses} 
                    onChange={(e) => setTempExpenses(e.target.value)}
                    onBlur={handleExpensesBlur}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Sum of Minimum Debt Payments:</span>
                  <span className="font-semibold text-rose-400">₹{totalMinPayment}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Expenses + Debt Mins:</span>
                  <span className="font-semibold text-slate-300">₹{monthlyExpenses + totalMinPayment}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-dashed border-slate-850">
                  <span>Net Budget Surplus:</span>
                  <span className={`font-bold ${netMonthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    ₹{Math.round(netMonthlySavings).toLocaleString()}
                  </span>
                </div>

                {netMonthlySavings < 0 && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-300 leading-normal">
                      Deficit Warning: Your monthly living expenses and minimum debt payments exceed your income. Consider reducing expenses or checking out AI debt settlement strategies.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Creditors / Liabilities List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Liability Ledger</h3>
                <p className="text-xs text-slate-400">List of all active credit accounts, loans, and balances.</p>
              </div>
              
              {!showAddForm && (
                <button 
                  onClick={() => { setShowAddForm(true); resetForm(); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Debt
                </button>
              )}
            </div>

            {/* Add/Edit Debt Form */}
            {showAddForm && (
              <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-4 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <h4 className="text-sm font-bold text-indigo-400 font-display">
                    {editingDebtId ? 'Edit Creditor Account' : 'Add Creditor Account'}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => { setShowAddForm(false); resetForm(); }}
                    className="text-xs text-slate-500 hover:text-slate-400"
                  >
                    Cancel
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-rose-400">{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Creditor / Account Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={creditor} 
                        placeholder="e.g. HDFC Regalia Card"
                        onChange={(e) => setCreditor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Balance (₹)</label>
                      <input 
                        type="number" 
                        value={balance} 
                        placeholder="e.g. 150000"
                        onChange={(e) => setBalance(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Interest (APR %)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={apr} 
                        placeholder="e.g. 19.9"
                        onChange={(e) => setApr(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Minimum Monthly Payment (₹)</label>
                    <input 
                      type="number" 
                      value={minPayment} 
                      placeholder="e.g. 7500"
                      onChange={(e) => setMinPayment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Type</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Auto Loan">Auto Loan</option>
                      <option value="Student Loan">Student Loan</option>
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Mortgage">Mortgage</option>
                      <option value="Medical Bill">Medical Bill</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly EMI (₹) <span className="text-slate-600 normal-case font-normal">— for installment loans</span></label>
                    <input 
                      type="number" 
                      value={emi} 
                      placeholder="e.g. 12000 (leave blank if N/A)"
                      onChange={(e) => setEmi(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Months Overdue <span className="text-slate-600 normal-case font-normal">— 0 if current</span></label>
                    <input 
                      type="number" 
                      min="0"
                      max="60"
                      value={overdueMonths} 
                      placeholder="e.g. 2"
                      onChange={(e) => setOverdueMonths(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original Loan Amount (₹) <span className="text-slate-600 normal-case font-normal">— default: Balance</span></label>
                    <input 
                      type="number" 
                      value={loanAmount} 
                      placeholder="e.g. 200000"
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Due Date</label>
                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {editingDebtId ? 'Save Changes' : 'Add Account To Ledger'}
                </button>
              </form>
            )}

            {/* List Table */}
            {debts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4 text-left">Creditor</th>
                      <th className="py-3 px-4 text-center">Category</th>
                      <th className="py-3 px-4 text-right">Loan Amt</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                      <th className="py-3 px-4 text-right">APR</th>
                      <th className="py-3 px-4 text-right">Min Payment</th>
                      <th className="py-3 px-4 text-center">Due Date</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debts.map((debt) => (
                      <tr key={debt.id} className="border-b border-slate-850/60 hover:bg-slate-900/10 text-xs transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">{debt.creditor}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 text-[9px] font-semibold bg-slate-850 border border-slate-800 text-slate-300 rounded">
                            {debt.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-400">₹{(debt.loanAmount || debt.balance).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-100">₹{debt.balance.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-indigo-400 font-semibold">{debt.apr}%</td>
                        <td className="py-3.5 px-4 text-right text-slate-300">₹{debt.minPayment}</td>
                        <td className="py-3.5 px-4 text-center text-slate-400">{debt.dueDate || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => handleOpenEdit(debt)} 
                              className="p-1.5 rounded bg-slate-850 hover:bg-indigo-500/25 border border-slate-800 hover:border-indigo-500/30 text-indigo-400 transition-all cursor-pointer"
                              title="Edit Account"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => deleteDebt(debt.id)} 
                              className="p-1.5 rounded bg-slate-850 hover:bg-rose-500/25 border border-slate-800 hover:border-rose-500/30 text-rose-500 transition-all cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-850 rounded-2xl">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <h4 className="font-semibold text-slate-300 text-sm">No debts added yet</h4>
                <p className="text-slate-500 text-xs mt-1">Use the "Add Debt" button to populate your list.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
