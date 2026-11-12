import React from 'react';
import { AdminUsersClient } from '@/components/admin/AdminUsersClient';

export default function AdminUsersPage() {
  return (
    <section aria-labelledby="admin-users-heading" className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <span className="type-label-micro text-[var(--dmc-brand-forest)]">
          Student Accounts
        </span>
        <h1 id="admin-users-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
          Registered Users
        </h1>
        <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
          Inspect sign-up provider, join timestamp, last active date, total quizzes attempted, and
          average score per account.
        </p>
      </div>

      <AdminUsersClient />
    </section>
  );
}
