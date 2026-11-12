import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { AdminShell } from '@/components/admin';
import { getOptionalSessionUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Console',
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSessionUser();

  if (!session || !session.user) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16 space-y-4 text-center">
        <h1 className="type-page-title text-[var(--dmc-ink-primary)]">Administrator Sign-In Required</h1>
        <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
          Sign in with an authorized administrator account to access the private console.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/api/auth/oauth?provider=google&next=/admin"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-[var(--dmc-radius-button)] bg-[var(--dmc-brand-forest)] text-white text-sm font-semibold"
          >
            Continue with Google
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] text-sm font-semibold"
          >
            Return Home
          </Link>
        </div>
      </section>
    );
  }

  if (!session.isAdmin) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16 space-y-4 text-center">
        <h1 className="type-page-title text-[var(--dmc-status-error-ink)]">Access Restricted</h1>
        <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
          This workspace is limited to allow-listed site administrators.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-[var(--dmc-radius-button)] bg-[var(--dmc-brand-forest)] text-white text-sm font-semibold"
        >
          Return Home
        </Link>
      </section>
    );
  }

  return <AdminShell adminEmail={session.email ?? ''}>{children}</AdminShell>;
}

