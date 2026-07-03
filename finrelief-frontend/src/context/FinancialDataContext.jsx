import React, { createContext, useContext, useState, useEffect } from 'react';

const FinancialDataContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const INITIAL_DEBTS = [
  { id: '1', creditor: 'HDFC Regalia Credit Card', balance: 180000, apr: 36.0, minPayment: 9000, category: 'Credit Card' },
  { id: '2', creditor: 'SBI Car Loan', balance: 450000, apr: 8.5, minPayment: 12000, category: 'Auto Loan' },
  { id: '3', creditor: 'HDFC Credila Student Loan', balance: 850000, apr: 9.2, minPayment: 15000, category: 'Student Loan' }
];

const INITIAL_CHAT = [
  {
    id: 'welcome',
    sender: 'ai',
    text: "Hello! I am FinRelief's AI Assistant. How can I assist you in your financial recovery today? I can help draft negotiation letters, suggest custom budgets, or compare repayment strategies.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

export const FinancialDataProvider = ({ children }) => {
  // Authentication states
  const [token, setToken] = useState(() => localStorage.getItem('finrelief_jwt_token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Financial profile state
  const [debts, setDebts] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(85000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(42000); // non-debt expenses
  const [extraPayment, setExtraPayment] = useState(5000);
  const [strategy, setStrategy] = useState('avalanche');
  const [chatHistory, setChatHistory] = useState(INITIAL_CHAT);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [geminiAvailable, setGeminiAvailable] = useState(null); // null = unknown

  // Helper for authenticated headers
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Check auth and load user profile/debts on mount/token change
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setAuthLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Session expired');
        }

        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Populate profile settings
        setMonthlyIncome(userData.monthly_income);
        setMonthlyExpenses(userData.monthly_expenses);
        setExtraPayment(userData.extra_payment);
        setStrategy(userData.strategy);
        setOnboardingCompleted(userData.onboarding_completed);

        // Fetch user debts
        const debtsRes = await fetch(`${API_URL}/api/debts/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (debtsRes.ok) {
          const debtsData = await debtsRes.json();
          // Map backend debt models (which use camelcase or direct naming)
          // Backend uses min_payment, frontend expects minPayment
          const mappedDebts = debtsData.map(d => ({
            id: d.id.toString(),
            creditor: d.creditor,
            balance: d.balance,
            apr: d.apr,
            minPayment: d.min_payment,
            category: d.category,
            loanAmount: d.loan_amount || d.balance,
            dueDate: d.due_date || ''
          }));
          setDebts(mappedDebts);
        }

        // Fetch settlement records history
        const settlementHistoryRes = await fetch(`${API_URL}/api/ai/settlement-history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (settlementHistoryRes.ok) {
          const settlementHistoryData = await settlementHistoryRes.json();
          setSettlementHistory(settlementHistoryData);
        }

        // Fetch chat history
        const chatRes = await fetch(`${API_URL}/api/ai/chat/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const mappedChat = chatData.map(c => ({
            id: c.id.toString(),
            sender: c.sender,
            text: c.text,
            timestamp: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setChatHistory(mappedChat);
        }

        // Fetch negotiation history (Scenario 3)
        const negRes = await fetch(`${API_URL}/api/ai/negotiation-history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (negRes.ok) {
          const negData = await negRes.json();
          setNegotiationHistory(negData);
        }

        // Check Gemini AI status
        const statusRes = await fetch(`${API_URL}/api/ai/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setGeminiAvailable(statusData.gemini_available);
        }

      } catch (err) {
        console.error('Auth check error:', err);
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [token]);

  // Auth Operations
  const register = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Registration failed');
      }

      return await login(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Invalid username or password');
      }

      const data = await res.json();
      localStorage.setItem('finrelief_jwt_token', data.access_token);
      setToken(data.access_token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('finrelief_jwt_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setDebts([]);
    setMonthlyIncome(85000);
    setMonthlyExpenses(42000);
    setExtraPayment(5000);
    setStrategy('avalanche');
    setChatHistory(INITIAL_CHAT);
    setOnboardingCompleted(false);
    setNegotiationHistory([]);
    setGeminiAvailable(null);
  };

  // Financial Operations syncing with backend
  const addDebt = async (debt) => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/debts/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          creditor: debt.creditor,
          balance: debt.balance,
          apr: debt.apr,
          min_payment: debt.minPayment,
          category: debt.category,
          emi: debt.emi || null,
          overdue_months: debt.overdueMonths || 0,
          loan_amount: debt.loanAmount || 0,
          due_date: debt.dueDate || null
        })
      });

      if (res.ok) {
        const newDebt = await res.json();
        setDebts((prev) => [...prev, {
          id: newDebt.id.toString(),
          creditor: newDebt.creditor,
          balance: newDebt.balance,
          apr: newDebt.apr,
          minPayment: newDebt.min_payment,
          category: newDebt.category,
          emi: newDebt.emi || null,
          overdueMonths: newDebt.overdue_months || 0,
          loanAmount: newDebt.loan_amount || 0,
          dueDate: newDebt.due_date || ''
        }]);
      }
    } catch (error) {
      console.error('Error adding debt:', error);
    }
  };

  const updateDebt = async (updatedDebt) => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/debts/${updatedDebt.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          creditor: updatedDebt.creditor,
          balance: updatedDebt.balance,
          apr: updatedDebt.apr,
          min_payment: updatedDebt.minPayment,
          category: updatedDebt.category,
          emi: updatedDebt.emi || null,
          overdue_months: updatedDebt.overdueMonths || 0,
          loan_amount: updatedDebt.loanAmount || 0,
          due_date: updatedDebt.dueDate || null
        })
      });

      if (res.ok) {
        const d = await res.json();
        setDebts((prev) => prev.map((item) => (item.id === d.id.toString() ? {
          id: d.id.toString(),
          creditor: d.creditor,
          balance: d.balance,
          apr: d.apr,
          minPayment: d.min_payment,
          category: d.category,
          emi: d.emi || null,
          overdueMonths: d.overdue_months || 0,
          loanAmount: d.loan_amount || 0,
          dueDate: d.due_date || ''
        } : item)));
      }
    } catch (error) {
      console.error('Error updating debt:', error);
    }
  };

  const deleteDebt = async (id) => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/debts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        setDebts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  };

  // Sync profile edits with backend helper
  const syncProfileChange = async (updates) => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/profile/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Profile sync error:', error);
    }
  };

  const handleSetMonthlyIncome = (val) => {
    setMonthlyIncome(val);
    syncProfileChange({ monthly_income: val });
  };

  const handleSetMonthlyExpenses = (val) => {
    setMonthlyExpenses(val);
    syncProfileChange({ monthly_expenses: val });
  };

  const handleSetExtraPayment = (val) => {
    setExtraPayment(val);
    syncProfileChange({ extra_payment: val });
  };

  const handleSetStrategy = (val) => {
    setStrategy(val);
    syncProfileChange({ strategy: val });
  };

  const handleSetOnboardingCompleted = (val) => {
    setOnboardingCompleted(val);
    syncProfileChange({ onboarding_completed: val });
  };

  // Bulk save from Onboarding Flow
  const saveOnboardingProfile = async (income, expenses, extra, initialDebtsList) => {
    if (!isAuthenticated) return;
    try {
      // 1. Update basic profile metrics
      const profileRes = await fetch(`${API_URL}/api/profile/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          monthly_income: income,
          monthly_expenses: expenses,
          extra_payment: extra,
          onboarding_completed: true
        })
      });

      if (!profileRes.ok) throw new Error('Failed to update onboarding profile');

      const updatedUser = await profileRes.json();
      setUser(updatedUser);
      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setExtraPayment(extra);
      setOnboardingCompleted(true);

      // 2. Add initial debts sequentially
      const addedDebts = [];
      for (const debt of initialDebtsList) {
        const res = await fetch(`${API_URL}/api/debts/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            creditor: debt.creditor,
            balance: debt.balance,
            apr: debt.apr,
            min_payment: debt.minPayment,
            category: debt.category
          })
        });
        if (res.ok) {
          const d = await res.json();
          addedDebts.push({
            id: d.id.toString(),
            creditor: d.creditor,
            balance: d.balance,
            apr: d.apr,
            minPayment: d.min_payment,
            category: d.category
          });
        }
      }
      setDebts(addedDebts);
    } catch (err) {
      console.error('Error saving onboarding data:', err);
    }
  };

  const clearAllData = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/profile/reset`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setDebts([]);
        setMonthlyIncome(50000);
        setMonthlyExpenses(25000);
        setExtraPayment(0);
        setStrategy('avalanche');
        setChatHistory(INITIAL_CHAT);
        setOnboardingCompleted(false);
        setNegotiationHistory([]);
      }
    } catch (error) {
      console.error('Error resetting user profile:', error);
    }
  };

  // Settlement Analysis (Scenario 1)
  const runSettlementAnalysis = async (debtId = null) => {
    if (!isAuthenticated) return null;
    try {
      const res = await fetch(`${API_URL}/api/ai/settlement-analysis`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ debt_id: debtId })
      });
      if (res.ok) {
        const data = await res.json();
        fetchSettlementHistory();
        return data;
      }
      throw new Error('Analysis failed');
    } catch (error) {
      console.error('Settlement analysis error:', error);
      return null;
    }
  };

  // Refresh settlement records history
  const fetchSettlementHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/ai/settlement-history`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setSettlementHistory(await res.json());
    } catch (error) {
      console.error('Fetch settlement history error:', error);
    }
  };

  // Refresh negotiation history (Scenario 3)
  const fetchNegotiationHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/api/ai/negotiation-history`, {
        headers: getAuthHeaders()
      });
      if (res.ok) setNegotiationHistory(await res.json());
    } catch (error) {
      console.error('Fetch negotiation history error:', error);
    }
  };

  // AI advisor message transmission
  const sendChatMessage = async (text) => {
    if (!isAuthenticated) return;
    
    // Add user message locally for responsive feeling
    const tempUserMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const aiResponse = await res.json();
        const mappedResponse = {
          id: aiResponse.id.toString(),
          sender: aiResponse.sender,
          text: aiResponse.text,
          timestamp: new Date(aiResponse.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        // Set actual server message list to ensure sync
        setChatHistory((prev) => {
          // Replace our temporary local user message with the verified database message logs to avoid double-logging
          return prev.filter(m => m.id !== tempUserMsg.id).concat([
            { ...tempUserMsg, id: (aiResponse.id - 1).toString() },
            mappedResponse
          ]);
        });
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  // Dynamic hardship correspondence generation request
  const generateLetter = async (templateType, creditorId, proposedPayment, settlementPercent, userName, userAddress) => {
    if (!isAuthenticated) return '';
    try {
      const res = await fetch(`${API_URL}/api/ai/generate-letter`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          template_type: templateType,
          creditor_id: creditorId.toString(),
          proposed_payment: proposedPayment,
          settlement_percent: settlementPercent,
          user_name: userName,
          user_address: userAddress
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh negotiation history after a successful generation (Scenario 3)
        fetchNegotiationHistory();
        return data.content;
      }
      throw new Error('Failed to generate letter');
    } catch (error) {
      console.error('Error requesting letter generation:', error);
      return 'Failed to reach AI letters engine. Please verify server status.';
    }
  };

  // Calculations
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const debtToIncomeRatio = monthlyIncome > 0 ? ((totalMinPayment / monthlyIncome) * 100).toFixed(1) : 0;
  
  // Total expenses including minimum debt payments
  const totalMonthlyCommitment = monthlyExpenses + totalMinPayment;
  const netMonthlySavings = monthlyIncome - totalMonthlyCommitment;

  // Debt Recovery Score
  const calculateRecoveryScore = () => {
    if (totalDebt === 0) return 100;
    
    let score = 100;
    
    // DTI impact
    const dtiVal = parseFloat(debtToIncomeRatio);
    if (dtiVal > 50) score -= 30;
    else if (dtiVal > 36) score -= 20;
    else if (dtiVal > 15) score -= 10;

    // Savings impact
    const savingsRatio = monthlyIncome > 0 ? (netMonthlySavings / monthlyIncome) * 100 : 0;
    if (savingsRatio < 0) score -= 40; // Deficit
    else if (savingsRatio < 10) score -= 20;
    else if (savingsRatio < 25) score -= 10;

    // Average APR impact
    const avgApr = debts.length > 0 ? debts.reduce((sum, d) => sum + d.apr, 0) / debts.length : 0;
    if (avgApr > 20) score -= 15;
    else if (avgApr > 15) score -= 10;
    
    // Total debt volume compared to annual income
    const annualIncome = monthlyIncome * 12;
    if (annualIncome > 0) {
      const debtToAnnualIncome = totalDebt / annualIncome;
      if (debtToAnnualIncome > 1.5) score -= 15;
      else if (debtToAnnualIncome > 0.8) score -= 10;
    }

    return Math.max(10, Math.min(100, score));
  };

  const recoveryScore = calculateRecoveryScore();

  // Payoff Timeline Simulator (Snowball vs Avalanche logic)
  const simulatePayoff = (selectedStrategy = strategy, customExtraPayment = extraPayment) => {
    if (debts.length === 0) {
      return { months: 0, totalInterest: 0, timeline: [], error: null };
    }

    let currentDebts = debts.map((d) => ({ ...d, currentBalance: d.balance }));
    let timeline = [];
    let months = 0;
    let totalInterestPaid = 0;
    
    const maxMonths = 360; // 30 years cap
    const totalMinRequirement = currentDebts.reduce((sum, d) => sum + d.minPayment, 0);

    timeline.push({
      month: 0,
      monthName: 'Start',
      remainingBalance: totalDebt,
      interestPaidThisMonth: 0,
      debts: debts.map((d) => ({ creditor: d.creditor, balance: d.balance }))
    });

    while (currentDebts.some((d) => d.currentBalance > 0) && months < maxMonths) {
      months++;
      let interestThisMonth = 0;

      // 1. Accrue interest first, and pay minimum payments
      currentDebts = currentDebts.map((d) => {
        if (d.currentBalance <= 0) return d;

        const monthlyInterestRate = (d.apr / 100) / 12;
        const interest = d.currentBalance * monthlyInterestRate;
        interestThisMonth += interest;

        let newBalance = d.currentBalance + interest;
        const payment = Math.min(d.minPayment, newBalance);
        newBalance -= payment;

        return { ...d, currentBalance: newBalance };
      });

      totalInterestPaid += interestThisMonth;

      const actualMinPaymentNeeded = currentDebts.reduce((sum, d) => sum + (d.currentBalance > 0 ? d.minPayment : 0), 0);
      let rolloverPayments = totalMinRequirement - actualMinPaymentNeeded;
      let accelerator = customExtraPayment + rolloverPayments;

      // 2. Sort debts based on active strategy
      const activeDebts = currentDebts
        .filter((d) => d.currentBalance > 0)
        .sort((a, b) => {
          if (selectedStrategy === 'avalanche') {
            return b.apr - a.apr;
          } else {
            return a.currentBalance - b.currentBalance;
          }
        });

      // 3. Apply the accelerator
      if (activeDebts.length > 0 && accelerator > 0) {
        let currentTarget = activeDebts[0];
        currentDebts = currentDebts.map((d) => {
          if (d.id === currentTarget.id) {
            const payment = Math.min(accelerator, d.currentBalance);
            accelerator -= payment;
            return { ...d, currentBalance: d.currentBalance - payment };
          }
          return d;
        });

        if (accelerator > 0 && activeDebts.length > 1) {
          let secondTarget = activeDebts[1];
          currentDebts = currentDebts.map((d) => {
            if (d.id === secondTarget.id) {
              const payment = Math.min(accelerator, d.currentBalance);
              return { ...d, currentBalance: d.currentBalance - payment };
            }
            return d;
          });
        }
      }

      const remainingTotal = currentDebts.reduce((sum, d) => sum + d.currentBalance, 0);

      timeline.push({
        month: months,
        monthName: `Month ${months}`,
        remainingBalance: Math.round(remainingTotal),
        interestPaidThisMonth: Math.round(interestThisMonth),
        debts: currentDebts.map((d) => ({ creditor: d.creditor, balance: Math.round(d.currentBalance) }))
      });
    }

    return {
      months: months >= maxMonths ? '30+ Years' : months,
      totalInterest: Math.round(totalInterestPaid),
      timeline,
      error: months >= maxMonths ? 'Budget too low to make headway against interest.' : null
    };
  };

  return (
    <FinancialDataContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        authLoading,
        register,
        login,
        logout,
        debts,
        monthlyIncome,
        monthlyExpenses,
        extraPayment,
        strategy,
        chatHistory,
        onboardingCompleted,
        negotiationHistory,
        geminiAvailable,
        totalDebt,
        totalMinPayment,
        debtToIncomeRatio,
        netMonthlySavings,
        recoveryScore,
        setMonthlyIncome: handleSetMonthlyIncome,
        setMonthlyExpenses: handleSetMonthlyExpenses,
        setExtraPayment: handleSetExtraPayment,
        setStrategy: handleSetStrategy,
        setOnboardingCompleted: handleSetOnboardingCompleted,
        saveOnboardingProfile,
        addDebt,
        updateDebt,
        deleteDebt,
        clearAllData,
        sendChatMessage,
        generateLetter,
        simulatePayoff,
        runSettlementAnalysis,
        fetchNegotiationHistory,
        settlementHistory,
        fetchSettlementHistory
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => {
  const context = useContext(FinancialDataContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};
