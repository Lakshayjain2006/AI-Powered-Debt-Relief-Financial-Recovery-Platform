import React, { useState, useMemo, useEffect } from 'react';
import { useFinancialData } from '../context/FinancialDataContext';
import { 
  FileText, 
  Copy, 
  Check, 
  HelpCircle, 
  User, 
  Home, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function LetterGeneratorPage() {
  const { debts, generateLetter, negotiationHistory } = useFinancialData();

  // State
  const [selectedTemplate, setSelectedTemplate] = useState('hardship');
  // Auto-select highest APR debt by default (Scenario 2 guidance)
  const highestAprDebt = debts.length > 0 ? debts.reduce((a, b) => a.apr > b.apr ? a : b) : null;
  const [selectedDebtId, setSelectedDebtId] = useState(highestAprDebt?.id || '');
  const [userName, setUserName] = useState('Rajesh Sharma');
  const [userAddress, setUserAddress] = useState('Flat 402, Shanti Towers, Sector 56, Gurgaon, Haryana 122011');
  const [proposedPayment, setProposedPayment] = useState('5000');
  const [settlementPercent, setSettlementPercent] = useState('50');
  const [isCopied, setIsCopied] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  // AI Generation States
  const [letterContent, setLetterContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usingAi, setUsingAi] = useState(false);

  // Sync selected debt if debts list changes — keep highest APR selected
  useEffect(() => {
    if (debts.length > 0 && !selectedDebtId) {
      const highApr = debts.reduce((a, b) => a.apr > b.apr ? a : b);
      setSelectedDebtId(highApr.id);
    }
  }, [debts, selectedDebtId]);

  // Get selected creditor details
  const selectedDebt = useMemo(() => {
    return debts.find(d => d.id === selectedDebtId) || debts[0] || { creditor: '[Creditor Name]', balance: 0 };
  }, [debts, selectedDebtId]);

  // Computes static fallback letter (same as legacy frontend template)
  const legacyLetter = useMemo(() => {
    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const creditorName = selectedDebt.creditor;
    const balanceVal = selectedDebt.balance.toLocaleString();

    switch (selectedTemplate) {
      case 'hardship':
        return `Date: ${today}\n\nTo: Hardship & Assistance Department\nCreditor: ${creditorName}\n\nRE: Request for Interest Rate Reduction & Hardship Assistance\nAccount Reference: [Insert Account Number Here]\n\nDear Assistance Officer,\n\nI am writing this letter to request temporary financial hardship relief regarding my outstanding balance of ₹${balanceVal}. Recently, I have experienced a severe financial constraint due to unforeseen cost changes, which has impacted my cash flow.\n\nI am fully committed to fulfilling my obligations and want to avoid default. However, with my current interest rate, my minimum payments are no longer sustainable. I am requesting that you consider:\n1. Temporarily reducing my interest rate (APR) for the next 12 months.\n2. Setting a fixed hardship payment plan of ₹${proposedPayment} per month.\n\nI have attached a copy of my current basic cashflow and would appreciate your department contacting me at [Insert Phone Number Here] or via my email [Insert Email Here] to confirm if we can arrange this agreement.\n\nThank you very much for your time and understanding.\n\nSincerely,\n\n${userName}\n${userAddress}`;

      case 'validation':
        return `Date: ${today}\n\nTo: Billing Disputes & Collection Department\nAgency: ${creditorName}\n\nRE: Formal Debt Validation Request\nAccount Reference: [Insert Reference / Account Number Here]\n\nTo Whom It May Concern,\n\nI am writing this letter in response to recent contact regarding an alleged debt of ₹${balanceVal}. I am formally requesting validation of this debt.\n\nPlease provide me with the following documentation:\n1. Proof that your agency has the legal authority to collect debts in my home state.\n2. A copy of the original contract signed by myself and the original creditor.\n3. A complete ledger history of the debt, accounting for all payments made, interest accrued, and fees assessed.\n4. Verification that the statute of limitations for collecting this debt has not expired.\n\nPlease note that if you fail to provide this validation within 30 days, you must cease all collection activities and delete any negative trade lines reported to the credit bureaus immediately.\n\nSincerely,\n\n${userName}\n${userAddress}`;

      case 'settlement':
        const proposedSettlementVal = Math.round(selectedDebt.balance * (parseFloat(settlementPercent) / 100)).toLocaleString();
        return `Date: ${today}\n\nTo: Credit Accounts Settlement Division\nCreditor: ${creditorName}\n\nRE: Written Proposal for Accord and Satisfaction / Debt Settlement Offer\nAccount Reference: [Insert Account Number Here]\n\nDear Settlement Manager,\n\nI am writing to offer a mutual settlement proposal regarding my outstanding balance of ₹${balanceVal}. I am currently reviewing my liabilities to resolve all accounts.\n\nI am prepared to offer a one-time, lump-sum payment of ₹${proposedSettlementVal} (equal to ${settlementPercent}% of the total balance) as full and final payment in exchange for the following terms:\n1. Your company agrees to accept this amount as full settlement of the account balance.\n2. You agree to report the account status as "Paid in Full" or "Settled in Full", or completely delete the trade line from my credit bureau history.\n3. You agree that no remaining balance will be sold, transferred, or assigned to any third-party debt buyer.\n\nThis offer is made in good faith to avoid legal conflicts or filing bankruptcy. If you accept these terms, please sign and return a written confirmation. Upon receipt, I will release the payment immediately.\n\nSincerely,\n\n${userName}\n${userAddress}`;

      default:
        return '';
    }
  }, [selectedTemplate, selectedDebt, userName, userAddress, proposedPayment, settlementPercent]);

  // Set initial content to static template, reset if settings edit happens unless already AI processed
  useEffect(() => {
    if (!usingAi) {
      setLetterContent(legacyLetter);
    }
  }, [legacyLetter, usingAi]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setUsingAi(true);
    setSavedToHistory(false);
    try {
      const result = await generateLetter(
        selectedTemplate,
        selectedDebtId || '0',
        proposedPayment,
        settlementPercent,
        userName,
        userAddress
      );
      setLetterContent(result);
      setSavedToHistory(true);
      setTimeout(() => setSavedToHistory(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetToTemplate = () => {
    setUsingAi(false);
    setLetterContent(legacyLetter);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">Hardship Letter Generator</h1>
        <p className="text-slate-400 text-sm mt-1">Generate official correspondence for interest rate reductions, debt validation, and settlement agreements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800/80 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white font-display">Configure Template</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select a template and input parameters to populate the letter.</p>
            </div>

            {/* Template Type */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Letter Strategy</label>
              <select 
                value={selectedTemplate} 
                onChange={(e) => { setSelectedTemplate(e.target.value); setUsingAi(false); }}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="hardship">Request Interest Reduction (Hardship)</option>
                <option value="validation">Dispute Creditor Accuracy (Debt Validation)</option>
                <option value="settlement">Propose Partial Payment Settlement (Pay for Delete)</option>
              </select>
            </div>

            {/* Creditor Select */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Creditor Account</label>
              {debts.length > 0 ? (
                <select 
                  value={selectedDebtId} 
                  onChange={(e) => { setSelectedDebtId(e.target.value); setUsingAi(false); }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {debts.map((d) => (
                    <option key={d.id} value={d.id}>{d.creditor} (₹{d.balance.toLocaleString()})</option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                  No debts found. Using placeholder creditor details.
                </div>
              )}
            </div>

            {/* Sender Name */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => { setUserName(e.target.value); setUsingAi(false); }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Sender Address */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Your Mailing Address</label>
              <div className="relative">
                <Home className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={userAddress} 
                  onChange={(e) => { setUserAddress(e.target.value); setUsingAi(false); }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Template Specific Inputs */}
            {selectedTemplate === 'hardship' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Proposed Hardship Payment (₹/mo)</label>
                <input 
                  type="number" 
                  value={proposedPayment} 
                  onChange={(e) => { setProposedPayment(e.target.value); setUsingAi(false); }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {selectedTemplate === 'settlement' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Settlement Percentage (%)</label>
                <div className="grid grid-cols-4 gap-2 items-center">
                  <input 
                    type="number" 
                    value={settlementPercent} 
                    onChange={(e) => { setSettlementPercent(e.target.value); setUsingAi(false); }}
                    className="col-span-3 bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-400 text-center">%</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="80" 
                  step="5" 
                  value={settlementPercent} 
                  onChange={(e) => { setSettlementPercent(e.target.value); setUsingAi(false); }}
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Trigger AI Letter Generation */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'AI Writing...' : 'Optimize with Gemini AI'}
              </button>
              {savedToHistory && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-400">Saved to Negotiation History</span>
                </div>
              )}
              {debts.length === 0 && (
                <p className="text-[10px] text-slate-500 text-center">
                  No debts — a generic letter will be generated.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Letter Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800/80 flex flex-col h-[520px]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  {usingAi ? 'Gemini AI Custom Output' : 'Live Template Preview'}
                </h3>
              </div>
              
              <div className="flex gap-2">
                {usingAi && (
                  <button
                    onClick={handleResetToTemplate}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-850 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset to Default
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-800 transition-all cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Letter
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto mt-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900 font-mono text-[11px] leading-relaxed text-slate-400 whitespace-pre-wrap select-all relative">
              {isGenerating ? (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-t-indigo-500 border-r-indigo-500/20 border-b-indigo-500/20 border-l-indigo-500/20 animate-spin"></div>
                    <span className="text-xs font-semibold text-indigo-400 animate-pulse">Gemini AI is structuring your correspondence...</span>
                  </div>
                </div>
              ) : null}
              {letterContent}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Correspondence Logs Section */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800/80 mt-8">
        <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Generated Correspondence Logs
        </h3>
        {negotiationHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No letters have been generated yet. Optimize your plan with AI to see history.</p>
        ) : (
          <div className="space-y-4">
            {negotiationHistory.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-800 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{item.creditor_name}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${
                      item.template_type === 'settlement' ? 'bg-indigo-500/15 text-indigo-400' :
                      item.template_type === 'hardship'   ? 'bg-amber-500/15 text-amber-400' :
                                                            'bg-slate-700/50 text-slate-300'
                    }`}>
                      {item.template_type === 'settlement' ? 'Settlement' : item.template_type === 'hardship' ? 'Hardship' : 'Validation'}
                    </span>
                    {item.settlement_percent && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {item.settlement_percent}% Offer
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">{new Date(item.generated_at).toLocaleString()}</p>
                  <p className="text-xs text-slate-400 italic max-w-2xl truncate">{item.letter_preview}...</p>
                </div>
                <button
                  onClick={() => {
                    if (item.settlement_letter) {
                      setLetterContent(item.settlement_letter);
                      setUsingAi(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (item.letter_preview) {
                      setLetterContent(item.letter_preview);
                      setUsingAi(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-slate-900 border border-slate-850 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  View in Preview
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
