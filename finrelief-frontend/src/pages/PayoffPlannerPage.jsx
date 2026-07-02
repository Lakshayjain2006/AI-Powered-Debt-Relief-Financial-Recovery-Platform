import React, { useMemo } from 'react';
import { useFinancialData } from '../context/FinancialDataContext';
import { 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  Zap, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function PayoffPlannerPage() {
  const {
    strategy,
    extraPayment,
    setStrategy,
    setExtraPayment,
    simulatePayoff,
    netMonthlySavings,
    totalMinPayment
  } = useFinancialData();

  // Run simulation based on current configuration
  const simulation = useMemo(() => simulatePayoff(strategy, extraPayment), [strategy, extraPayment, simulatePayoff]);
  
  // Baseline simulation (no extra payment)
  const baseline = useMemo(() => simulatePayoff(strategy, 0), [strategy, simulatePayoff]);

  // Alternative strategy simulation to compare
  const alternateStrategy = strategy === 'avalanche' ? 'snowball' : 'avalanche';
  const alternateSimulation = useMemo(() => simulatePayoff(alternateStrategy, extraPayment), [alternateStrategy, extraPayment, simulatePayoff]);

  const interestSaved = Math.max(0, baseline.totalInterest - simulation.totalInterest);
  
  const timeSpedUp = typeof baseline.months === 'number' && typeof simulation.months === 'number'
    ? Math.max(0, baseline.months - simulation.months)
    : 0;

  // Max slider value based on cashflow surplus
  const maxSliderValue = Math.max(1000, Math.round(netMonthlySavings + extraPayment + 500));

  const formatCurrency = (val) => `₹${Math.round(val).toLocaleString()}`;

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">Debt Repayment Planner</h1>
        <p className="text-slate-400 text-sm mt-1">Simulate strategies and customize extra monthly payments to accelerate your path to debt-free.</p>
      </div>

      {/* Strategy Toggle & Extra Payment Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Planner Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800/80 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white font-display">Repayment Accelerator</h3>
              <p className="text-xs text-slate-400 mt-0.5">Toggle strategy and configure your extra payoff power.</p>
            </div>

            {/* Strategy Selectors */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Repayment Philosophy</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStrategy('avalanche')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    strategy === 'avalanche'
                      ? 'bg-indigo-600/10 border-indigo-500 text-white'
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    Avalanche
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    Prioritizes accounts with the <strong>highest interest rates</strong>. Mathematically saves the most interest.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStrategy('snowball')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    strategy === 'snowball'
                      ? 'bg-indigo-600/10 border-indigo-500 text-white'
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Snowball
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    Prioritizes accounts with the <strong>lowest balances</strong>. Delivers quick emotional victories.
                  </p>
                </button>
              </div>
            </div>

            {/* Extra Monthly Payment Slider */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-400">Extra Monthly Payment</span>
                <span className="font-black text-emerald-400 text-lg">₹{extraPayment.toLocaleString()}</span>
              </div>

              <input 
                type="range"
                min="0"
                max={maxSliderValue}
                step="50"
                value={extraPayment}
                onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase">
                <span>Min Payment Baseline</span>
                <span>Max Surplus Cushion (${maxSliderValue})</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-900 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Current Minimums Required:</span>
                  <span className="font-bold text-slate-300">₹{totalMinPayment}/mo</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Allocated Monthly:</span>
                  <span className="font-bold text-emerald-400">₹{totalMinPayment + extraPayment}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Repayment Projections Metrics */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Time to Debt-Free
              </span>
              <div className="text-3xl font-black font-display text-white mt-2">
                {simulation.months} <span className="text-xs font-normal text-slate-400">Mo</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Baseline: {baseline.months} Months
              </p>
            </div>

            {/* Interest */}
            <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-rose-400" /> Total Interest Paid
              </span>
              <div className="text-3xl font-black font-display text-white mt-2">
                ₹{simulation.totalInterest.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Baseline: ₹{baseline.totalInterest.toLocaleString()}
              </p>
            </div>

            {/* Savings */}
            <div className="glass-panel p-5 rounded-2xl border-slate-800/80 glow-emerald">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Interest Saved
              </span>
              <div className="text-3xl font-black font-display text-emerald-400 mt-2">
                ₹{interestSaved.toLocaleString()}
              </div>
              <p className="text-[10px] text-emerald-500/80 mt-2 font-medium">
                {timeSpedUp > 0 ? `Sped up by ${timeSpedUp} months!` : 'No extra payment active'}
              </p>
            </div>
          </div>

          {/* Strategy Comparison Alert */}
          {simulation.months !== alternateSimulation.months && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/10 flex items-center justify-between text-xs gap-3">
              <p className="text-slate-400 leading-normal">
                Comparison Tip: Switching to the <strong>{alternateStrategy}</strong> strategy would make you debt-free in <strong>{alternateSimulation.months} months</strong> and cost <strong>₹{alternateSimulation.totalInterest.toLocaleString()}</strong> in interest.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Balance Chart */}
      {simulation.timeline && simulation.timeline.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border-slate-800/80 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white font-display">Payoff Projection Curve</h3>
            <p className="text-xs text-slate-400 mt-0.5">Projected balance reductions over the lifetime of your active strategy.</p>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={simulation.timeline}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} tickFormatter={formatCurrency} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131a26', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  formatter={(value) => [formatCurrency(value), 'Remaining Balance']}
                  labelFormatter={(label) => `Month ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="remainingBalance" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payoff Milestones Table */}
      {simulation.timeline && simulation.timeline.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border-slate-800/80">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white font-display">Month-by-Month Schedule</h3>
            <p className="text-xs text-slate-400">Detailed snapshot of balances during the repayment simulation.</p>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-4 text-left">Month</th>
                  <th className="py-2.5 px-4 text-right">Interest Paid</th>
                  <th className="py-2.5 px-4 text-right">Remaining Debt Balance</th>
                </tr>
              </thead>
              <tbody>
                {simulation.timeline.map((stepVal) => (
                  <tr key={stepVal.month} className="border-b border-slate-850/60 hover:bg-slate-900/10 text-xs transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {stepVal.month === 0 ? 'Initial State' : `Month ${stepVal.month}`}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-400 font-semibold">
                      {stepVal.month === 0 ? '-' : `₹${stepVal.interestPaidThisMonth}`}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      ₹{stepVal.remainingBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
