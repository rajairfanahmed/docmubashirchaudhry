import React from 'react';
import type { Metadata } from 'next';
import { AdminReportsClient } from '@/components/admin/AdminReportsClient';

export const metadata: Metadata = {
  title: 'Question Reports Moderation',
  robots: { index: false, follow: false }
};

export default function AdminReportsPage() {
  return (
    <section aria-labelledby="admin-reports-heading" className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <span className="type-label-micro text-[var(--color-brand-deep)]">
          Quality Control &amp; Errata
        </span>
        <h1 id="admin-reports-heading" className="type-page-title text-[var(--color-ink)]">
          Question Error Reports
        </h1>
        <p className="type-body-sm text-[var(--color-ink-secondary)]">
          Review errors flagged by exam candidates, update moderation status, and record editorial notes.
        </p>
      </div>

      <AdminReportsClient />
    </section>
  );
}
