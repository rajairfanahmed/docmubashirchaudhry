import React from 'react';
import { AdminQuizzesClient } from '@/components/admin/AdminQuizzesClient';

export default function AdminQuizzesPage() {
  return (
    <section aria-labelledby="admin-quizzes-heading" className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <span className="type-label-micro text-[var(--dmc-brand-forest)]">
          Exam Authoring &amp; Telemetry
        </span>
        <h1 id="admin-quizzes-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
          Quiz Management &amp; Analytics
        </h1>
        <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
          Configure Practice Quizzes and Timed Mock Exams with negative marking, bilingual
          support, and most-missed question insights.
        </p>
      </div>

      <AdminQuizzesClient />
    </section>
  );
}
