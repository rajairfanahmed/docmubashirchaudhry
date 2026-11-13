'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
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
  user: null,
  providers: {
    email: true,
    google: true
  }
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();
  const [serverSession, setServerSession] = useState<AuthSessionState | null>(null);

  const refreshSession = useCallback(async (signal?: AbortSignal) => {
    try {
      const nextSession = await v3Api.auth.getSession(signal);
      setServerSession(nextSession);
      return nextSession;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && user?.id) {
      const controller = new AbortController();
      void refreshSession(controller.signal);
      return () => controller.abort();
    } else {
      setServerSession(null);
    }
  }, [isSignedIn, user?.id, refreshSession]);

  const logout = useCallback(async () => {
    try {
      await clerk.signOut();
    } catch {
      // Continue cleanup
    } finally {
      setServerSession(null);
    }
  }, [clerk]);

  const setAuthenticatedUser = useCallback((authedUser: AuthUser | null) => {
    if (authedUser) {
      setServerSession({
        configured: true,
        authenticated: true,
        user: authedUser,
        providers: { email: true, google: true }
      });
    } else {
      setServerSession(null);
    }
  }, []);

  const session: AuthSessionState = useMemo(() => {
    if (!isLoaded) {
      return DEFAULT_SESSION_STATE;
    }
    if (!isSignedIn || !user) {
      return {
        configured: true,
        authenticated: false,
        user: null,
        providers: {
          email: true,
          google: true
        }
      };
    }

    const primaryEmail =
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? '';
    const email = primaryEmail.trim().toLowerCase();
    const displayName =
      user.fullName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      (email ? email.split('@')[0] : null);

    const isGoogle = user.externalAccounts?.some((acc) =>
      acc.provider?.toLowerCase().includes('google')
    );

    const isAdmin =
      serverSession?.user?.id === user.id ? Boolean(serverSession.user.isAdmin) : false;

    return {
      configured: true,
      authenticated: true,
      providers: {
        email: true,
        google: true
      },
      user: {
        id: user.id,
        email,
        displayName: displayName || null,
        authProvider: isGoogle ? 'google' : 'email',
        isAdmin
      }
    };
  }, [isLoaded, isSignedIn, user, serverSession]);

  const status: AuthStatus = isLoaded ? 'ready' : 'loading';

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
