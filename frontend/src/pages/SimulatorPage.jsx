import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Calculator,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Shield,
} from 'lucide-react';

export default function SimulatorPage() {
  const { profile } = useAuth();
  const [purchaseName, setPurchaseName] = useState('Wireless Noise-Cancelling Headphones');
  const [amount, setAmount] = useState('3500');
  const [category, setCategory] = useState('Electronics');
  const [alternativeDiscountPct, setAlternativeDiscountPct] = useState(35);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runSimulation();
  }, [amount, alternativeDiscountPct]);

  const runSimulation = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try {
      const res = await api.decisions.simulate({
        purchaseName,
        amount: Number(amount),
        category,
        alternativeDiscountPct: Number(alternativeDiscountPct),
      });
      setSimulation(res.simulation);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = simulation?.scenarios;
  const input = simulation?.input;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-sage-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Module 4 — What-If Purchase Simulator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          What-If Purchase Simulator
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Experiment with alternatives, wait periods, and budgets before committing your funds.
        </p>
      </div>

      {/* Simulator Inputs Card */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 sm:p-8 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Purchase Name / Item
            </label>
            <input
              type="text"
              value={purchaseName}
              onChange={(e) => setPurchaseName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Purchase Price (₹)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-base font-bold focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Alternative Discount ({alternativeDiscountPct}%)
            </label>
            <input
              type="range"
              min="15"
              max="70"
              step="5"
              value={alternativeDiscountPct}
              onChange={(e) => setAlternativeDiscountPct(e.target.value)}
              className="w-full h-2 bg-charcoal-200 rounded-lg appearance-none cursor-pointer accent-lavender-600"
            />
          </div>
        </div>

        {/* Explainable Financial Capacity Equation */}
        {input && (
          <div className="mt-6 p-4 rounded-xl bg-charcoal-50/70 border border-charcoal-200/60 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-charcoal-700 font-bold uppercase tracking-wider">
                <Calculator className="w-3.5 h-3.5 text-lavender-600" />
                <span>Transparent Capacity Formula</span>
              </div>
              <span className="text-[11px] text-charcoal-500">
                Safe Discretionary Cash: <strong className="text-charcoal-800">₹{(input.safeDiscretionarySpending !== undefined ? input.safeDiscretionarySpending : (input.currentBalance - input.emergencyReserve - (input.remainingSavingsTarget || 0))).toLocaleString('en-IN')}</strong>
              </span>
            </div>
            <p className="font-mono text-charcoal-800 text-[11px] sm:text-xs leading-relaxed">
              ₹{input.currentBalance} (Balance) + ₹{input.expectedIncome} (Income) - ₹{input.upcomingObligationsTotal} (Bills) - ₹{input.emergencyReserve} (Reserve) - ₹{input.remainingSavingsTarget !== undefined ? input.remainingSavingsTarget : input.savingsTarget} (Remaining Savings) = <span className="font-bold text-sage-700 font-sans">₹{input.netFinancialCapacity.toLocaleString('en-IN')} Total Cycle Capacity</span>
            </p>
            <p className="text-[11px] text-charcoal-500 mt-1">
              Monthly target: ₹{input.savingsTarget?.toLocaleString('en-IN')} • Already saved: ₹{(input.actualSavings || 0).toLocaleString('en-IN')} • Remaining commitment to reserve: ₹{(input.remainingSavingsTarget !== undefined ? input.remainingSavingsTarget : input.savingsTarget).toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>

      {/* Scenario Comparison Cards */}
      {scenarios && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Scenario 1: Buy Now */}
          <div
            className={`p-6 rounded-2xl border transition-all ${
              scenarios.buyNow.isViable
                ? 'bg-white border-charcoal-200/80 shadow-card'
                : 'bg-rose-50/30 border-rose-200 shadow-card'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Option 1
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  scenarios.buyNow.isViable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {scenarios.buyNow.riskLevel}
              </span>
            </div>

            <h3 className="text-base font-bold text-charcoal-900">
              {scenarios.buyNow.title}
            </h3>
            <p className="text-2xl font-black text-charcoal-900 mt-2">
              ₹{scenarios.buyNow.cost.toLocaleString('en-IN')}
            </p>

            <div className="mt-4 pt-3 border-t border-charcoal-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Immediate Remaining Balance:</span>
                <span className="font-bold text-charcoal-900">
                  ₹{scenarios.buyNow.immediateBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-charcoal-600 mt-2 text-[11px] leading-relaxed">
                {scenarios.buyNow.summary}
              </p>
            </div>
          </div>

          {/* Scenario 2: Wait for Allowance */}
          <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Option 2
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Recommended Timing
              </span>
            </div>

            <h3 className="text-base font-bold text-charcoal-900">
              {scenarios.waitNextAllowance.title}
            </h3>
            <p className="text-2xl font-black text-charcoal-900 mt-2">
              ₹{scenarios.waitNextAllowance.cost.toLocaleString('en-IN')}
            </p>

            <div className="mt-4 pt-3 border-t border-charcoal-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Projected Buffer with Allowance:</span>
                <span className="font-bold text-emerald-700">
                  ₹{scenarios.waitNextAllowance.projectedBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-charcoal-600 mt-2 text-[11px] leading-relaxed">
                {scenarios.waitNextAllowance.summary}
              </p>
            </div>
          </div>

          {/* Scenario 3: Cheaper Alternative */}
          <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Option 3
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800">
                Instant Savings
              </span>
            </div>

            <h3 className="text-base font-bold text-charcoal-900">
              {scenarios.cheaperAlternative.title}
            </h3>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-black text-sage-700">
                ₹{scenarios.cheaperAlternative.cost.toLocaleString('en-IN')}
              </p>
              <span className="text-xs font-bold text-sage-600">
                (Saves ₹{scenarios.cheaperAlternative.savedAmount.toLocaleString('en-IN')})
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-charcoal-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Immediate Remaining Balance:</span>
                <span className="font-bold text-charcoal-900">
                  ₹{scenarios.cheaperAlternative.immediateBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-charcoal-600 mt-2 text-[11px] leading-relaxed">
                {scenarios.cheaperAlternative.summary}
              </p>
            </div>
          </div>

          {/* Scenario 4: Skip Purchase & Save */}
          <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Option 4
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-lavender-100 text-lavender-800">
                Maximum Wealth Buffer
              </span>
            </div>

            <h3 className="text-base font-bold text-charcoal-900">
              {scenarios.skipPurchase.title}
            </h3>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-black text-lavender-700">
                ₹0 Spent
              </p>
              <span className="text-xs font-bold text-charcoal-600">
                (Keep 100% funds)
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-charcoal-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Annualized Compound Savings:</span>
                <span className="font-bold text-sage-700">
                  ₹{scenarios.skipPurchase.projectedAnnualImpact.toLocaleString('en-IN')}/year
                </span>
              </div>
              <p className="text-charcoal-600 mt-2 text-[11px] leading-relaxed">
                {scenarios.skipPurchase.summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

