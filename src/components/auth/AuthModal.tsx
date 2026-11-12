'use client';

import React, { useEffect, useId, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, MailCheck, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldWrapper, TextInput } from '@/components/ui/FormPrimitives';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import type { AuthModalMode } from '@/components/auth/AuthModalProvider';
import { buildGoogleOAuthUrl, isV3ClientError, v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

export interface AuthModalProps {
  isOpen: boolean;
  reasonTitle?: string;
  reasonDescription?: string;
  nextUrl: string;
  initialMode?: AuthModalMode;
  initialError?: string | null;
  onSuccessResume: () => Promise<void> | void;
  onClose: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleMarkSvg() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.08.72-2.46 1.15-4.23 1.15-3.25 0-6.01-2.2-7-5.16H1.01v3.14C3.05 21.2 7.21 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5 13.98a7.17 7.17 0 0 1 0-3.96V6.88H1.01a11.98 11.98 0 0 0 0 10.24L5 13.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.79 0 3.4.62 4.67 1.83l3.5-3.5C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.8 1.01 6.88l3.99 3.14c.99-2.96 3.75-5.27 7-5.27Z"
      />
    </svg>
  );
}

export function AuthModal({
  isOpen,
  reasonTitle = 'Sign in to continue',
  reasonDescription = 'Sign in with a free student account to take graded quizzes and download watermarked PDFs.',
  nextUrl,
  initialMode = 'login',
  initialError = null,
  onSuccessResume,
  onClose
}: AuthModalProps) {
  const { session, setAuthenticatedUser, refreshSession } = useAuthSession();
  const { showToast } = useToast();
  const baseId = useId();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [verificationEmailSentTo, setVerificationEmailSentTo] = useState<string | null>(null);
  const [resetEmailSentTo, setResetEmailSentTo] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(initialError ?? null);
  const [formErrorCode, setFormErrorCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setVerificationEmailSentTo(null);
      setResetEmailSentTo(null);
      setResendMessage(null);
      setFormError(initialError ?? null);
      setFormErrorCode(null);
      setFieldErrors({});
      setShowPassword(false);
    }
  }, [isOpen, initialMode, initialError]);

  const validateFields = (): boolean => {
    const nextErrors: { displayName?: string; email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (mode === 'signup' && trimmedName.length > 0 && trimmedName.length < 2) {
      nextErrors.displayName = 'Display name must be at least 2 characters.';
    }
    if (mode !== 'reset' && (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail))) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (mode === 'login' && !password) {
      nextErrors.password = 'Password is required.';
    } else if ((mode === 'signup' || mode === 'reset') && password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleModeSwitch = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    setVerificationEmailSentTo(null);
    setResetEmailSentTo(null);
    setResendMessage(null);
    setFormError(null);
    setFormErrorCode(null);
    setFieldErrors({});
  };

  const applyServerValidationDetails = (details: unknown) => {
    if (!Array.isArray(details)) return;
    const nextFieldErrors: { displayName?: string; email?: string; password?: string } = {};
    for (const item of details) {
      const path = (item as { path?: unknown })?.path;
      const msg = (item as { message?: unknown })?.message;
      if (typeof msg !== 'string') continue;
      if (path === 'displayName') nextFieldErrors.displayName = msg;
      if (path === 'email') nextFieldErrors.email = msg;
      if (path === 'password') nextFieldErrors.password = msg;
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
    }
  };

  const handleResendVerification = async (targetEmail?: string) => {
    const cleanEmail = (targetEmail ?? email).trim();
    if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Enter a valid email address first.' }));
      return;
    }

    setIsResending(true);
    setResendMessage(null);
    try {
      const res = await v3Api.auth.resendVerification({
        email: cleanEmail,
        next: nextUrl
      });
      setResendMessage(res.message);
      setVerificationEmailSentTo(cleanEmail);
      setFormError(null);
      setFormErrorCode(null);
      showToast({
        title: 'Verification email sent',
        description: res.message,
        tone: 'info'
      });
    } catch (error) {
      const msg = isV3ClientError(error)
        ? error.message
        : 'Unable to resend verification email right now.';
      setFormError(msg);
      setResendMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormErrorCode(null);
    setResendMessage(null);

    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'forgot') {
        const res = await v3Api.auth.forgotPassword({
          email: email.trim(),
          next: nextUrl
        });
        setResetEmailSentTo(email.trim());
        showToast({
          title: 'Reset email requested',
          description: res.message,
          tone: 'info'
        });
        return;
      }

      if (mode === 'reset') {
        const res = await v3Api.auth.updatePassword({ password });
        await refreshSession();
        showToast({
          title: 'Password updated',
          description: res.message,
          tone: 'success'
        });
        await onSuccessResume();
        return;
      }

      if (mode === 'login') {
        const res = await v3Api.auth.login({
          email: email.trim(),
          password
        });
        setAuthenticatedUser(res.user);
        showToast({
          title: 'Signed in cleanly',
          description: `Welcome back, ${res.user.displayName || res.user.email}.`,
          tone: 'success'
        });
        await onSuccessResume();
        return;
      }

      const res = await v3Api.auth.signup({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
        next: nextUrl
      });

      if (res.requiresEmailVerification || !res.user) {
        setVerificationEmailSentTo(email.trim());
        showToast({
          title: 'Verification email sent',
          description: 'Please confirm your inbox link to finish activating your account.',
          tone: 'info'
        });
        return;
      }

      setAuthenticatedUser(res.user);
      showToast({
        title: 'Account created',
        description: `Welcome, ${res.user.displayName || res.user.email}.`,
        tone: 'success'
      });
      await onSuccessResume();
    } catch (error) {
      if (isV3ClientError(error)) {
        setFormError(error.message);
        setFormErrorCode(error.code);
        applyServerValidationDetails(error.details);
      } else {
        setFormError('Unable to complete request right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleHref = buildGoogleOAuthUrl(nextUrl);
  const isGoogleDisabled = session.providers?.google === false;

  const modalTitle =
    mode === 'forgot'
      ? 'Reset Your Password'
      : mode === 'reset'
      ? 'Set a New Password'
      : reasonTitle;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      labelledBy={`${baseId}-heading`}
      className="max-w-md"
    >
      {verificationEmailSentTo ? (
        <div className="text-center space-y-5 py-2">
          <div className="w-14 h-14 rounded-2xl mx-auto bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-brand-deep)] flex items-center justify-center">
            <MailCheck className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="type-card-title text-[var(--dmc-ink-primary)]">Check your inbox</h3>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              We sent a verification link to{' '}
              <span className="font-bold text-[var(--dmc-ink-primary)]">
                {verificationEmailSentTo}
              </span>
              . Open that link in this browser to verify your email and sign in automatically.
            </p>
          </div>

          {resendMessage && (
            <p
              role="status"
              className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--dmc-ink-secondary)]"
            >
              {resendMessage}
            </p>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              variant="secondary"
              className="w-full"
              isLoading={isResending}
              onClick={() => void handleResendVerification(verificationEmailSentTo)}
            >
              Resend Verification Email
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleModeSwitch('login')}
            >
              Back to Sign In
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : resetEmailSentTo ? (
        <div className="text-center space-y-5 py-2">
          <div className="w-14 h-14 rounded-2xl mx-auto bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-brand-deep)] flex items-center justify-center">
            <KeyRound className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="type-card-title text-[var(--dmc-ink-primary)]">Check your email</h3>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              If an account exists for{' '}
              <span className="font-bold text-[var(--dmc-ink-primary)]">{resetEmailSentTo}</span>, we
              sent a password reset link. Open it in this browser to choose a new password.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleModeSwitch('login')}
            >
              Back to Sign In
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Scoped Reason Notice */}
          <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-ink-secondary)]">
            <Lock
              className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="leading-snug">
              {mode === 'forgot'
                ? 'Enter your account email and we will send you a password recovery link.'
                : mode === 'reset'
                ? 'Enter a new password of at least 8 characters to finish resetting your account.'
                : reasonDescription}
            </p>
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <>
              {/* Primary OAuth Action */}
              {isGoogleDisabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormError(
                      'Google Sign-In is not enabled in Supabase yet. Sign in or create an account with your email below.'
                    );
                    setFormErrorCode('PROVIDER_DISABLED');
                  }}
                  className="inline-flex w-full items-center justify-between gap-2.5 min-h-[44px] px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-ink-secondary)] hover:border-[var(--color-border-strong)]"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <GoogleMarkSvg />
                    <span>Continue with Google</span>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                    Not enabled
                  </span>
                </button>
              ) : (
                <a
                  href={googleHref}
                  className="dmc-press inline-flex w-full items-center justify-center gap-2.5 min-h-[44px] px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] border border-[var(--color-border-strong)] text-sm font-semibold text-[var(--color-ink)] shadow-xs"
                >
                  <GoogleMarkSvg />
                  <span>Continue with Google</span>
                </a>
              )}

              {/* Hairline Divider */}
              <div className="relative flex items-center justify-center" aria-hidden="true">
                <div className="border-t border-[var(--color-border)] w-full" />
                <span className="bg-[var(--color-surface)] px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] shrink-0">
                  or continue with email
                </span>
              </div>

              {/* Mode Switcher Tabs */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 p-1 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  tabIndex={mode === 'login' ? 0 : -1}
                  onClick={() => handleModeSwitch('login')}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'End') {
                      e.preventDefault();
                      handleModeSwitch('signup');
                      (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.focus();
                    }
                  }}
                  className={cn(
                    'min-h-[38px] rounded-lg text-xs sm:text-sm font-bold transition-colors',
                    mode === 'login'
                      ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                      : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  tabIndex={mode === 'signup' ? 0 : -1}
                  onClick={() => handleModeSwitch('signup')}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'Home') {
                      e.preventDefault();
                      handleModeSwitch('login');
                      (e.currentTarget.previousElementSibling as HTMLButtonElement | null)?.focus();
                    }
                  }}
                  className={cn(
                    'min-h-[38px] rounded-lg text-xs sm:text-sm font-bold transition-colors',
                    mode === 'signup'
                      ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs'
                      : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                  )}
                >
                  Create Account
                </button>
              </div>
            </>
          )}

          {formError && (
            <div
              role="alert"
              className="rounded-[var(--radius-control)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[var(--color-danger-ink)] space-y-2"
            >
              <p>{formError}</p>
              {formErrorCode === 'ACCOUNT_ALREADY_EXISTS' && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="text-xs font-bold underline underline-offset-2 hover:opacity-80"
                >
                  Switch to Sign In with {email.trim() || 'this email'}
                </button>
              )}
              {formErrorCode === 'EMAIL_NOT_CONFIRMED' && (
                <button
                  type="button"
                  disabled={isResending}
                  onClick={() => void handleResendVerification(email)}
                  className="text-xs font-bold underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
                >
                  {isResending ? 'Sending verification link...' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}

          {/* Email / Password / Recovery Form */}
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            {mode === 'signup' && (
              <FieldWrapper
                id={`${baseId}-name`}
                label="Display Name"
                optionalLabel="Recommended"
                error={fieldErrors.displayName}
              >
                <TextInput
                  id={`${baseId}-name`}
                  type="text"
                  autoComplete="name"
                  placeholder="e.g., Ayesha Khan"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  hasError={Boolean(fieldErrors.displayName)}
                  aria-describedby={fieldErrors.displayName ? `${baseId}-name-error` : undefined}
                />
              </FieldWrapper>
            )}

            {mode !== 'reset' && (
              <FieldWrapper
                id={`${baseId}-email`}
                label="Email Address"
                required
                error={fieldErrors.email}
              >
                <TextInput
                  id={`${baseId}-email`}
                  type="email"
                  autoComplete="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  hasError={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? `${baseId}-email-error` : undefined}
                />
              </FieldWrapper>
            )}

            {mode !== 'forgot' && (
              <FieldWrapper
                id={`${baseId}-password`}
                label={mode === 'reset' ? 'New Password' : 'Password'}
                required
                helperText={
                  mode === 'signup' || mode === 'reset'
                    ? 'Minimum 8 characters required.'
                    : undefined
                }
                error={fieldErrors.password}
              >
                <div className="space-y-1.5">
                  <div className="relative">
                    <TextInput
                      id={`${baseId}-password`}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        mode === 'login' ? 'current-password' : 'new-password'
                      }
                      placeholder={
                        mode === 'signup' || mode === 'reset'
                          ? 'At least 8 characters'
                          : 'Enter your password'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      hasError={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password
                          ? `${baseId}-password-error`
                          : mode === 'signup' || mode === 'reset'
                          ? `${baseId}-password-hint`
                          : undefined
                      }
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg inline-flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleModeSwitch('forgot')}
                        className="text-xs font-semibold text-[var(--color-brand-deep)] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              </FieldWrapper>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full"
            >
              {mode === 'login'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Account'
                : mode === 'forgot'
                ? 'Send Password Reset Link'
                : 'Save New Password'}
            </Button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back to Sign In</span>
              </button>
            )}
          </form>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--dmc-ink-muted)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brand-deep)]" aria-hidden="true" />
            <span>Session secured via httpOnly cookies. Zero ads or spam.</span>
          </p>
        </div>
      )}
    </Modal>
  );
}
