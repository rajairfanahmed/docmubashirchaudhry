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

export interface AuthPromptRequest {
  title?: string;
  description?: string;
  nextUrl?: string;
  initialMode?: 'login' | 'signup';
  onAuthenticated?: () => void | Promise<void>;
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
      initialMode: nextRequest.initialMode ?? 'login'
    });
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);

    // Fallback: if an email verification or OAuth callback landed on a non-callback route,
    // forward the query parameters cleanly to /api/auth/callback to exchange cookies.
    const hasCallbackCode = Boolean(url.searchParams.get('code')?.trim());
    const hasCallbackTokenHash =
      Boolean(url.searchParams.get('token_hash')?.trim()) &&
      Boolean(url.searchParams.get('type')?.trim());

    if ((hasCallbackCode || hasCallbackTokenHash) && url.pathname !== '/api/auth/callback') {
      const callbackUrl = new URL('/api/auth/callback', url.origin);
      url.searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value);
      });
      if (!callbackUrl.searchParams.has('next')) {
        callbackUrl.searchParams.set('next', url.pathname);
      }
      window.location.replace(callbackUrl.toString());
      return;
    }

    const authRequired = url.searchParams.get('auth') === 'required';
    const nextParam = url.searchParams.get('next');
    const authError = url.searchParams.get('authError');
    const authConfirmed = url.searchParams.get('authConfirmed') === '1';

    if (!authRequired && !authError && !authConfirmed) return;

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

    if (authError) {
      showToast({
        title: 'Authentication could not complete',
        description:
          authError === 'backend_not_configured'
            ? 'Backend authentication is not configured for this environment.'
            : authError,
        tone: 'warning'
      });
    }

    if (authRequired) {
      const safeNext = sanitizeClientNextPath(nextParam);
      const isAdminTarget = safeNext === '/admin' || safeNext.startsWith('/admin/');
      openAuthModal({
        title: isAdminTarget ? 'Administrator Sign-In Required' : 'Sign in to continue',
        description: isAdminTarget
          ? 'Sign in with an allow-listed administrator account to open the Admin Console.'
          : 'Sign in with your account to continue to your requested page.',
        nextUrl: safeNext,
        onAuthenticated: () => {
          router.push(safeNext);
          router.refresh();
        }
      });
    }

    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    url.searchParams.delete('authError');
    url.searchParams.delete('authConfirmed');
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
