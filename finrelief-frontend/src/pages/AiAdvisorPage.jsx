import React, { useState, useRef, useEffect } from 'react';
import { useFinancialData } from '../context/FinancialDataContext';
import { 
  Sparkles, 
  Send, 
  User, 
  IndianRupee, 
  ShieldAlert, 
  FileText, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function AiAdvisorPage({ setActiveTab }) {
  const {
    debts,
    chatHistory,
    sendChatMessage,
    clearAllData,
    geminiAvailable
  } = useFinancialData();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  // Suggested Prompts
  const suggestions = [
    { text: 'Compare my Avalanche vs. Snowball saving stats' },
    { text: 'Am I in budget danger? Check my DTI' },
    { text: 'Help me negotiate my highest interest debt' },
    { text: 'Draft a quick budgeting outline for my income' }
  ];

  const handleSend = async (textToSend) => {
    if (!textToSend.trim()) return;

    setInput('');
    setIsTyping(true);
    
    try {
      await sendChatMessage(textToSend);
    } catch (err) {
      console.error('Chat transmission failed:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border-slate-800/80 flex flex-col h-[calc(100vh-12rem)] min-h-[500px] overflow-hidden animate-fadeIn text-left">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Debt Advisor</h3>
            {geminiAvailable === true && (
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                Live Gemini AI Connected
              </p>
            )}
            {geminiAvailable === false && (
              <p className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Heuristic Analysis Mode
              </p>
            )}
            {geminiAvailable === null && (
              <p className="text-[10px] text-slate-500 font-semibold">Connecting...</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-950/20">
        {chatHistory.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-4 text-left max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse text-right' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white' 
                : 'bg-slate-800 border border-slate-700 text-indigo-400'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div className="space-y-1">
              <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800/80 text-slate-300 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-500 px-2 block">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-4 text-left max-w-xs">
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 text-slate-400 rounded-tl-none text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Cards */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/20 shrink-0">
        <div className="flex flex-wrap gap-2.5 justify-start">
          {suggestions.map((s, index) => (
            <button
              key={index}
              onClick={() => handleSend(s.text)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-full text-[11px] text-indigo-300 font-semibold transition-all cursor-pointer hover:-translate-y-[0.5px]"
            >
              {s.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-900 bg-slate-900/40 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Advisor about repayment adjustments or negotiating rates..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
