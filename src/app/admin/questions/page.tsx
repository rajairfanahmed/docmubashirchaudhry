import React from 'react';
import { AdminQuestionsClient } from '@/components/admin/AdminQuestionsClient';
import { notoNastaliqUrdu } from '@/lib/fonts/urdu';

export default function AdminQuestionsPage() {
  return (
    <section
      aria-labelledby="admin-questions-heading"
      className={`${notoNastaliqUrdu.variable} space-y-6 max-w-7xl`}
    >
      <div className="space-y-1">
        <span className="type-label-micro text-[var(--dmc-brand-forest)]">
          Bilingual Question Bank
        </span>
        <h1 id="admin-questions-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
          Question Bank &amp; Bulk Import
        </h1>
        <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
          Author paired English and Urdu MCQs with subject tags, difficulty tiers, correct option
          keys, and answer explanations.
        </p>
      </div>

      <AdminQuestionsClient />
    </section>
  );
}
