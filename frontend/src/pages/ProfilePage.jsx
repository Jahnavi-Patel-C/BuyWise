import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [allowance, setAllowance] = useState('');
  const [allowanceFrequency, setAllowanceFrequency] = useState('monthly');
  const [currentBalance, setCurrentBalance] = useState('');
  const [expectedIncome, setExpectedIncome] = useState('');
  const [expectedIncomeDate, setExpectedIncomeDate] = useState('');
  const [essentialExpenses, setEssentialExpenses] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [actualSavings, setActualSavings] = useState('');
  const [totalAccumulatedSavings, setTotalAccumulatedSavings] = useState('');
  const [emergencyReserve, setEmergencyReserve] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setAllowance(profile.allowance?.toString() || '5000');
      setAllowanceFrequency(profile.allowanceFrequency || 'monthly');
      setCurrentBalance(profile.currentBalance?.toString() || '3000');
      setExpectedIncome(profile.expectedIncome?.toString() || '5000');
      setExpectedIncomeDate(
        profile.expectedIncomeDate
          ? new Date(profile.expectedIncomeDate).toISOString().split('T')[0]
          : ''
      );
      setEssentialExpenses(profile.essentialExpenses?.toString() || '1500');
      setSavingsTarget(profile.savingsTarget?.toString() || '1000');
      setActualSavings(profile.actualSavings?.toString() || '0');
      setTotalAccumulatedSavings(profile.totalAccumulatedSavings?.toString() || '0');
      setEmergencyReserve(profile.emergencyReserve?.toString() || '500');
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.profile.update({
        allowance: Number(allowance),
        allowanceFrequency,
        currentBalance: Number(currentBalance),
        expectedIncome: Number(expectedIncome),
        expectedIncomeDate: expectedIncomeDate || null,
        essentialExpenses: Number(essentialExpenses),
        savingsTarget: Number(savingsTarget),
        actualSavings: Number(actualSavings || 0),
        totalAccumulatedSavings: Number(totalAccumulatedSavings || 0),
        emergencyReserve: Number(emergencyReserve),
      });
      await refreshProfile();
      setMessage('Financial parameters updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      <div>
        <div className="flex items-center gap-2 text-sage-600 text-xs font-bold uppercase tracking-wider mb-1">
          <User className="w-4 h-4" />
          <span>Module 3 — Profile & Thresholds</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          Financial Profile & Settings
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Define your student allowance cycle, emergency cushion, and baseline targets that govern the BuyWise decision engine.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 sm:p-8 shadow-card">
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="mb-6 pb-6 border-b border-charcoal-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sage-50 text-sage-700 flex items-center justify-center font-black text-base border border-sage-200">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal-900">{user?.username}</h3>
            <p className="text-xs text-charcoal-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Student Allowance (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Allowance Frequency
              </label>
              <select
                value={allowanceFrequency}
                onChange={(e) => setAllowanceFrequency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Current Liquid Balance (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 font-bold"
              />
              <span className="text-[11px] text-charcoal-400 mt-1 block">
                Cash in bank or UPI wallets. Automatically adjusted by transactions.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Minimum Emergency Reserve (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={emergencyReserve}
                onChange={(e) => setEmergencyReserve(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 font-bold"
              />
              <span className="text-[11px] text-charcoal-400 mt-1 block">
                Un-spendable safety cushion for medical/emergency needs.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Next Expected Income (₹)
              </label>
              <input
                type="number"
                min="0"
                value={expectedIncome}
                onChange={(e) => setExpectedIncome(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Expected Income Date
              </label>
              <input
                type="date"
                value={expectedIncomeDate}
                onChange={(e) => setExpectedIncomeDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Essential Regular Expenses (₹/mo)
              </label>
              <input
                type="number"
                min="0"
                value={essentialExpenses}
                onChange={(e) => setEssentialExpenses(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
              <span className="text-[11px] text-charcoal-400 mt-1 block">
                Baseline mess, room rent share, mobile recharge.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Monthly Savings Target (₹)
              </label>
              <input
                type="number"
                min="0"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
              <span className="text-[11px] text-charcoal-400 mt-1 block">
                Target amount to put into savings or investment each month.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                Actual Savings Achieved This Cycle (₹)
              </label>
              <input
                type="number"
                min="0"
                value={actualSavings}
                onChange={(e) => setActualSavings(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 font-bold"
              />
              <span className="text-[11px] text-charcoal-500 mt-1 block">
                Money already moved or set aside in savings. Defaults to ₹0 if keeping savings in your account until end of cycle.
              </span>
            </div>

            {/* Dynamic Calculation Live Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-charcoal-50 border border-charcoal-200/80 text-xs flex flex-col justify-center space-y-1">
              <span className="font-bold text-charcoal-900 block uppercase tracking-wider text-[10px]">
                Dynamic Real-Time Capacity
              </span>
              <div className="flex justify-between text-charcoal-600">
                <span>Remaining Savings Commitment:</span>
                <span className="font-bold text-charcoal-800">
                  ₹{Math.max(0, Number(savingsTarget || 0) - Number(actualSavings || 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-charcoal-600">
                <span>Emergency Cushion (Untouchable):</span>
                <span className="font-bold text-charcoal-800">
                  ₹{Number(emergencyReserve || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-charcoal-200 text-sage-800 font-extrabold">
                <span>Safe Discretionary Spending:</span>
                <span>
                  ₹{Math.max(0, Number(currentBalance || 0) - Number(emergencyReserve || 0) - Math.max(0, Number(savingsTarget || 0) - Number(actualSavings || 0))).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-charcoal-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-xs font-semibold shadow-soft flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Parameters...' : 'Save Financial Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

