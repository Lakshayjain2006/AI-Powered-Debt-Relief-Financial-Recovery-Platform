import React, { useState } from 'react';
import { useFinancialData } from '../context/FinancialDataContext';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingDown, 
  Landmark, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  IndianRupee, 
  Wallet,
  Lock,
  User,
  AlertCircle
} from 'lucide-react';

export default function LandingPage() {
  const { 
    register,
    login,
    saveOnboardingProfile,
    isAuthenticated
  } = useFinancialData();

  // Navigation / Onboarding states
  const [step, setStep] = useState(1);
  const [authMode, setAuthMode] = useState('landing'); // 'landing', 'login', 'signup'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Onboarding parameters
  const [incomeInput, setIncomeInput] = useState(85000);
  const [expenseInput, setExpenseInput] = useState(42000);
  const [extraInput, setExtraInput] = useState(5000);
  const [initialDebts, setInitialDebts] = useState([
    { creditor: 'HDFC Regalia Credit Card', balance: 180000, apr: 36.0, minPayment: 9000, category: 'Credit Card' }
  ]);

  const handleAddInitialDebt = () => {
    setInitialDebts([
      ...initialDebts,
      { creditor: 'SBI Car Loan', balance: 450000, apr: 8.5, minPayment: 12000, category: 'Auto Loan' }
    ]);
  };

  const handleUpdateInitialDebt = (index, field, value) => {
    const updated = [...initialDebts];
    updated[index][field] = field === 'creditor' || field === 'category' ? value : parseFloat(value) || 0;
    setInitialDebts(updated);
  };

  const handleRemoveInitialDebt = (index) => {
    setInitialDebts(initialDebts.filter((_, i) => i !== index));
  };

  // Run registration/login
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError('Please fill in all credentials.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Onboarding submission to DB
  const handleCompleteOnboarding = async () => {
    await saveOnboardingProfile(incomeInput, expenseInput, extraInput, initialDebts);
  };

  // Auto demo setup
  const loadDefaultsAndGo = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const demoUsername = `demo_${Math.floor(100000 + Math.random() * 900000)}`;
      const demoPassword = 'DemoPassword123!';
      
      // Register demo user
      await register(demoUsername, demoPassword);
      
      // Auto-complete onboarding with baseline default arrays
      const defaultDebts = [
        { creditor: 'HDFC Regalia Credit Card', balance: 180000, apr: 36.0, minPayment: 9000, category: 'Credit Card' },
        { creditor: 'SBI Car Loan', balance: 450000, apr: 8.5, minPayment: 12000, category: 'Auto Loan' },
        { creditor: 'HDFC Credila Student Loan', balance: 850000, apr: 9.2, minPayment: 15000, category: 'Student Loan' }
      ];
      await saveOnboardingProfile(85000, 42000, 5000, defaultDebts);
    } catch (err) {
      setAuthError('Failed to spawn demo environment. Make sure server is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sub-render: Login/Signup cards
  const renderAuthForm = () => {
    return (
      <div className="glass-panel rounded-3xl p-8 glow-indigo border-slate-800/70 shadow-2xl relative w-full max-w-md mx-auto">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {authMode === 'login' ? 'Sign in to access your custom recovery portal.' : 'Sign up to build your secure financial ledger.'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-xs text-rose-400 text-left">{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rajesh_sharma"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {authLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-t-white border-r-white/20 border-b-white/20 border-l-white/20 animate-spin"></div>
              ) : (
                <>
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-850 flex justify-between text-xs text-slate-400">
            <span>
              {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError('');
              }}
              className="font-bold text-indigo-400 hover:text-indigo-300"
            >
              {authMode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
          
          <button 
            onClick={() => setAuthMode('landing')}
            className="text-center text-xs text-slate-500 hover:text-slate-400 block mx-auto"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Sub-render: Onboarding setup (Only shown if isAuthenticated is True but onboardingCompleted is False)
  const renderOnboardingForm = () => {
    return (
      <div className="glass-panel rounded-3xl p-8 glow-indigo border-slate-800/70 shadow-2xl relative w-full max-w-lg mx-auto">
        <div className="absolute top-4 right-8 text-xs font-semibold text-slate-500">
          Step {step} of 3
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-white">Let's build your profile</h2>
              <p className="text-xs text-slate-400">Enter your basic financial numbers to bootstrap your analysis dashboard.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-slate-400 flex justify-between">
                  <span>Monthly After-Tax Income</span>
                  <span className="text-emerald-400 font-bold">₹{incomeInput.toLocaleString()}</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type="number" 
                    value={incomeInput} 
                    onChange={(e) => setIncomeInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white font-medium focus:outline-none focus:border-indigo-500/80 transition-colors"
                  />
                </div>
                <input 
                  type="range" 
                  min="15000" 
                  max="300000" 
                  step="5000" 
                  value={incomeInput} 
                  onChange={(e) => setIncomeInput(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-slate-400 flex justify-between">
                  <span>Monthly Fixed Living Expenses</span>
                  <span className="text-indigo-400 font-bold">₹{expenseInput.toLocaleString()}</span>
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type="number" 
                    value={expenseInput} 
                    onChange={(e) => setExpenseInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white font-medium focus:outline-none focus:border-indigo-500/80 transition-colors"
                  />
                </div>
                <input 
                  type="range" 
                  min="5000" 
                  max="200000" 
                  step="2000" 
                  value={expenseInput} 
                  onChange={(e) => setExpenseInput(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <button 
              onClick={() => setStep(2)} 
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all cursor-pointer"
            >
              Continue Onboarding
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-white">Add your primary debt</h2>
              <p className="text-xs text-slate-400">Add at least one debt. You can add more inside the dashboard anytime.</p>
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-4 pr-1">
              {initialDebts.map((debt, index) => (
                <div key={index} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 relative">
                  {initialDebts.length > 1 && (
                    <button 
                      onClick={() => handleRemoveInitialDebt(index)} 
                      className="absolute top-2 right-2 text-xs font-bold text-rose-500/70 hover:text-rose-400"
                    >
                      Remove
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Creditor Name</label>
                      <input 
                        type="text" 
                        value={debt.creditor} 
                        placeholder="e.g. HDFC Regalia"
                        onChange={(e) => handleUpdateInitialDebt(index, 'creditor', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Balance (₹)</label>
                      <input 
                        type="number" 
                        value={debt.balance} 
                        onChange={(e) => handleUpdateInitialDebt(index, 'balance', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Interest (APR %)</label>
                      <input 
                        type="number" 
                        value={debt.apr} 
                        step="0.1"
                        onChange={(e) => handleUpdateInitialDebt(index, 'apr', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Min Payment (₹)</label>
                      <input 
                        type="number" 
                        value={debt.minPayment} 
                        onChange={(e) => handleUpdateInitialDebt(index, 'minPayment', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Category</label>
                      <select 
                        value={debt.category} 
                        onChange={(e) => handleUpdateInitialDebt(index, 'category', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Credit Card">Card</option>
                        <option value="Auto Loan">Auto</option>
                        <option value="Student Loan">Student</option>
                        <option value="Personal Loan">Personal</option>
                        <option value="Mortgage">Mortgage</option>
                        <option value="Medical Bill">Medical</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleAddInitialDebt} 
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700/60 transition-all cursor-pointer"
              >
                + Add Another Debt
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={initialDebts.length === 0}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setStep(1)} 
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-400"
            >
              Go Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-white">Extra payoff power</h2>
              <p className="text-xs text-slate-400">Allocate any extra monthly cash to speed up the debt reduction schedule.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold text-slate-400 flex justify-between">
                  <span>Extra Monthly Payment Buffer</span>
                  <span className="text-emerald-400 font-bold">₹{extraInput.toLocaleString()}</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type="number" 
                    value={extraInput} 
                    onChange={(e) => setExtraInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white font-medium focus:outline-none focus:border-indigo-500/80 transition-colors"
                  />
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50000" 
                  step="1000" 
                  value={extraInput} 
                  onChange={(e) => setExtraInput(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/10 flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-normal">
                  Every dollar added as an extra payment directly goes to targeting your debts, compounding interest savings.
                </p>
              </div>
            </div>

            <button 
              onClick={handleCompleteOnboarding} 
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all cursor-pointer"
            >
              Build My Custom Strategy
              <ArrowRight className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setStep(2)} 
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-400"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col relative overflow-hidden font-sans pb-12">
      {/* Background blobs for premium glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-slate-900/20 rounded-full blur-[180px] pointer-events-none"></div>
 
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 w-full flex-grow flex flex-col items-center">
        {/* Header / Brand */}
        <header className="w-full py-8 flex justify-between items-center border-b border-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-white">
              FinRelief
            </span>
          </div>
          {authMode === 'landing' && (
            <button 
              onClick={loadDefaultsAndGo} 
              disabled={authLoading}
              className="text-xs font-semibold px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-blue-400 rounded-lg border border-slate-700/50 hover:border-blue-500/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {authLoading ? 'Launching Sandbox...' : 'Launch Demo Dashboard (Skip Onboarding)'}
            </button>
          )}
        </header>

        {/* Dynamic Display based on Auth and Onboarding */}
        {isAuthenticated ? (
          <div className="w-full mt-12 max-w-4xl text-center">
            {renderOnboardingForm()}
          </div>
        ) : authMode !== 'landing' ? (
          <div className="w-full mt-16 max-w-4xl text-center">
            {renderAuthForm()}
          </div>
        ) : (
          /* Hero & Features Split */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full mt-12 lg:mt-20 items-center">
            {/* Left Column: Copywriting */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/40 border border-blue-900/40">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Secure Debt Recovery Platform</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.1] text-white">
                Optimize your debt. <br />
                <span className="text-blue-400">
                  Accelerate your recovery.
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                Ditch generic spreadsheets. FinRelief analyzes your debt-to-income profile to build an optimized payoff engine, drafts hardship letters to lower interest rates, and provides an intelligent simulated advisor.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-5 rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 transition-all shadow-md">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm">Repayment Optimizer</h3>
                  <p className="text-[11px] text-slate-400">Compare Snowball vs Avalanche payoff strategies dynamically.</p>
                </div>
   
                <div className="p-5 rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 transition-all shadow-md">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm">AI Financial Advisor</h3>
                  <p className="text-[11px] text-slate-400">Get context-aware advice customized for your liabilities.</p>
                </div>
   
                <div className="p-5 rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 transition-all shadow-md">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Landmark className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm">Hardship Letters</h3>
                  <p className="text-[11px] text-slate-400">Auto-generate settlement & validation templates instantly.</p>
                </div>
              </div>
            </div>

            {/* Right Column: CTA card */}
            <div className="lg:col-span-5 w-full">
              <div className="glass-panel rounded-3xl p-8 glow-indigo border-slate-800/70 shadow-2xl relative space-y-6 text-center">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white font-display">Get Started Today</h3>
                  <p className="text-xs text-slate-400">Join other users actively taking control of their credit. Create a secure account to track calculations across devices.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    Create Free Account
                  </button>
                  <button 
                    onClick={() => setAuthMode('login')}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700/60 transition-all cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Value Prop Banner */}
        <section className="w-full mt-24 border-t border-slate-800/40 pt-16">
          <h2 className="text-2xl font-bold font-display text-center text-white mb-12">
            Why financial professionals recommend dynamic strategy mapping
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/40 text-left">
              <div className="text-lg font-bold text-white mb-2 font-display">1. Optimized Cash Allocation</div>
              <p className="text-xs text-slate-400 leading-normal">
                Applying even ₹5,000 extra payment directly using the Debt Avalanche strategy saves thousands by attacking compounding interest rates.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/40 text-left">
              <div className="text-lg font-bold text-white mb-2 font-display">2. Visual Progress Accountability</div>
              <p className="text-xs text-slate-400 leading-normal">
                Seeing a precise remaining balance curve chart creates massive psychology incentives to stay on track.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/40 text-left">
              <div className="text-lg font-bold text-white mb-2 font-display">3. Actionable Negotiation</div>
              <p className="text-xs text-slate-400 leading-normal">
                Equipping yourself with legal hardship templates gives you the exact wording that creditors actually accept.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
