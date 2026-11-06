import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  Trash2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Shield,
  Layers,
} from 'lucide-react';

export default function TimelinePage() {
  const { profile, refreshProfile } = useAuth();
  const [timelineData, setTimelineData] = useState(null);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);

  // New obligation modal form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [obligationType, setObligationType] = useState('college_fee');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tlRes, obRes] = await Promise.all([
        api.analytics.getTimeline(),
        api.obligations.list(),
      ]);
      setTimelineData(tlRes);
      setObligations(obRes.obligations || []);
    } catch (err) {
      console.error('Failed to load timeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObligation = async (e) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    setSubmitting(true);
    try {
      await api.obligations.create({
        title,
        amount: Number(amount),
        dueDate,
        obligationType,
        notes,
      });
      setTitle('');
      setAmount('');
      setDueDate('');
      setNotes('');
      setShowAddModal(false);
      loadData();
      refreshProfile();
    } catch (err) {
      alert(err.message || 'Failed to create obligation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ob) => {
    const newStatus = ob.status === 'pending' ? 'paid' : 'pending';
    try {
      await api.obligations.update(ob._id, { status: newStatus });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this financial obligation?')) return;
    try {
      await api.obligations.delete(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete obligation');
    }
  };

  const timeline = timelineData?.timeline || [];
  const reserve = profile?.emergencyReserve || 500;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sage-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Module 3 — Financial Timeline & Obligations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
            Financial Timeline & Commitments
          </h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Track chronological cash flow milestones and observe how upcoming obligations impact future balances.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-xs font-semibold shadow-soft flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Financial Obligation</span>
        </button>
      </div>

      {/* Interactive Timeline Progression */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 sm:p-8 shadow-card">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-charcoal-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
              Chronological Balance Projection
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Strictly non-overlapping calculations. Emergency Reserve: ₹{reserve.toLocaleString('en-IN')} • Remaining Savings Target: ₹{(timelineData?.remainingSavingsTarget || 0).toLocaleString('en-IN')}.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-sage-50 text-sage-700 border border-sage-200/70">
            Final Projected: ₹{(timelineData?.finalProjectedBalance || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-charcoal-400 py-8 text-center">Loading timeline milestones...</p>
        ) : timeline.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-8 text-center">No timeline milestones yet.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-charcoal-200">
            {timeline.map((event, idx) => {
              const isInitial = event.type === 'initial';
              const isIncome = event.isIncome;
              return (
                <div key={event.id || idx} className="relative flex items-start gap-4">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-soft ${
                      isInitial
                        ? 'bg-charcoal-900 text-white'
                        : isIncome
                        ? 'bg-emerald-500 text-white'
                        : event.isBelowReserve
                        ? 'bg-rose-500 text-white'
                        : event.isBelowSavingsTarget
                        ? 'bg-amber-500 text-white'
                        : 'bg-lavender-500 text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Event Card */}
                  <div
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      event.isBelowReserve
                        ? 'bg-rose-50/50 border-rose-200'
                        : event.isBelowSavingsTarget
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-surface hover:bg-charcoal-50/50 border-charcoal-200/80 shadow-soft'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-charcoal-900">
                            {event.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isInitial
                                ? 'bg-charcoal-100 text-charcoal-700'
                                : isIncome
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isInitial
                              ? 'Verified'
                              : isIncome
                              ? `+₹${event.amount.toLocaleString('en-IN')}`
                              : `-₹${event.amount.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal-500 mt-1">
                          {event.description} •{' '}
                          {new Date(event.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>

                      {/* Projected Balance Pillar */}
                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-charcoal-400 block">
                          Projected Balance
                        </span>
                        <span
                          className={`text-sm font-extrabold ${
                            event.isBelowReserve
                              ? 'text-rose-600'
                              : event.isBelowSavingsTarget
                              ? 'text-amber-600'
                              : 'text-charcoal-900'
                          }`}
                        >
                          ₹{event.projectedBalance?.toLocaleString('en-IN')}
                        </span>
                        {event.isBelowReserve ? (
                          <span className="text-[10px] text-rose-600 font-semibold flex items-center sm:justify-end gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Breaches Reserve</span>
                          </span>
                        ) : event.isBelowSavingsTarget ? (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center sm:justify-end gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Dips into Savings Goal</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Obligations Management List */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-charcoal-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
            Registered Obligations & College Fees
          </h3>
          <span className="text-xs text-charcoal-500">
            {obligations.length} total obligations
          </span>
        </div>

        {obligations.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-6 text-center">
            No obligations recorded. Click "Add Financial Obligation" to schedule college fees, rent, or EMIs.
          </p>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {obligations.map((ob) => (
              <div key={ob._id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(ob)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      ob.status === 'paid'
                        ? 'bg-sage-600 border-sage-600 text-white'
                        : 'border-charcoal-300 hover:border-charcoal-500'
                    }`}
                  >
                    {ob.status === 'paid' && <CheckCircle className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <p className={`font-bold text-charcoal-900 ${ob.status === 'paid' ? 'line-through text-charcoal-400' : ''}`}>
                      {ob.title}
                    </p>
                    <p className="text-[11px] text-charcoal-500">
                      Due {new Date(ob.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {ob.obligationType.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-charcoal-900 text-sm">
                    ₹{ob.amount?.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleDelete(ob._id)}
                    className="p-1 text-charcoal-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-charcoal-200 p-6 max-w-md w-full shadow-elevated">
            <h3 className="text-base font-bold text-charcoal-900 mb-4">
              Add Financial Obligation
            </h3>
            <form onSubmit={handleCreateObligation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Obligation Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semester Exam Fee"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                    Type
                  </label>
                  <select
                    value={obligationType}
                    onChange={(e) => setObligationType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                  >
                    <option value="college_fee">College Fee</option>
                    <option value="rent">Rent / Hostel</option>
                    <option value="loan_or_emi">Loan / EMI</option>
                    <option value="subscription">Subscription</option>
                    <option value="utility">Utility / WiFi</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Due before hall ticket distribution"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-charcoal-600 hover:bg-charcoal-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-sage-600 hover:bg-sage-700 text-white rounded-xl shadow-soft"
                >
                  {submitting ? 'Saving...' : 'Add Obligation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

