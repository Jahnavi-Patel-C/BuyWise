import React from 'react';
import {
  Home,
  ShoppingBag,
  Coffee,
  Calendar,
  Sparkles,
  PieChart,
  Receipt,
  User,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { user, profile, logout, loadDemoData } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home Overview', icon: Home },
    { id: 'analyzer', label: 'Purchase Analyzer', icon: ShoppingBag, badge: 'P0' },
    { id: 'daily', label: 'Daily Spending', icon: Coffee },
    { id: 'timeline', label: 'Financial Timeline', icon: Calendar },
    { id: 'simulator', label: 'What-If Simulator', icon: Sparkles },
    { id: 'insights', label: 'Spending Insights', icon: PieChart },
    { id: 'transactions', label: 'Transaction History', icon: Receipt },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-charcoal-200/80 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-charcoal-200/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
            BW
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-charcoal-900 leading-none">
              BuyWise
            </h1>
            <p className="text-[11px] font-medium text-charcoal-500 mt-1">
              Think before you spend.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-lavender-100/70 text-lavender-700 font-semibold shadow-soft'
                  : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-lavender-600' : 'text-charcoal-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sage-100 text-sage-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Demo Reset / Load Box */}
      <div className="p-3 mx-3 mb-3 bg-lavender-50/60 rounded-xl border border-lavender-100">
        <div className="flex items-center gap-2 text-lavender-700 text-xs font-semibold mb-1.5">
          <Zap className="w-3.5 h-3.5 text-lavender-600" />
          <span>Demo College Account</span>
        </div>
        <p className="text-[11px] text-charcoal-600 mb-2">
          Load preconfigured student allowance, fees & transactions.
        </p>
        <button
          onClick={loadDemoData}
          className="w-full py-1.5 px-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg text-xs font-medium transition-colors shadow-soft"
        >
          Reset / Load Demo Data
        </button>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-charcoal-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-sage-100 text-sage-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-charcoal-900 truncate">
              {user?.username || 'Student User'}
            </p>
            <p className="text-[10px] text-charcoal-500 truncate">
              ₹{profile?.currentBalance?.toLocaleString('en-IN') || 0} in account
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

