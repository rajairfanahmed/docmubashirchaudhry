'use client';

import React, { useEffect, useId, useState } from 'react';
import { Eye, EyeOff, Lock, MailCheck, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldWrapper, TextInput } from '@/components/ui/FormPrimitives';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { buildGoogleOAuthUrl, isV3ClientError, v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

export interface AuthModalProps {
  isOpen: boolean;
  reasonTitle?: string;
  reasonDescription?: string;
  nextUrl: string;
  initialMode?: 'login' | 'signup';
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
  onSuccessResume,
  onClose
}: AuthModalProps) {
  const { setAuthenticatedUser } = useAuthSession();
  const { showToast } = useToast();
  const baseId = useId();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [verificationEmailSentTo, setVerificationEmailSentTo] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setVerificationEmailSentTo(null);
      setFormError(null);
      setFieldErrors({});
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  const validateFields = (): boolean => {
    const nextErrors: { displayName?: string; email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (mode === 'signup' && trimmedName.length > 0 && trimmedName.length < 2) {
      nextErrors.displayName = 'Display name must be at least 2 characters.';
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (mode === 'signup' && password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleModeSwitch = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    setVerificationEmailSentTo(null);
    setFormError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
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
      } else {
        setFormError('Unable to complete request right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleHref = buildGoogleOAuthUrl(nextUrl);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reasonTitle}
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
              . Open that link to verify your email and return cleanly to this page.
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
            <p className="leading-snug">{reasonDescription}</p>
          </div>

          {/* Primary OAuth Button */}
          <a
            href={googleHref}
            className="dmc-press inline-flex w-full items-center justify-center gap-2.5 min-h-[44px] px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] border border-[var(--color-border-strong)] text-sm font-semibold text-[var(--color-ink)] shadow-xs"
          >
            <GoogleMarkSvg />
            <span>Continue with Google</span>
          </a>

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

          {formError && (
            <div
              role="alert"
              className="rounded-[var(--radius-control)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[var(--color-danger-ink)]"
            >
              {formError}
            </div>
          )}

          {/* Email / Password Form */}
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

            <FieldWrapper
              id={`${baseId}-password`}
              label="Password"
              required
              helperText={
                mode === 'signup' ? 'Minimum 8 characters required.' : undefined
              }
              error={fieldErrors.password}
            >
              <div className="relative">
                <TextInput
                  id={`${baseId}-password`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hasError={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? `${baseId}-password-error`
                      : mode === 'signup'
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
            </FieldWrapper>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
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

