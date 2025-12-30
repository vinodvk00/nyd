"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getProfile, User, LoginCredentials } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TOKEN_REFRESH_INTERVAL = 13 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.ok;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);


  const startRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(async () => {
      const success = await refreshToken();
      if (!success) {
        setUser(null);
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [refreshToken]);

  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  const checkAuth = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
      startRefreshInterval();
    } catch (error) {
      const refreshed = await refreshToken();
      if (refreshed) {
        try {
          const profile = await getProfile();
          setUser(profile);
          startRefreshInterval();
        } catch {
          setUser(null);
          stopRefreshInterval();
        }
      } else {
        setUser(null);
        stopRefreshInterval();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    return () => {
      stopRefreshInterval();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiLogin(credentials);
      setUser(response.user);
      startRefreshInterval();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    stopRefreshInterval();
    setUser(null);
    await apiLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
