import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export default function TransactionsPage() {
  const { refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('all');

  // Add transaction modal
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('auto');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [autoCatResult, setAutoCatResult] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, [filterCategory, filterType]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.transactions.list({
        category: filterCategory,
        type: filterType,
        limit: 100,
      });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictCategory = async () => {
    if (!description.trim()) return;
    try {
      const res = await api.transactions.autoCategorize(description);
      setAutoCatResult(res);
      setCategory(res.category);
    } catch (err) {
      console.error('Auto categorize error:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    setSubmitting(true);
    try {
      await api.transactions.create({
        description,
        amount: Number(amount),
        type,
        category: category === 'auto' ? undefined : category,
        paymentMethod,
        date,
      });
      setDescription('');
      setAmount('');
      setAutoCatResult(null);
      setShowModal(false);
      loadTransactions();
      refreshProfile();
    } catch (err) {
      alert(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction and revert balance?')) return;
    try {
      await api.transactions.delete(id);
      loadTransactions();
      refreshProfile();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sage-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Transaction Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
            Transaction History
          </h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Track student spending records with automatic ML categorization and anomaly detection.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-xs font-semibold shadow-soft flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-charcoal-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
          >
            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Education">Education</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Bills">Bills</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Groceries">Groceries</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-charcoal-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>
        </div>

        <span className="text-xs text-charcoal-400 font-medium">
          Showing {transactions.length} records
        </span>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 shadow-card overflow-hidden">
        {loading ? (
          <p className="text-xs text-charcoal-400 py-12 text-center">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-12 text-center">
            No transactions found matching criteria. Click "Record Transaction" to add one.
          </p>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx._id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-charcoal-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-charcoal-50 text-charcoal-700 border border-charcoal-200'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-charcoal-900 truncate">
                          {tx.description}
                        </p>
                        {tx.isAnomaly && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                            Anomaly
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-charcoal-500">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        • {tx.category} • {tx.paymentMethod || 'UPI'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isIncome ? 'text-emerald-700' : 'text-charcoal-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDelete(tx._id)}
                      className="p-1.5 text-charcoal-300 hover:text-rose-600 transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-charcoal-200 p-6 max-w-md w-full shadow-elevated">
            <h3 className="text-base font-bold text-charcoal-900 mb-4">
              Record Transaction
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Description
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiggy Lunch with roomie"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                  />
                  <button
                    type="button"
                    onClick={handlePredictCategory}
                    className="px-3 py-2 bg-lavender-50 hover:bg-lavender-100 text-lavender-700 border border-lavender-200 rounded-xl text-xs font-semibold flex items-center gap-1"
                    title="Auto-detect category with ML"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto ML</span>
                  </button>
                </div>
                {autoCatResult && (
                  <p className="text-[11px] text-lavender-700 mt-1 font-medium">
                    AI Predicted: <strong>{autoCatResult.category}</strong> (Conf: {(autoCatResult.confidence * 100).toFixed(0)}%)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="220"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                  >
                    <option value="auto">Auto Categorize (ML)</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Bills">Bills</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-charcoal-600 hover:bg-charcoal-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl shadow-soft"
                >
                  {submitting ? 'Saving...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

