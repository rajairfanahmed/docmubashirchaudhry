import React from 'react';
import type { Metadata } from 'next';
import { AdminActivityClient } from '@/components/admin/AdminActivityClient';

export const metadata: Metadata = {
  title: 'Administrative Activity Audit',
  robots: { index: false, follow: false }
};

export default function AdminActivityPage() {
  return (
    <section aria-labelledby="admin-activity-heading" className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <span className="type-label-micro text-[var(--color-brand-deep)]">
          Security &amp; Compliance Audit
        </span>
        <h1 id="admin-activity-heading" className="type-page-title text-[var(--color-ink)]">
          Administrative Activity Log
        </h1>
        <p className="type-body-sm text-[var(--color-ink-secondary)]">
          Immutable audit trail of administrator actions, status changes, content updates, and exports.
        </p>
      </div>

      <AdminActivityClient />
    </section>
  );
}
