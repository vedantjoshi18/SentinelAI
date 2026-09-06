import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sentinelai_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sentinelai_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi
        .getMe()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('sentinelai_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const saveSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sentinelai_token', newToken);
    localStorage.setItem('sentinelai_user', JSON.stringify(newUser));
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.token) {
      saveSession(res.token, res.user);
      return res;
    }
    throw new Error(res.error || 'Authentication failed');
  };

  const register = async (name, email, password, role = 'ANALYST') => {
    const res = await authApi.register({ name, email, password, role });
    if (res.success && res.token) {
      saveSession(res.token, res.user);
      return res;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sentinelai_token');
    localStorage.removeItem('sentinelai_user');
  };

  const loginAsDemoAnalyst = async () => {
    const email = 'demo.analyst@sentinelai.local';
    const password = 'AnalystPassword123!';
    try {
      // Try login first
      return await login(email, password);
    } catch (err) {
      // If user doesn't exist, register
      return await register('Demo SOC Analyst', email, password, 'ANALYST');
    }
  };

  const isAnalystOrAdmin = Boolean(
    user && (user.role === 'ANALYST' || user.role === 'ADMIN')
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token),
        isAnalystOrAdmin,
        login,
        register,
        logout,
        loginAsDemoAnalyst,
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
