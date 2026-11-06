import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  Repeat,
  Sparkles,
  Zap,
  Info,
  DollarSign,
  Coffee,
  CheckCircle2,
} from 'lucide-react';

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntelligence();
  }, []);

  const loadIntelligence = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.getIntelligence();
      setData(res);
    } catch (err) {
      console.error('Failed to load spending intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary;
  const categories = data?.categoryBreakdown || [];
  const microExpenses = data?.microExpenses || [];
  const recurring = data?.recurringExpenses || [];
  const anomalies = data?.anomalies || [];
  const forecast = data?.forecast;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-sage-600 text-xs font-bold uppercase tracking-wider mb-1">
          <PieChart className="w-4 h-4" />
          <span>Module 5 — Spending Behaviour Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          Spending Behaviour & ML Insights
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Detect financial leaks, identify repeated micro-transactions, and review Isolation Forest anomaly detection.
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-charcoal-200/80 shadow-card">
          <span className="text-[10px] uppercase font-bold text-charcoal-500">
            Total Spent Tracked
          </span>
          <p className="text-2xl font-black text-charcoal-900 mt-1">
            ₹{(summary?.totalSpent || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-charcoal-400 mt-0.5 block">
            Across {summary?.transactionCount || 0} transactions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200/80 shadow-card">
          <span className="text-[10px] uppercase font-bold text-charcoal-500">
            Average Expense
          </span>
          <p className="text-2xl font-black text-charcoal-900 mt-1">
            ₹{(summary?.averageExpense || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-charcoal-400 mt-0.5 block">Per expense ticket</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200/80 shadow-card">
          <span className="text-[10px] uppercase font-bold text-charcoal-500">
            30-Day ML Forecast
          </span>
          <p className="text-2xl font-black text-sage-700 mt-1">
            ₹{(forecast?.forecastTotal || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-charcoal-400 mt-0.5 block">
            ~₹{forecast?.forecastDailyAverage || 0}/day ({forecast?.trend || 'stable'})
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200/80 shadow-card">
          <span className="text-[10px] uppercase font-bold text-charcoal-500">
            Unusual Outliers Flagged
          </span>
          <p className={`text-2xl font-black mt-1 ${anomalies.length > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {anomalies.length}
          </p>
          <span className="text-xs text-charcoal-400 mt-0.5 block">
            Via {data?.anomalyMethod?.replace('_', ' ') || 'ML engine'}
          </span>
        </div>
      </div>

      {/* Grid: Category Breakdown + Micro-Expenses Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Breakdown: 6 cols */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 mb-4 pb-2 border-b border-charcoal-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-lavender-600" />
            <span>Category-Wise Expenditure</span>
          </h3>

          {categories.length === 0 ? (
            <p className="text-xs text-charcoal-400 py-6 text-center">No expenses recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-charcoal-800">{cat.category}</span>
                    <span className="font-extrabold text-charcoal-900">
                      ₹{cat.total.toLocaleString('en-IN')}{' '}
                      <span className="font-normal text-charcoal-400">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-charcoal-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sage-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Micro-Spending Leaks (Actionable Student Advice): 6 cols */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 mb-4 pb-2 border-b border-charcoal-100 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-600" />
            <span>Repeated Small Purchases & Potential Leaks</span>
          </h3>

          {microExpenses.length === 0 ? (
            <p className="text-xs text-charcoal-400 py-6 text-center">
              No repeated micro-spending leaks detected. Keep up the disciplined spending!
            </p>
          ) : (
            <div className="space-y-3">
              {microExpenses.map((micro, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase tracking-wide text-[11px]">
                      {micro.category} Micro-Habit ({micro.count}x purchases)
                    </span>
                    <span className="font-extrabold text-sage-700 bg-white px-2 py-0.5 rounded-md border border-sage-200">
                      Potential Save: ₹{micro.potentialMonthlySavings}/mo
                    </span>
                  </div>
                  <p className="text-charcoal-700 leading-relaxed font-medium">
                    {micro.insight}
                  </p>
                  {micro.examples.length > 0 && (
                    <p className="text-[11px] text-charcoal-500">
                      Examples: {micro.examples.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outliers & Anomalies (Isolation Forest Section) */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-charcoal-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
              Unusual Spending Detection (Isolation Forest)
            </h3>
          </div>
          <span className="text-xs text-charcoal-500 font-medium">
            Evaluated using Scikit-Learn Isolation Forest with student category statistics
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-6 text-center text-xs text-charcoal-500">
            <CheckCircle2 className="w-6 h-6 text-sage-600 mx-auto mb-2" />
            <span>No anomalous transactions flagged. All transactions conform to expected student distribution.</span>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {anomalies.map((anom, idx) => (
              <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-charcoal-900">{anom.description}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                      Anomaly Outlier
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-500 mt-1">
                    {anom.reason}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="font-black text-rose-600 text-base">
                    ₹{anom.amount?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-charcoal-400 block">
                    Category: {anom.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring Subscriptions & Fixed Expenses */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-charcoal-100">
          <Repeat className="w-4 h-4 text-lavender-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
            Identified Recurring Expenses
          </h3>
        </div>

        {recurring.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-6 text-center">
            No recurring subscription patterns identified yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recurring.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-charcoal-200/80 bg-charcoal-50/50 text-xs">
                <span className="font-bold text-charcoal-900 block capitalize">
                  {rec.description}
                </span>
                <span className="text-[11px] text-charcoal-500 mt-0.5 block">
                  Seen {rec.frequencyCount} times ({rec.category})
                </span>
                <div className="mt-2 pt-2 border-t border-charcoal-200/60 flex justify-between items-center">
                  <span className="text-charcoal-500 text-[10px]">Avg Ticket:</span>
                  <span className="font-extrabold text-charcoal-800">₹{rec.averageAmount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

