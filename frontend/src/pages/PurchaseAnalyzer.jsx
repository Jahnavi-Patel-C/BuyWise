import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DecisionBadge from '../components/DecisionBadge';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  History,
  Trash2,
  Info,
} from 'lucide-react';

export default function PurchaseAnalyzer({ onNavigate }) {
  const { profile, refreshProfile } = useAuth();
  const [purchaseName, setPurchaseName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Shopping');
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState('useful');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.decisions.getHistory({ limit: 15 });
      setHistory(res.decisions || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseName || !amount) return;

    setLoading(true);
    try {
      const res = await api.decisions.evaluatePurchase({
        purchaseName,
        amount: Number(amount),
        category,
        plannedDate,
        priority,
        description,
        saveHistory: true,
      });

      setCurrentResult(res.decision || res.evaluation);
      refreshProfile();
      loadHistory();
    } catch (err) {
      alert(err.message || 'Evaluation error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Remove this decision from history?')) return;
    try {
      await api.decisions.deleteHistory(id);
      setHistory(history.filter((h) => h._id !== id));
      if (currentResult?._id === id) setCurrentResult(null);
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-sage-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Module 1 — Core Decision Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          Purchase Decision Analyzer
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Evaluate planned major purchases before spending. Transparently accounts for college fees, emergency reserves, and incoming allowance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
          <h2 className="text-base font-bold text-charcoal-900 mb-4 pb-3 border-b border-charcoal-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-lavender-600" />
            <span>Enter Purchase Details</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Purchase Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Noise Cancelling Headphones"
                value={purchaseName}
                onChange={(e) => setPurchaseName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="3500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500 bg-white"
                >
                  <option value="Shopping">Shopping</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500 bg-white"
                >
                  <option value="essential">Essential (Need)</option>
                  <option value="useful">Useful (Comfort)</option>
                  <option value="optional">Optional (Want)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Planned Purchase Date
              </label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
              />
              <p className="text-[11px] text-charcoal-400 mt-1">
                Evaluator checks if upcoming allowance credits before this date.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Optional Description
              </label>
              <textarea
                rows="2"
                placeholder="Reason or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-sm font-semibold shadow-soft flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Analyzing Affordability...' : 'Run Decision Analysis'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Output: 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          {currentResult ? (
            <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card space-y-6">
              {/* Decision Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-100">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-charcoal-400">
                    Engine Recommendation
                  </span>
                  <div className="mt-1 flex items-center gap-3">
                    <DecisionBadge recommendation={currentResult.recommendation} size="lg" />
                    <div>
                      <h3 className="text-lg font-bold text-charcoal-900">
                        {currentResult.purchaseName}
                      </h3>
                      <p className="text-xs text-charcoal-500">
                        ₹{currentResult.amount?.toLocaleString('en-IN')} • {currentResult.category}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('simulator')}
                  className="px-3 py-1.5 rounded-xl bg-lavender-50 text-lavender-700 hover:bg-lavender-100 text-xs font-semibold border border-lavender-200/60 self-start sm:self-auto transition-colors"
                >
                  Simulate in What-If →
                </button>
              </div>

              {/* Explainable Financial Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-charcoal-50 border border-charcoal-200/60">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500">
                    Safe Discretionary
                  </span>
                  <p className="text-base font-extrabold text-charcoal-900 mt-1">
                    ₹{(currentResult.safeDiscretionarySpending !== undefined ? currentResult.safeDiscretionarySpending : currentResult.discretionaryCapacity)?.toLocaleString('en-IN') || 0}
                  </p>
                  <span className="text-[10px] text-charcoal-500 block mt-0.5">Excludes reserve & savings</span>
                </div>

                <div className="p-3 rounded-xl bg-charcoal-50 border border-charcoal-200/60">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500">
                    Purchase Cost
                  </span>
                  <p className="text-base font-extrabold text-charcoal-900 mt-1">
                    ₹{currentResult.amount?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-charcoal-500 block mt-0.5">{currentResult.category}</span>
                </div>

                <div className="p-3 rounded-xl bg-charcoal-50 border border-charcoal-200/60">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500">
                    Projected Balance
                  </span>
                  <p className={`text-base font-extrabold mt-1 ${
                    (currentResult.remainingProjectedBalance || 0) < (currentResult.totalProtectedReserves || currentResult.safetyReserve || 500)
                      ? (currentResult.remainingProjectedBalance || 0) < (currentResult.safetyReserve || 500)
                        ? 'text-rose-600'
                        : 'text-amber-600'
                      : 'text-sage-700'
                  }`}>
                    ₹{currentResult.remainingProjectedBalance?.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-charcoal-500 block mt-0.5">After payment</span>
                </div>

                <div className="p-3 rounded-xl bg-charcoal-50 border border-charcoal-200/60">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500">
                    Protected Reserves
                  </span>
                  <p className="text-base font-extrabold text-charcoal-900 mt-1">
                    ₹{((currentResult.totalProtectedReserves || (currentResult.safetyReserve || 500))).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-charcoal-500 block mt-0.5">
                    ₹{currentResult.safetyReserve || 500} res + ₹{currentResult.remainingSavingsTarget ?? 0} save
                  </span>
                </div>
              </div>

              {/* Reasons & Transparency */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">
                  Transparent Calculation & Reasons
                </h4>
                <div className="space-y-2">
                  {(currentResult.reasons || []).map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-charcoal-50/70 border border-charcoal-200/50 text-xs text-charcoal-800 leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-charcoal-600 mt-1.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Next Action */}
              {currentResult.suggestedAction && (
                <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 text-xs text-sage-900 font-medium flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sage-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Recommended Next Step:</span>
                    <span>{currentResult.suggestedAction}</span>
                  </div>
                </div>
              )}

              {/* Suggested Alternatives */}
              {(currentResult.alternativeSuggestions || []).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">
                    Actionable Student Alternatives
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentResult.alternativeSuggestions.map((alt, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-lavender-100 bg-lavender-50/40 text-xs space-y-1"
                      >
                        <p className="font-bold text-lavender-800">{alt.title}</p>
                        <p className="text-charcoal-600">{alt.description}</p>
                        {alt.potentialSavings > 0 && (
                          <span className="inline-block mt-1 font-semibold text-sage-700">
                            Saves ~₹{alt.potentialSavings.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-charcoal-200/80 p-12 text-center shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-lavender-50 text-lavender-600 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-charcoal-900">
                Ready for Analysis
              </h3>
              <p className="text-xs text-charcoal-500 max-w-sm mx-auto mt-1">
                Fill in the purchase form on the left to receive an instant, mathematically explainable recommendation.
              </p>
            </div>
          )}

          {/* Past Decisions Log */}
          <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-charcoal-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-charcoal-400" />
                <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                  Decision History Log
                </h3>
              </div>
              <span className="text-xs text-charcoal-400">
                {history.length} records saved
              </span>
            </div>

            {historyLoading ? (
              <p className="text-xs text-charcoal-400 py-4 text-center">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-4 text-center">
                No past decisions recorded.
              </p>
            ) : (
              <div className="divide-y divide-charcoal-100 max-h-80 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate cursor-pointer" onClick={() => setCurrentResult(item)}>
                      <p className="font-bold text-charcoal-900 truncate hover:text-sage-700">
                        {item.purchaseName}
                      </p>
                      <p className="text-[11px] text-charcoal-500">
                        ₹{item.amount?.toLocaleString('en-IN')} • {item.category} •{' '}
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <DecisionBadge recommendation={item.recommendation} size="sm" />
                      <button
                        onClick={() => handleDeleteHistory(item._id)}
                        className="p-1 text-charcoal-300 hover:text-rose-600 transition-colors"
                        title="Delete decision"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

