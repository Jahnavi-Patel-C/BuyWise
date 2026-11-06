import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import PurchaseAnalyzer from './pages/PurchaseAnalyzer';
import DailySpending from './pages/DailySpending';
import TimelinePage from './pages/TimelinePage';
import SimulatorPage from './pages/SimulatorPage';
import InsightsPage from './pages/InsightsPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Login';
import Register from './pages/Register';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-sage-500 animate-pulse flex items-center justify-center text-white font-extrabold text-sm shadow-card">
          BW
        </div>
        <p className="mt-3 text-xs font-semibold text-charcoal-500">
          Loading BuyWise Decision Engine...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home onNavigate={setCurrentTab} />;
      case 'analyzer':
        return <PurchaseAnalyzer onNavigate={setCurrentTab} />;
      case 'daily':
        return <DailySpending />;
      case 'timeline':
        return <TimelinePage />;
      case 'simulator':
        return <SimulatorPage />;
      case 'insights':
        return <InsightsPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Home onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex text-charcoal-800">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onQuickAnalyze={() => setCurrentTab('analyzer')} />
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

