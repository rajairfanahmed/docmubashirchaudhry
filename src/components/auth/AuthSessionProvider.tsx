'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { v3Api } from '@/lib/v3/client';
import type { AuthSessionState, AuthUser } from '@/lib/v3/types';

export type AuthStatus = 'loading' | 'ready' | 'error';

interface AuthSessionContextValue {
  session: AuthSessionState;
  status: AuthStatus;
  refreshSession: () => Promise<AuthSessionState | null>;
  logout: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser | null) => void;
}

const DEFAULT_SESSION_STATE: AuthSessionState = {
  configured: false,
  authenticated: false,
  user: null
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSessionState>(DEFAULT_SESSION_STATE);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refreshSession = useCallback(async (signal?: AbortSignal) => {
    try {
      const nextSession = await v3Api.auth.getSession(signal);
      setSession(nextSession);
      setStatus('ready');
      return nextSession;
    } catch {
      if (!signal?.aborted) {
        setStatus('error');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshSession(controller.signal);
    return () => controller.abort();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await v3Api.auth.logout();
    } finally {
      setSession((prev) => ({
        configured: prev.configured,
        authenticated: false,
        user: null
      }));
      setStatus('ready');
    }
  }, []);

  const setAuthenticatedUser = useCallback((user: AuthUser | null) => {
    setSession((prev) => ({
      configured: prev.configured || Boolean(user),
      authenticated: Boolean(user),
      user
    }));
    setStatus('ready');
  }, []);

  return (
    <AuthSessionContext.Provider
      value={{ session, status, refreshSession, logout, setAuthenticatedUser }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }
  return ctx;
}

