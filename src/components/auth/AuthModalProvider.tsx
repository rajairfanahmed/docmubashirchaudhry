'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { sanitizeClientNextPath } from '@/lib/v3/client';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { useToast } from '@/components/ui/ToastProvider';

const LazyAuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

export type AuthModalMode = 'login' | 'signup' | 'forgot' | 'reset';

export interface AuthPromptRequest {
  title?: string;
  description?: string;
  nextUrl?: string;
  initialMode?: AuthModalMode;
  initialError?: string | null;
  onAuthenticated?: () => void | Promise<void>;
}

function resolveFriendlyAuthError(rawCode: string): string {
  if (rawCode === 'backend_not_configured') {
    return 'Authentication service is not configured for this environment.';
  }
  if (rawCode === 'google_provider_disabled') {
    return 'Google Sign-In is not enabled in Supabase yet. Sign in or create an account with your email below.';
  }
  return rawCode;
}

interface AuthModalContextValue {
  isOpen: boolean;
  request: AuthPromptRequest | null;
  openAuthModal: (request?: AuthPromptRequest) => void;
  closeAuthModal: () => void;
  completeAuthAction: () => Promise<void>;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { refreshSession } = useAuthSession();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoadedModal, setHasLoadedModal] = useState(false);
  const [request, setRequest] = useState<AuthPromptRequest | null>(null);
  const resumeCallbackRef = useRef<(() => void | Promise<void>) | undefined>(undefined);
  const openAuthModal = useCallback((nextRequest: AuthPromptRequest = {}) => {
    setHasLoadedModal(true);
    resumeCallbackRef.current = nextRequest.onAuthenticated;
    setRequest({
      title: nextRequest.title ?? 'Sign in to continue',
      description:
        nextRequest.description ??
        'Sign in with a free account to download PDF booklets and save quiz attempts.',
      nextUrl: sanitizeClientNextPath(
        nextRequest.nextUrl ??
          (typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/')
      ),
      initialMode: nextRequest.initialMode ?? 'login',
      initialError: nextRequest.initialError ?? null
    });
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);

    const authRequired = url.searchParams.get('auth') === 'required';
    const nextParam = url.searchParams.get('next');
    const authError = url.searchParams.get('authError');
    const authConfirmed = url.searchParams.get('authConfirmed') === '1';
    const authReset = url.searchParams.get('authReset') === '1';

    if (!authRequired && !authError && !authConfirmed && !authReset) return;

    if (authConfirmed) {
      void refreshSession();
      router.refresh();
      showToast({
        title: 'Email confirmed & signed in',
        description:
          'Your account is active. You can now attempt graded quizzes and download PDFs.',
        tone: 'success'
      });
    }

    if (authReset) {
      void refreshSession();
      openAuthModal({
        title: 'Set a New Password',
        description: 'Choose a new password of at least 8 characters for your account.',
        nextUrl: sanitizeClientNextPath(nextParam ?? url.pathname),
        initialMode: 'reset'
      });
    } else if (authError || authRequired) {
      const safeNext = sanitizeClientNextPath(nextParam ?? url.pathname);
      const isAdminTarget = safeNext === '/admin' || safeNext.startsWith('/admin/');
      const friendlyError = authError ? resolveFriendlyAuthError(authError) : null;

      if (friendlyError) {
        showToast({
          title: 'Authentication notice',
          description: friendlyError,
          tone: 'warning'
        });
      }

      openAuthModal({
        title: isAdminTarget ? 'Administrator Sign-In Required' : 'Sign in to continue',
        description: isAdminTarget
          ? 'Sign in with an allow-listed administrator account to open the Admin Console.'
          : 'Sign in or create a free account to continue.',
        nextUrl: safeNext,
        initialMode: 'login',
        initialError: friendlyError,
        onAuthenticated: authRequired
          ? () => {
              router.push(safeNext);
              router.refresh();
            }
          : undefined
      });
    }

    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    url.searchParams.delete('authError');
    url.searchParams.delete('authConfirmed');
    url.searchParams.delete('authReset');
    const cleanTarget = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', cleanTarget);
  }, [pathname, openAuthModal, refreshSession, router, showToast]);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    resumeCallbackRef.current = undefined;
  }, []);

  const completeAuthAction = useCallback(async () => {
    const callback = resumeCallbackRef.current;
    resumeCallbackRef.current = undefined;
    setIsOpen(false);
    if (callback) {
      await callback();
    }
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        request,
        openAuthModal,
        closeAuthModal,
        completeAuthAction
      }}
    >
      {children}

      {hasLoadedModal && (
        <LazyAuthModal
          isOpen={isOpen}
          reasonTitle={request?.title}
          reasonDescription={request?.description}
          nextUrl={request?.nextUrl ?? '/'}
          initialMode={request?.initialMode ?? 'login'}
          initialError={request?.initialError ?? null}
          onSuccessResume={completeAuthAction}
          onClose={closeAuthModal}
        />
      )}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used inside AuthModalProvider.');
  }
  return ctx;
}
