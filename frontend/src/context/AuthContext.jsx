import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('buywise_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success) {
            setUser(res.user);
            setProfile(res.profile);
          }
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.token) {
      localStorage.setItem('buywise_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const profRes = await api.profile.get();
      setProfile(profRes.profile);
    }
    return res;
  };

  const register = async (username, email, password) => {
    const res = await api.auth.register({ username, email, password });
    if (res.token) {
      localStorage.setItem('buywise_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const profRes = await api.profile.get();
      setProfile(profRes.profile);
    }
    return res;
  };

  const loadDemoData = async () => {
    const res = await api.auth.loadDemo();
    if (res.token) {
      localStorage.setItem('buywise_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const profRes = await api.profile.get();
      setProfile(profRes.profile);
    }
    return res;
  };

  const refreshProfile = async () => {
    try {
      const res = await api.profile.get();
      if (res.success) {
        setProfile(res.profile);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('buywise_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loadDemoData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

