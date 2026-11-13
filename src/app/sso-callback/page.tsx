'use client';

import React from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function SsoCallbackPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] flex items-center justify-center mb-5 shadow-xs">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--color-brand-deep)]" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-[var(--dmc-ink-primary)] mb-2">
        Completing sign-in...
      </h1>
      <p className="text-sm text-[var(--dmc-ink-secondary)] max-w-sm mb-6 leading-relaxed">
        Please wait while we securely authenticate your account and redirect you back.
      </p>
      <p className="inline-flex items-center gap-1.5 text-xs text-[var(--dmc-ink-muted)]">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brand-deep)]" aria-hidden="true" />
        <span>Secure authentication handoff</span>
      </p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}

