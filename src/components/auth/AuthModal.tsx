'use client';

import React, { useEffect, useId, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, MailCheck, ShieldCheck } from 'lucide-react';
import { useSignIn, useSignUp } from '@clerk/nextjs/legacy';
import { useClerk } from '@clerk/nextjs';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldWrapper, TextInput } from '@/components/ui/FormPrimitives';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import type { AuthModalMode } from '@/components/auth/AuthModalProvider';
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

function extractClerkErrorMessage(err: unknown): { message: string; code?: string } {
  if (err && typeof err === 'object') {
    const clerkErr = err as {
      errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
      message?: string;
    };

    if (Array.isArray(clerkErr.errors) && clerkErr.errors.length > 0) {
      const first = clerkErr.errors[0];
      const code = first.code ?? '';

      if (code === 'form_identifier_exists') {
        return {
          code: 'ACCOUNT_ALREADY_EXISTS',
          message: 'An account with this email is already created. Please sign in instead.'
        };
      }
      if (code === 'form_password_pwned') {
        return {
          code,
          message: 'This password has been flagged in security breaches. Please choose a different, secure password.'
        };
      }
      if (code === 'form_password_length_too_short') {
        return {
          code,
          message: 'Password must be at least 8 characters long.'
        };
      }
      if (code === 'form_code_incorrect') {
        return {
          code,
          message: 'The verification code entered is incorrect. Please check your inbox and try again.'
        };
      }
      if (code === 'verification_expired') {
        return {
          code,
          message: 'This verification code has expired. Please request a new code.'
        };
      }
      if (code === 'form_identifier_not_found') {
        return {
          code,
          message: 'No account found with this email address. Please check your spelling or create an account.'
        };
      }
      if (code === 'strategy_for_user_invalid') {
        return {
          code,
          message: 'Incorrect email or password. Please try again.'
        };
      }

      return {
        code,
        message: first.longMessage || first.message || 'Unable to complete request right now.'
      };
    }

    if (typeof clerkErr.message === 'string' && clerkErr.message) {
      return { message: clerkErr.message };
    }
  }

  return { message: 'Unable to complete request right now. Please try again.' };
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
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const clerk = useClerk();
  const { refreshSession } = useAuthSession();
  const { showToast } = useToast();
  const baseId = useId();

  const [mode, setMode] = useState<AuthModalMode | 'verify'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [pendingResetEmail, setPendingResetEmail] = useState<string | null>(null);

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
    code?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setPendingVerificationEmail(null);
      setPendingResetEmail(null);
      setVerificationCode('');
      setResetCode('');
      setNewPassword('');
      setResendMessage(null);
      setFormError(initialError ?? null);
      setFormErrorCode(null);
      setFieldErrors({});
      setShowPassword(false);
    }
  }, [isOpen, initialMode, initialError]);

  const handleModeSwitch = (nextMode: AuthModalMode | 'verify') => {
    setMode(nextMode);
    setResendMessage(null);
    setFormError(null);
    setFormErrorCode(null);
    setFieldErrors({});
  };

  const validateFields = (): boolean => {
    const nextErrors: { displayName?: string; email?: string; password?: string; code?: string } = {};
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (mode === 'signup' && trimmedName.length > 0 && trimmedName.length < 2) {
      nextErrors.displayName = 'Display name must be at least 2 characters.';
    }
    if ((mode === 'login' || mode === 'signup' || mode === 'forgot') && (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail))) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (mode === 'login' && !password) {
      nextErrors.password = 'Password is required.';
    } else if (mode === 'signup' && password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (mode === 'verify' && !verificationCode.trim()) {
      nextErrors.code = 'Please enter the 6-digit verification code.';
    }
    if (mode === 'reset') {
      if (!resetCode.trim()) {
        nextErrors.code = 'Reset code is required.';
      }
      if (newPassword.length < 8) {
        nextErrors.password = 'New password must be at least 8 characters.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    if (!isSignInLoaded || !signIn) return;
    setIsSubmitting(true);
    setFormError(null);
    setFormErrorCode(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: nextUrl || '/'
      });
    } catch (err) {
      const { message, code } = extractClerkErrorMessage(err);
      setFormError(message);
      setFormErrorCode(code ?? null);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isSignUpLoaded || !signUp) return;
    setIsSubmitting(true);
    setFormError(null);
    setFormErrorCode(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: nextUrl || '/'
      });
    } catch (err) {
      const { message, code } = extractClerkErrorMessage(err);
      setFormError(message);
      setFormErrorCode(code ?? null);
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!isSignUpLoaded || !signUp) return;
    setIsResending(true);
    setResendMessage(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      const msg = 'A fresh verification code has been sent to your email.';
      setResendMessage(msg);
      showToast({
        title: 'Code resent',
        description: msg,
        tone: 'info'
      });
    } catch (err) {
      const { message } = extractClerkErrorMessage(err);
      setResendMessage(message);
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
      // Flow 1: Login
      if (mode === 'login') {
        if (!isSignInLoaded || !signIn) return;
        const result = await signIn.create({
          identifier: email.trim(),
          password
        });

        if (result.status === 'complete') {
          if (setSignInActive) {
            await setSignInActive({ session: result.createdSessionId });
          }
          await refreshSession();
          showToast({
            title: 'Signed in cleanly',
            description: `Welcome back, ${email.trim()}.`,
            tone: 'success'
          });
          await onSuccessResume();
          return;
        }

        if (result.status === 'needs_first_factor') {
          setFormError('Additional authentication factor required.');
          return;
        }

        setFormError('Authentication could not be completed. Please try again.');
        return;
      }

      // Flow 2: Signup
      if (mode === 'signup') {
        if (!isSignUpLoaded || !signUp) return;
        await signUp.create({
          emailAddress: email.trim(),
          password,
          firstName: displayName.trim() || undefined
        });

        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code'
        });

        setPendingVerificationEmail(email.trim());
        setVerificationCode('');
        setMode('verify');
        showToast({
          title: 'Verification code sent',
          description: `We sent a 6-digit code to ${email.trim()}.`,
          tone: 'info'
        });
        return;
      }

      // Flow 3: Verify Email Code
      if (mode === 'verify') {
        if (!isSignUpLoaded || !signUp) return;
        const result = await signUp.attemptEmailAddressVerification({
          code: verificationCode.trim()
        });

        if (result.status === 'complete') {
          if (setSignUpActive) {
            await setSignUpActive({ session: result.createdSessionId });
          }
          await refreshSession();
          showToast({
            title: 'Account created',
            description: `Welcome, ${displayName.trim() || pendingVerificationEmail || email.trim()}.`,
            tone: 'success'
          });
          await onSuccessResume();
          return;
        }

        setFormError('Verification could not be completed. Please check your code.');
        return;
      }

      // Flow 4: Forgot Password Request
      if (mode === 'forgot') {
        if (!isSignInLoaded || !signIn) return;
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: email.trim()
        });

        setPendingResetEmail(email.trim());
        setResetCode('');
        setNewPassword('');
        setMode('reset');
        showToast({
          title: 'Reset code sent',
          description: `Enter the code sent to ${email.trim()} to choose a new password.`,
          tone: 'info'
        });
        return;
      }

      // Flow 5: Reset Password with Code
      if (mode === 'reset') {
        if (!isSignInLoaded || !signIn) return;
        const result = await signIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: resetCode.trim(),
          password: newPassword
        });

        if (result.status === 'complete') {
          if (setSignInActive) {
            await setSignInActive({ session: result.createdSessionId });
          }
          await refreshSession();
          showToast({
            title: 'Password updated',
            description: 'Your password has been reset successfully.',
            tone: 'success'
          });
          await onSuccessResume();
          return;
        }

        setFormError('Password reset could not be completed. Please check your code and try again.');
      }
    } catch (err) {
      const { message, code } = extractClerkErrorMessage(err);
      setFormError(message);
      setFormErrorCode(code ?? null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle =
    mode === 'verify'
      ? 'Verify Your Email'
      : mode === 'forgot'
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
      {mode === 'verify' ? (
        <div className="text-center space-y-5 py-2">
          <div className="w-14 h-14 rounded-2xl mx-auto bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-brand-deep)] flex items-center justify-center">
            <MailCheck className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="type-card-title text-[var(--dmc-ink-primary)]">Check your inbox</h3>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              We sent a 6-digit verification code to{' '}
              <span className="font-bold text-[var(--dmc-ink-primary)]">
                {pendingVerificationEmail || email}
              </span>
              . Enter it below to activate your account.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-[var(--radius-control)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[var(--color-danger-ink)]"
            >
              <p>{formError}</p>
            </div>
          )}

          {resendMessage && (
            <p
              role="status"
              className="rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--dmc-ink-secondary)]"
            >
              {resendMessage}
            </p>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4 text-left">
            <FieldWrapper
              id={`${baseId}-code`}
              label="Verification Code"
              required
              error={fieldErrors.code}
            >
              <TextInput
                id={`${baseId}-code`}
                type="text"
                autoComplete="one-time-code"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                hasError={Boolean(fieldErrors.code)}
                aria-describedby={fieldErrors.code ? `${baseId}-code-error` : undefined}
                className="text-center tracking-widest text-lg font-bold"
              />
            </FieldWrapper>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full"
            >
              Verify & Complete Sign In
            </Button>
          </form>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="secondary"
              className="w-full"
              isLoading={isResending}
              onClick={() => void handleResendCode()}
            >
              Resend Verification Code
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => handleModeSwitch('login')}
            >
              Back to Sign In
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
                ? 'Enter your account email and we will send you a verification code to reset your password.'
                : mode === 'reset'
                ? `Enter the reset code sent to ${pendingResetEmail || 'your email'} and choose a new password.`
                : reasonDescription}
            </p>
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <>
              {/* Primary OAuth Action via Clerk */}
              <button
                type="button"
                onClick={() => void (mode === 'signup' ? handleGoogleSignUp() : handleGoogleSignIn())}
                disabled={isSubmitting || !isSignInLoaded || !isSignUpLoaded}
                className="dmc-press inline-flex w-full items-center justify-center gap-2.5 min-h-[44px] px-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] border border-[var(--color-border-strong)] text-sm font-semibold text-[var(--color-ink)] shadow-xs disabled:opacity-50"
              >
                <GoogleMarkSvg />
                <span>Continue with Google</span>
              </button>

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

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
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

            {mode === 'reset' && (
              <>
                <FieldWrapper
                  id={`${baseId}-reset-code`}
                  label="Password Reset Code"
                  required
                  error={fieldErrors.code}
                >
                  <TextInput
                    id={`${baseId}-reset-code`}
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="Enter code from email"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.trim())}
                    hasError={Boolean(fieldErrors.code)}
                    aria-describedby={fieldErrors.code ? `${baseId}-reset-code-error` : undefined}
                  />
                </FieldWrapper>

                <FieldWrapper
                  id={`${baseId}-new-password`}
                  label="New Password"
                  required
                  helperText="Minimum 8 characters required."
                  error={fieldErrors.password}
                >
                  <div className="relative">
                    <TextInput
                      id={`${baseId}-new-password`}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      hasError={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password ? `${baseId}-new-password-error` : undefined
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
              </>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <FieldWrapper
                id={`${baseId}-password`}
                label="Password"
                required
                helperText={mode === 'signup' ? 'Minimum 8 characters required.' : undefined}
                error={fieldErrors.password}
              >
                <div className="space-y-1.5">
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
                ? 'Send Password Reset Code'
                : 'Save New Password'}
            </Button>

            {(mode === 'forgot' || mode === 'reset') && (
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
            <span>Session secured via Clerk authentication. Zero ads or spam.</span>
          </p>
        </div>
      )}
    </Modal>
  );
}
