import React, { useState } from 'react';
import { useFinancialData } from '../context/FinancialDataContext';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DashboardPage({ setActiveTab }) {
  const {
    debts,
    monthlyIncome,
    monthlyExpenses,
    extraPayment,
    strategy,
    totalDebt,
    totalMinPayment,
    debtToIncomeRatio,
    netMonthlySavings,
    recoveryScore,
    simulatePayoff,
    runSettlementAnalysis,
    negotiationHistory,
    settlementHistory
  } = useFinancialData();

  // Scenario 1 — Settlement Analysis state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettlementHistory, setShowSettlementHistory] = useState(false);

  // Run payoff simulations
  const { months: currentPayoffMonths, totalInterest: currentTotalInterest } = simulatePayoff(strategy, extraPayment);
  const { months: baselineMonths, totalInterest: baselineTotalInterest } = simulatePayoff(strategy, 0);

  const interestSaved = Math.max(0, baselineTotalInterest - currentTotalInterest);
  const monthsSpedUp = typeof baselineMonths === 'number' && typeof currentPayoffMonths === 'number'
    ? Math.max(0, baselineMonths - currentPayoffMonths)
    : 0;

  // EMI Ratio — effective EMI as % of income (using min_payment as EMI proxy)
  const emiRatio = monthlyIncome > 0 ? ((totalMinPayment / monthlyIncome) * 100).toFixed(1) : '0.0';

  // Avg settlement % from history
  const settlementEntries = negotiationHistory.filter(h => h.template_type === 'settlement' && h.settlement_percent);
  const avgSettlementPct = settlementEntries.length > 0
    ? (settlementEntries.reduce((s, h) => s + h.settlement_percent, 0) / settlementEntries.length).toFixed(0)
    : null;

  const chartData = debts.map((d) => ({ name: d.creditor, value: d.balance }));
  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#84cc16'];

  // DTI Status
  const getDtiStatus = (dti) => {
    const val = parseFloat(dti);
    if (val === 0) return { label: 'Optimal', color: 'text-emerald-400 bg-emerald-500/10' };
    if (val < 15) return { label: 'Healthy', color: 'text-emerald-400 bg-emerald-500/10' };
    if (val <= 36) return { label: 'Manageable', color: 'text-amber-400 bg-amber-500/10' };
    if (val <= 50) return { label: 'High Risk', color: 'text-orange-400 bg-orange-500/10' };
    return { label: 'Critical Alert', color: 'text-rose-400 bg-rose-500/10' };
  };
  const dtiStatus = getDtiStatus(debtToIncomeRatio);

  // Recovery Score Status
  const getScoreStatus = (score) => {
    if (score >= 80) return { label: 'Strong Recovery', color: 'text-emerald-400' };
    if (score >= 60) return { label: 'Steady Progress', color: 'text-indigo-400' };
    if (score >= 40) return { label: 'Vulnerable', color: 'text-amber-400' };
    return { label: 'Critical Distress', color: 'text-rose-400' };
  };
  const scoreStatus = getScoreStatus(recoveryScore);

  // Stress level styling
  const getStressStyle = (level) => {
    if (!level) return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-700' };
    const l = level.toLowerCase();
    if (l === 'low')      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (l === 'medium')   return { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' };
    if (l === 'high')     return { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' };
    return                       { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30' };
  };

  // EMI Ratio Status
  const getEmiStatus = (ratio) => {
    const v = parseFloat(ratio);
    if (v <= 20) return { label: 'Good', color: 'text-emerald-400 bg-emerald-500/10' };
    if (v <= 35) return { label: 'Moderate', color: 'text-amber-400 bg-amber-500/10' };
    if (v <= 50) return { label: 'Stressed', color: 'text-orange-400 bg-orange-500/10' };
    return { label: 'Critical', color: 'text-rose-400 bg-rose-500/10' };
  };
  const emiStatus = getEmiStatus(emiRatio);

  // Template label map
  const templateLabel = { hardship: 'Hardship Relief', validation: 'Debt Validation', settlement: 'Settlement Offer' };

  // Handle AI Analysis
  const handleRunAnalysis = async () => {
    if (debts.length === 0) return;
    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysisResult(null);
    const result = await runSettlementAnalysis(null);
    if (result) {
      setAnalysisResult(result);
    } else {
      setAnalysisError('Analysis failed. Please check your backend server is running.');
    }
    setAnalysisLoading(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">Financial Recovery Control Center</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time analysis of your debts, repayment velocity, and AI-powered recovery insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Active Strategy: <strong className="text-indigo-400 capitalize">{strategy}</strong>
          </span>
          <button
            onClick={() => setActiveTab('advisor')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Consult AI Advisor
          </button>
        </div>
      </div>

      {/* KPI Grid — 5 cards including EMI Ratio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Debt */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80 hover:border-slate-700/60 transition-all relative overflow-hidden group shadow-lg lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Liabilities</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black font-display text-white">₹{totalDebt.toLocaleString()}</h2>
          <p className="text-[11px] text-slate-400 mt-1">Across <strong className="text-slate-200">{debts.length} creditors</strong></p>
        </div>

        {/* DTI Ratio */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80 hover:border-slate-700/60 transition-all relative overflow-hidden group shadow-lg lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">DTI Ratio</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black font-display text-white">{debtToIncomeRatio}%</h2>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${dtiStatus.color}`}>
              {dtiStatus.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Min: <strong className="text-slate-200">₹{totalMinPayment}/mo</strong></p>
        </div>

        {/* EMI Ratio — NEW Scenario 3 KPI */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80 hover:border-slate-700/60 transition-all relative overflow-hidden group shadow-lg lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-bl-full pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">EMI Ratio</span>
            <BarChart3 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black font-display text-white">{emiRatio}%</h2>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${emiStatus.color}`}>
              {emiStatus.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Of monthly income</p>
        </div>

        {/* Monthly Surplus */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80 hover:border-slate-700/60 transition-all relative overflow-hidden group shadow-lg lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Monthly Surplus</span>
            {netMonthlySavings >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
          </div>
          <h2 className={`text-2xl font-black font-display ${netMonthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netMonthlySavings >= 0 ? `₹${Math.round(netMonthlySavings).toLocaleString()}` : `-₹${Math.abs(Math.round(netMonthlySavings)).toLocaleString()}`}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">After all expenses & minimums</p>
        </div>

        {/* Recovery Score */}
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80 hover:border-slate-700/60 transition-all relative overflow-hidden group shadow-lg lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Recovery Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black font-display text-white">{recoveryScore} <span className="text-slate-600 text-xs font-normal">/100</span></h2>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${scoreStatus.color}`}>{scoreStatus.label}</span>
          </div>
          <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-gradient-to-r from-violet-500 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${recoveryScore}%` }} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Debt Breakdown Chart */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border-slate-800/80 flex flex-col justify-between min-h-[340px]">
          <div>
            <h3 className="text-base font-bold text-white font-display">Liability Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Creditor balance allocation.</p>
          </div>
          <div className="flex-grow flex items-center justify-center py-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#131a26', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Balance']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs py-12 text-center">No data. Add debts to view chart.</div>
            )}
          </div>
        </div>

        {/* Repayment Outlook */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-slate-800/80 flex flex-col justify-between min-h-[340px]">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-display">Repayment Outlook</h3>
            <p className="text-xs text-slate-400">Projected timelines comparing baseline vs. extra payoff power.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Time to Debt-Free
              </span>
              <div className="text-2xl font-bold font-display text-white mt-1.5">
                {currentPayoffMonths} <span className="text-xs font-normal text-slate-400">Months</span>
              </div>
              {monthsSpedUp > 0 && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Sped up by {monthsSpedUp} mo
                </span>
              )}
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> Projected Interest
              </span>
              <div className="text-2xl font-bold font-display text-white mt-1.5">
                ₹{currentTotalInterest.toLocaleString()}
              </div>
              {interestSaved > 0 && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                  Saved ₹{interestSaved.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Repayment strategy efficiency</span>
                <span className="font-semibold text-indigo-400">
                  {interestSaved > 0 ? `Saved ${Math.round((interestSaved / (baselineTotalInterest || 1)) * 100)}% interest` : 'Baseline Efficiency'}
                </span>
              </div>
              <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-indigo-500 h-full transition-all" style={{ width: `${baselineTotalInterest > 0 ? (currentTotalInterest / baselineTotalInterest) * 100 : 100}%` }} />
                <div className="bg-emerald-400 h-full transition-all" style={{ width: `${baselineTotalInterest > 0 ? (interestSaved / baselineTotalInterest) * 100 : 0}%` }} />
              </div>
              <div className="flex gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500 inline-block" /> Interest Accrued</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400 inline-block" /> Interest Saved</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('planner')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700/60 transition-all cursor-pointer"
            >
              Analyze Repayment Timelines <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          Scenario 1 — AI Settlement Analysis Panel
      ============================================================ */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              AI Settlement Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Get AI-powered settlement recommendations, debt stress level, and financial health insights for your full profile.
            </p>
          </div>
          <button
            id="run-ai-analysis-btn"
            onClick={handleRunAnalysis}
            disabled={analysisLoading || debts.length === 0}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {analysisLoading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
              : <><Sparkles className="w-3.5 h-3.5" /> Run AI Analysis</>
            }
          </button>
        </div>

        {debts.length === 0 && (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-500 text-center">
            Add at least one debt in the <button onClick={() => setActiveTab('debts')} className="text-indigo-400 underline cursor-pointer">Debt Tracker</button> to run settlement analysis.
          </div>
        )}

        {analysisError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">{analysisError}</div>
        )}

        {analysisLoading && (
          <div className="flex items-center justify-center gap-3 py-8 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>AI is analyzing your financial profile...</span>
          </div>
        )}

        {analysisResult && !analysisLoading && (() => {
          const stressStyle = getStressStyle(analysisResult.debt_stress_level);
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Stress Level */}
              <div className={`p-5 rounded-2xl border ${stressStyle.border} ${stressStyle.bg} flex flex-col gap-3`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Debt Stress Level</span>
                <div className="flex items-center gap-3">
                  <div className={`text-4xl font-black font-display ${stressStyle.color}`}>
                    {analysisResult.debt_stress_level}
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${analysisResult.debt_stress_level === 'Low' ? 'bg-emerald-500' : analysisResult.debt_stress_level === 'Medium' ? 'bg-amber-500' : analysisResult.debt_stress_level === 'High' ? 'bg-orange-500' : 'bg-rose-500'}`}
                    style={{ width: `${analysisResult.debt_stress_score}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">Stress Score: <strong className={stressStyle.color}>{analysisResult.debt_stress_score}/100</strong></span>
                {analysisResult.ai_powered && (
                  <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini AI Powered
                  </span>
                )}
              </div>

              {/* Settlement Recommendation */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Settlement Recommendation</span>
                <div className="text-4xl font-black font-display text-white">
                  {analysisResult.settlement_recommendation_pct.toFixed(0)}<span className="text-slate-500 text-xl">%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Propose settling at <strong className="text-white">{analysisResult.settlement_recommendation_pct.toFixed(0)}%</strong> of outstanding balance —
                  a lump sum of <strong className="text-emerald-400">₹{Math.round(totalDebt * analysisResult.settlement_recommendation_pct / 100).toLocaleString()}</strong>.
                </p>
                <button
                  onClick={() => setActiveTab('letters')}
                  className="mt-auto flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Generate Settlement Letter <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Financial Health Insights */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Financial Health Insights</span>
                <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line flex-grow">
                  {analysisResult.financial_health_insights}
                </p>
                <div className="pt-2 border-t border-slate-850">
                  <p className="text-[10px] font-bold text-indigo-300">💡 Recommended Action</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{analysisResult.recommended_action}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ============================================================
          Saved Settlement Records Panel
      ============================================================ */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
        <button
          id="toggle-settlement-history"
          className="w-full flex items-center justify-between cursor-pointer"
          onClick={() => setShowSettlementHistory(h => !h)}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white font-display">Saved Settlement Evaluations</h3>
            {settlementHistory.length > 0 && (
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                {settlementHistory.length} records
              </span>
            )}
          </div>
          {showSettlementHistory ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showSettlementHistory && (
          <div className="mt-5">
            {settlementHistory.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-850 rounded-2xl">
                <Activity className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-semibold">No settlement records evaluated yet.</p>
                <button
                  onClick={handleRunAnalysis}
                  className="mt-3 text-xs text-indigo-400 font-bold underline cursor-pointer"
                >
                  Run your first analysis now →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-3 text-left">Date</th>
                      <th className="py-3 px-3 text-left">Evaluation Type</th>
                      <th className="py-3 px-3 text-left">Stress Level</th>
                      <th className="py-3 px-3 text-right">Recommended Payoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementHistory.map((entry) => (
                      <tr key={entry.settlement_id} className="border-b border-slate-850/50 hover:bg-slate-900/10 transition-colors">
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{entry.settlement_prediction}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${
                            entry.priority_level === 'Critical' ? 'bg-rose-500/15 text-rose-400' :
                            entry.priority_level === 'High'     ? 'bg-orange-500/15 text-orange-400' :
                            entry.priority_level === 'Medium'   ? 'bg-amber-500/15 text-amber-400' :
                                                                  'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {entry.priority_level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          ₹{entry.recommended_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          Scenario 3 — Negotiation History Panel
      ============================================================ */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
        <button
          id="toggle-negotiation-history"
          className="w-full flex items-center justify-between cursor-pointer"
          onClick={() => setShowHistory(h => !h)}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white font-display">AI Negotiation History</h3>
            {negotiationHistory.length > 0 && (
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                {negotiationHistory.length} letters
              </span>
            )}
          </div>
          {showHistory ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showHistory && (
          <div className="mt-5">
            {negotiationHistory.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-850 rounded-2xl">
                <FileText className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-semibold">No negotiation letters generated yet.</p>
                <button
                  onClick={() => setActiveTab('letters')}
                  className="mt-3 text-xs text-indigo-400 font-bold underline cursor-pointer"
                >
                  Generate your first letter →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-3 text-left">Date</th>
                      <th className="py-3 px-3 text-left">Creditor</th>
                      <th className="py-3 px-3 text-left">Template</th>
                      <th className="py-3 px-3 text-right">Settlement %</th>
                      <th className="py-3 px-3 text-left">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negotiationHistory.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-850/50 hover:bg-slate-900/10 transition-colors">
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{entry.creditor_name}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${
                            entry.template_type === 'settlement' ? 'bg-indigo-500/15 text-indigo-400' :
                            entry.template_type === 'hardship'   ? 'bg-amber-500/15 text-amber-400' :
                                                                   'bg-slate-700/50 text-slate-300'
                          }`}>
                            {templateLabel[entry.template_type] || entry.template_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold">
                          {entry.settlement_percent != null
                            ? <span className="text-emerald-400">{entry.settlement_percent}%</span>
                            : <span className="text-slate-600">—</span>
                          }
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[10px] max-w-[200px] truncate" title={entry.letter_preview}>
                          {entry.letter_preview ? entry.letter_preview.slice(0, 60) + '…' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Avg settlement % summary */}
                {avgSettlementPct && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Average Settlement % Proposed</span>
                    <span className="text-sm font-extrabold text-emerald-400">{avgSettlementPct}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
