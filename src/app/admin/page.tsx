import React from 'react';
import { AdminOverviewClient } from '@/components/admin/AdminOverviewClient';

export default function AdminOverviewPage() {
  return (
    <section aria-labelledby="admin-overview-heading" className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <span className="type-label-micro text-[var(--dmc-brand-forest)]">
          Owner Analytics
        </span>
        <h1 id="admin-overview-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
          Portal Overview
        </h1>
        <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
          First-party usage trends across registrations, site visits, quiz attempts, and private R2
          downloads.
        </p>
      </div>

      <AdminOverviewClient />
    </section>
  );
}
