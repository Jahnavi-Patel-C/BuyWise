import React from 'react';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onQuickAnalyze }) {
  const { profile } = useAuth();

  const balance = profile?.currentBalance || 0;
  const reserve = profile?.emergencyReserve || 500;
  const savingsTarget = profile?.savingsTarget || 0;
  const actualSavings = profile?.actualSavings || 0;
  const remainingSavingsTarget = Math.max(0, savingsTarget - actualSavings);
  const safeToSpend = Math.max(0, balance - reserve - remainingSavingsTarget);

  return (
    <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-charcoal-200/70 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-bold text-charcoal-900">
          Student Financial Command Center
        </h2>
        <p className="text-xs text-charcoal-500">
          Indian Rupee (₹) • Explainable Financial Intelligence
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Safe to Spend Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-50 border border-sage-200/70">
          <div className="w-2 h-2 rounded-full bg-sage-500" />
          <span className="text-xs text-charcoal-600 font-medium">Safe Discretionary:</span>
          <span className="text-xs font-bold text-sage-700">
            ₹{safeToSpend.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Current Available Balance */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lavender-50 border border-lavender-200/70">
          <Shield className="w-3.5 h-3.5 text-lavender-600" />
          <span className="text-xs text-charcoal-600 font-medium">Current Balance:</span>
          <span className="text-xs font-bold text-charcoal-900">
            ₹{balance.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Quick Purchase Action Button */}
        <button
          onClick={onQuickAnalyze}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white text-xs font-semibold shadow-soft transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-lavender-300" />
          <span>Analyze Purchase</span>
        </button>
      </div>
    </header>
  );
}

