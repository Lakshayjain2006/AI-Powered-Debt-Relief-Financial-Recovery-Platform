import React, { useState } from 'react';
import { FinancialDataProvider, useFinancialData } from './context/FinancialDataContext';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DebtTrackerPage from './pages/DebtTrackerPage';
import PayoffPlannerPage from './pages/PayoffPlannerPage';
import AiAdvisorPage from './pages/AiAdvisorPage';
import LetterGeneratorPage from './pages/LetterGeneratorPage';

// Icons
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingDown, 
  Sparkles, 
  FileText, 
  LogOut,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

function AppContent() {
  const { 
    onboardingCompleted, 
    totalDebt,
    clearAllData,
    isAuthenticated,
    authLoading,
    logout
  } = useFinancialData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If verifying token, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-r-indigo-500/20 border-b-indigo-500/20 border-l-indigo-500/20 animate-spin"></div>
          <span className="text-xs font-semibold text-slate-400">Securing your session...</span>
        </div>
      </div>
    );
  }

  // If onboarding hasn't been completed or user is not authenticated, display the LandingPage
  if (!isAuthenticated || !onboardingCompleted) {
    return <LandingPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'debts':
        return <DebtTrackerPage />;
      case 'planner':
        return <PayoffPlannerPage />;
      case 'advisor':
        return <AiAdvisorPage setActiveTab={setActiveTab} />;
      case 'letters':
        return <LetterGeneratorPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'debts', label: 'Debt Tracker', icon: <Wallet className="w-4 h-4" /> },
    { id: 'planner', label: 'Payoff Planner', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'advisor', label: 'AI Advisor', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'letters', label: 'Hardship Letters', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold font-display tracking-tight text-white">
              FinRelief
            </span>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-500 font-medium">Liabilities Balance:</span>
            <span className="font-extrabold text-rose-400">₹{totalDebt.toLocaleString()}</span>
          </div>
          <button
            onClick={clearAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Reset Data"
          >
            Reset Profile
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </header>

      {/* Main Grid: Sidebar + Active Screen */}
      <div className="flex-grow flex relative">
        {/* Navigation Sidebar (Desktop) */}
        <aside className="w-64 border-r border-slate-800/40 bg-slate-950/20 hidden md:block p-4 space-y-2 shrink-0 text-left">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-4">
            Navigation Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-indigo-600/10 border border-indigo-500/25 text-white'
                    : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Navigation Sidebar (Mobile Overlay) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-64 h-full bg-[#0b0f19] border-r border-slate-800 p-4 space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Navigation Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-indigo-600/10 border border-indigo-500/25 text-white'
                        : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="pt-4 border-t border-slate-850 space-y-2">
                <button
                  onClick={() => { clearAllData(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  Reset Profile
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-850 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Screen Content Wrapper */}
        <main className="flex-grow p-6 sm:p-8 max-w-7xl mx-auto overflow-x-hidden">
          {renderActivePage()}
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/40 bg-slate-950/20 text-center text-[10px] text-slate-600">
        © 2026 FinRelief, Inc. AI suggestions are simulated projections. Consult a licensed advisor for official bankruptcy or restructuring filings.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FinancialDataProvider>
      <AppContent />
    </FinancialDataProvider>
  );
}
