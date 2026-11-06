import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, Zap, AlertCircle } from 'lucide-react';

export default function Login({ onSwitchToRegister }) {
  const { login, loadDemoData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await loadDemoData();
    } catch (err) {
      setError(err.message || 'Failed to load demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-sage-500 items-center justify-center text-white font-extrabold text-2xl shadow-card">
          BW
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-charcoal-900">
          BuyWise
        </h2>
        <p className="mt-1 text-sm font-medium text-charcoal-500">
          Think before you spend. AI-powered financial decision assistant.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 sm:px-10 rounded-2xl border border-charcoal-200/80 shadow-card">
          {/* Quick Demo Mode Banner */}
          <div className="mb-6 p-4 rounded-xl bg-lavender-50 border border-lavender-200/80">
            <div className="flex items-center gap-2 text-lavender-700 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4 text-lavender-600" />
              <span>College Evaluator Quick Access</span>
            </div>
            <p className="mt-1 text-xs text-charcoal-600">
              Instantly test with pre-seeded student allowance (₹6,000), college lab fees (₹2,500), and 30+ transactions.
            </p>
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="mt-3 w-full py-2 px-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-semibold shadow-soft flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Demo Student Workspace</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-charcoal-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-charcoal-400 font-medium">Or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                College or Personal Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal-200 text-sm focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-sm font-semibold shadow-soft flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to BuyWise'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-charcoal-500">
            Don't have an account yet?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-sage-600 font-bold hover:underline"
            >
              Create free student account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

