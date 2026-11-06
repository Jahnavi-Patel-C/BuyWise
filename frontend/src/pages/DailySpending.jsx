import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DecisionBadge from '../components/DecisionBadge';
import { Coffee, ArrowRight, CheckCircle2, Shield, Calendar, AlertCircle } from 'lucide-react';

export default function DailySpending() {
  const { profile } = useAuth();
  const [amount, setAmount] = useState('250');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('Food Delivery / Dinner');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const presets = [
    { label: 'Chai & Snack', amount: 60, category: 'Food', desc: 'Evening Chai Break' },
    { label: 'Canteen Lunch', amount: 90, category: 'Food', desc: 'College Canteen Meal' },
    { label: 'Food Delivery', amount: 250, category: 'Food', desc: 'Swiggy / Zomato Order' },
    { label: 'Auto / Cab Ride', amount: 120, category: 'Transport', desc: 'Rapido / Auto ride' },
    { label: 'Stationery & Xerox', amount: 80, category: 'Education', desc: 'Lab notes photocopy' },
  ];

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setLoading(true);
    try {
      const res = await api.decisions.evaluateDaily({
        amount: Number(amount),
        category,
        description,
      });
      setResult(res.result);
    } catch (err) {
      alert(err.message || 'Evaluation error');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setAmount(preset.amount.toString());
    setCategory(preset.category);
    setDescription(preset.desc);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-sage-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Coffee className="w-4 h-4" />
          <span>Module 2 — Everyday Micro-Spending</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          Daily Spending Evaluator
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Check everyday micro-purchases before swiping. Evaluates today's velocity against your daily safe allowance.
        </p>
      </div>

      {/* Main Evaluator Card */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 sm:p-8 shadow-card">
        <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-700 mb-3">
          Quick Preset Examples
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-xl border border-charcoal-200 text-xs font-medium text-charcoal-700 hover:bg-lavender-50 hover:border-lavender-200 transition-colors"
            >
              {p.label} (₹{p.amount})
            </button>
          ))}
        </div>

        <form onSubmit={handleEvaluate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Daily Spend Amount (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="250"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-base font-bold focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500 bg-white"
              >
                <option value="Food">Food & Drinks</option>
                <option value="Transport">Transport / Travel</option>
                <option value="Groceries">Groceries</option>
                <option value="Education">Education & Xerox</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy Lunch with roomie"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-sm font-semibold shadow-soft flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Evaluating Daily Velocity...' : 'Can I Spend This Today?'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Evaluation Result */}
        {result && (
          <div className="mt-8 pt-6 border-t border-charcoal-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-50/70 border border-charcoal-200/80">
              <div className="flex items-center gap-4">
                <DecisionBadge recommendation={result.recommendation} size="lg" />
                <div>
                  <h4 className="text-base font-bold text-charcoal-900">
                    Proposed Spend: ₹{result.spendAmount} for {result.category}
                  </h4>
                  <p className="text-xs text-charcoal-500">
                    Remaining account balance if spent: <span className="font-bold text-charcoal-800">₹{result.balanceAfterSpend?.toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Velocity Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-sage-50/60 border border-sage-200/60">
                <span className="text-[10px] uppercase font-bold text-sage-800">
                  Daily Safe Limit
                </span>
                <p className="text-lg font-black text-sage-900 mt-1">
                  ₹{result.dailySafeAllowance}/day
                </p>
                <span className="text-[10px] text-sage-600 block mt-0.5">
                  Over remaining {result.remainingDaysInMonth} days
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-50 border border-charcoal-200/60">
                <span className="text-[10px] uppercase font-bold text-charcoal-500">
                  Already Spent Today
                </span>
                <p className="text-lg font-black text-charcoal-900 mt-1">
                  ₹{result.spentToday}
                </p>
                <span className="text-[10px] text-charcoal-500 block mt-0.5">
                  From transaction records
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-50 border border-charcoal-200/60">
                <span className="text-[10px] uppercase font-bold text-charcoal-500">
                  Projected Today Spend
                </span>
                <p className={`text-lg font-black mt-1 ${
                  result.projectedTodaySpend > result.dailySafeAllowance * 1.5 ? 'text-amber-600' : 'text-charcoal-900'
                }`}>
                  ₹{result.projectedTodaySpend}
                </p>
                <span className="text-[10px] text-charcoal-500 block mt-0.5">
                  Current + Proposed
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-50 border border-charcoal-200/60">
                <span className="text-[10px] uppercase font-bold text-charcoal-500">
                  Protected Savings & Reserve
                </span>
                <p className="text-lg font-black text-charcoal-900 mt-1">
                  ₹{(result.totalProtectedReserves || result.emergencyReserve || 500).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-charcoal-500 block mt-0.5">
                  ₹{result.emergencyReserve || 500} res + ₹{result.remainingSavingsTarget || 0} save
                </span>
              </div>
            </div>

            {/* Explanation Reasons */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                Why this recommendation?
              </h5>
              {(result.reasons || []).map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-charcoal-50 border border-charcoal-200/50 text-xs text-charcoal-800 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-charcoal-500 mt-1.5 flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            {/* Action suggestion */}
            {result.suggestedAction && (
              <div className="p-3.5 rounded-xl bg-white border border-charcoal-200/80 text-xs font-medium text-charcoal-800 flex items-center gap-2.5 shadow-soft">
                <CheckCircle2 className="w-4 h-4 text-sage-600 flex-shrink-0" />
                <span>Advice: {result.suggestedAction}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

