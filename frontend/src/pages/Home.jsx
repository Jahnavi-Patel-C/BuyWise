import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import MetricCard from '../components/MetricCard';
import DecisionBadge from '../components/DecisionBadge';
import {
  Wallet,
  Shield,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

export default function Home({ onNavigate }) {
  const { user, profile, refreshProfile } = useAuth();
  const [obligations, setObligations] = useState([]);
  const [recentDecisions, setRecentDecisions] = useState([]);
  const [advice, setAdvice] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick purchase evaluation form state
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Shopping');
  const [evaluating, setEvaluating] = useState(false);
  const [quickResult, setQuickResult] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [obRes, decRes, advRes] = await Promise.all([
        api.obligations.list({ status: 'pending' }),
        api.decisions.getHistory({ limit: 4 }),
        api.analytics.getRecommendations(),
      ]);

      setObligations(obRes.obligations || []);
      setRecentDecisions(decRes.decisions || []);
      setAdvice(advRes.recommendations || []);
    } catch (err) {
      console.error('Failed to load home dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEvaluate = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    setEvaluating(true);
    setQuickResult(null);
    try {
      const res = await api.decisions.evaluatePurchase({
        purchaseName: itemName,
        amount: Number(itemPrice),
        category: itemCategory,
        plannedDate: new Date(),
        priority: 'useful',
      });
      setQuickResult(res.decision || res.evaluation);
      refreshProfile();
      // Reload recent decisions
      const decRes = await api.decisions.getHistory({ limit: 4 });
      setRecentDecisions(decRes.decisions || []);
    } catch (err) {
      alert(err.message || 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const balance = profile?.currentBalance || 0;
  const reserve = profile?.emergencyReserve || 500;
  const savingsTarget = profile?.savingsTarget || 0;
  const actualSavings = profile?.actualSavings || 0;
  const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);
  const safeDiscretionary = Math.max(0, balance - reserve - remainingSavingsTarget);
  const nextObligation = obligations.length > 0 ? obligations[0] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
            Hi, {user?.username?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Let's make sure every rupee spent aligns with your college commitments and savings targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('analyzer')}
            className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
          >
            Full Decision Analyzer
          </button>
          <button
            onClick={() => onNavigate('daily')}
            className="px-4 py-2 bg-lavender-100 hover:bg-lavender-200 text-lavender-700 rounded-xl text-xs font-semibold transition-all"
          >
            Check Daily Spend
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Current Available Balance"
          value={`₹${balance.toLocaleString('en-IN')}`}
          subtitle={`Emergency Cushion: ₹${reserve.toLocaleString('en-IN')} (Untouchable)`}
          icon={Wallet}
        />
        <MetricCard
          title="Safe-to-Spend Right Now"
          value={`₹${safeDiscretionary.toLocaleString('en-IN')}`}
          subtitle={`After ₹${reserve.toLocaleString('en-IN')} reserve + ₹${remainingSavingsTarget.toLocaleString('en-IN')} remaining savings`}
          badge={remainingSavingsTarget === 0 ? "Target Achieved" : "Buffer Protected"}
          highlight
          icon={Shield}
        />
        <MetricCard
          title="Upcoming Financial Obligation"
          value={nextObligation ? `₹${nextObligation.amount.toLocaleString('en-IN')}` : 'None Pending'}
          subtitle={
            nextObligation
              ? `${nextObligation.title} (Due ${new Date(nextObligation.dueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })})`
              : 'All college fees and obligations cleared!'
          }
          icon={Calendar}
          onClick={() => onNavigate('timeline')}
        />
      </div>

      {/* Reserve vs Savings Breakdown Strip */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-5 shadow-card grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-charcoal-50/70 border border-charcoal-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
              1. Emergency Reserve (Untouchable)
            </span>
            <span className="text-base font-extrabold text-charcoal-900 mt-0.5 block">
              ₹{reserve.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-charcoal-500">Reserved for medical / urgent safety</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-rose-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-lavender-50/60 border border-lavender-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-lavender-800 block">
              2. Monthly Savings Target
            </span>
            <span className="text-base font-extrabold text-lavender-900 mt-0.5 block">
              ₹{savingsTarget.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-semibold text-charcoal-600">
                (₹{actualSavings.toLocaleString('en-IN')} saved)
              </span>
            </span>
            <span className="text-[10px] text-lavender-700 font-medium">
              ₹{remainingSavingsTarget.toLocaleString('en-IN')} remaining this cycle
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-lavender-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-sage-50/60 border border-sage-200/70 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-sage-800 block">
              3. Safe Discretionary Cash
            </span>
            <span className="text-base font-extrabold text-sage-900 mt-0.5 block">
              ₹{safeDiscretionary.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-sage-700 font-medium">
              Freely spendable without breaching reserve or savings
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-sage-500" />
        </div>
      </div>

      {/* Primary Workspace: Quick Purchase Evaluator */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-charcoal-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sage-50 text-sage-600 border border-sage-200/70">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-900">
                Purchase Decision Workspace
              </h2>
              <p className="text-xs text-charcoal-500">
                Enter an item you are considering to buy. BuyWise calculates your affordability against upcoming bills.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-lavender-600 bg-lavender-50 px-2.5 py-1 rounded-full border border-lavender-200/60">
            Instant Affordability Engine
          </span>
        </div>

        <form onSubmit={handleQuickEvaluate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Item or Goal Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless noise-cancelling headphones"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Price (₹)
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="3500"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-2.5 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-sm font-semibold shadow-soft flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{evaluating ? 'Calculating...' : 'Evaluate Decision'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Result Display */}
        {quickResult && (
          <div className="mt-6 p-5 rounded-2xl bg-charcoal-50 border border-charcoal-200/80 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-200/60">
              <div className="flex items-center gap-3">
                <DecisionBadge recommendation={quickResult.recommendation} size="lg" />
                <div>
                  <h4 className="text-base font-bold text-charcoal-900">
                    {quickResult.purchaseName || itemName} — ₹{quickResult.amount || itemPrice}
                  </h4>
                  <p className="text-xs text-charcoal-500">
                    Projected balance after purchase: <span className="font-semibold text-charcoal-800">₹{quickResult.remainingProjectedBalance?.toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('simulator')}
                className="text-xs font-semibold text-lavender-700 hover:underline flex items-center gap-1"
              >
                <span>Compare What-If Options</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-600">
                Why this recommendation?
              </p>
              <ul className="space-y-1.5">
                {(quickResult.reasons || []).map((reason, idx) => (
                  <li key={idx} className="text-xs text-charcoal-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-charcoal-400 mt-1.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {quickResult.suggestedAction && (
              <div className="mt-3.5 p-3 rounded-xl bg-white border border-charcoal-200/70 text-xs text-charcoal-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                <span>Suggested Action: {quickResult.suggestedAction}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Grid: Personalized Financial Advice & Recent Purchase History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personalized Financial Advice */}
        <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                Personalized Financial Advisor
              </h3>
              <span className="text-[11px] font-semibold text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
                Rule & Habit Driven
              </span>
            </div>

            {advice.length === 0 ? (
              <p className="text-xs text-charcoal-500 py-6 text-center">
                Financial health looks stable. Record more transactions to generate personalized optimizations.
              </p>
            ) : (
              <div className="space-y-3">
                {advice.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs ${
                      item.type === 'critical'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : item.type === 'warning'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : 'bg-lavender-50/70 border-lavender-200 text-lavender-900'
                    }`}
                  >
                    <p className="font-bold text-xs mb-1">{item.title}</p>
                    <p className="text-charcoal-700 leading-relaxed">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('insights')}
            className="mt-4 pt-3 border-t border-charcoal-100 text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 flex items-center justify-between"
          >
            <span>View Complete Spending Behaviour Intelligence</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Decisions History */}
        <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                Recent Purchase Decisions
              </h3>
              <button
                onClick={() => onNavigate('analyzer')}
                className="text-xs text-lavender-700 hover:underline font-semibold"
              >
                View all
              </button>
            </div>

            {recentDecisions.length === 0 ? (
              <p className="text-xs text-charcoal-500 py-6 text-center">
                No decisions evaluated yet. Use the workspace above to evaluate your first purchase.
              </p>
            ) : (
              <div className="divide-y divide-charcoal-100">
                {recentDecisions.map((dec) => (
                  <div key={dec._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="truncate">
                      <p className="text-xs font-bold text-charcoal-900 truncate">
                        {dec.purchaseName}
                      </p>
                      <p className="text-[11px] text-charcoal-500">
                        ₹{dec.amount?.toLocaleString('en-IN')} • {dec.category}
                      </p>
                    </div>
                    <DecisionBadge recommendation={dec.recommendation} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('simulator')}
            className="mt-4 pt-3 border-t border-charcoal-100 text-xs font-semibold text-sage-700 hover:text-sage-800 flex items-center justify-between"
          >
            <span>Test decisions in What-If Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
