import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Globe } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { QuizCatalogClient } from '@/components/quizzes/QuizCatalogClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { parseSecretSupabaseConfig } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizRow } from '@/lib/supabase/database.types';
import type { PaginationMeta, QuizSummaryItem } from '@/lib/v3/types';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildCollectionPageSchema } from '@/lib/seo/structured-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Quizzes & Full-Length Mock Exams',
  description:
    'Attempt subject practice quizzes and timed PPSC/FPSC mock exams with negative marking, bilingual English and Urdu questions, and personal attempt history.',
  path: '/quizzes'
});

async function getInitialCatalogData(): Promise<{
  items: QuizSummaryItem[];
  pagination: PaginationMeta;
  configured: boolean;
}> {
  if (!parseSecretSupabaseConfig()) {
    return {
      items: [],
      pagination: {
        page: 1,
        pageSize: 12,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      },
      configured: false
    };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, count, error } = await admin
      .from('quizzes')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(0, 11);

    if (error || !data) {
      return {
        items: [],
        pagination: {
          page: 1,
          pageSize: 12,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        configured: true
      };
    }

    const rows = data as QuizRow[];
    const quizIds = rows.map((q) => q.id);

    const questionCounts = new Map<string, number>();
    if (quizIds.length > 0) {
      const { data: qRows } = await admin
        .from('quiz_questions')
        .select('quiz_id')
        .in('quiz_id', quizIds);
      for (const row of (qRows ?? []) as Array<{ quiz_id: string | null }>) {
        if (row.quiz_id) {
          questionCounts.set(row.quiz_id, (questionCounts.get(row.quiz_id) ?? 0) + 1);
        }
      }
    }

    const totalItems = count ?? rows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / 12));

    return {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        type: row.type,
        subject: row.subject,
        examTag: row.exam_tag,
        timeLimitSeconds: row.time_limit_seconds,
        negativeMarking: row.negative_marking,
        negativeMarkingValue: Number(row.negative_marking_value),
        passPercentage: Number(row.pass_percentage),
        language: row.language,
        questionCount: questionCounts.get(row.id) ?? 0,
        createdAt: row.created_at,
        requiresAuth: true
      })),
      pagination: {
        page: 1,
        pageSize: 12,
        totalItems,
        totalPages,
        hasNextPage: totalPages > 1,
        hasPreviousPage: false
      },
      configured: true
    };
  } catch {
    return {
      items: [],
      pagination: {
        page: 1,
        pageSize: 12,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      },
      configured: true
    };
  }
}

export default async function QuizzesCatalogPage() {
  const initial = await getInitialCatalogData();

  return (
    <div className="flex flex-col">
      <JsonLd
        data={buildCollectionPageSchema({
          title: 'Quizzes & Full-Length Mock Exams',
          description:
            'Attempt subject practice quizzes and timed PPSC/FPSC mock exams with negative marking and bilingual English and Urdu questions.',
          path: '/quizzes',
          items: initial.items.map((quiz) => ({
            name: quiz.title,
            path: `/quizzes/${quiz.slug}`
          })),
          totalItems: initial.pagination.totalItems
        })}
      />
      <SectionBand
        surface="hero"
        density="compact"
        className="py-8 sm:py-10"
      >
        <div className="space-y-4">
          <Breadcrumbs
            items={[{ label: 'Quizzes & Mocks' }]}
            currentPath="/quizzes"
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-deep)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-3 py-1 rounded-md">
                <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>PPSC &middot; FPSC &middot; Bilingual Exam Runner</span>
              </div>
              <h1 className="type-page-title text-[var(--color-ink)]">Quizzes &amp; Full-Length Mock Exams</h1>
              <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] leading-relaxed">
                Practice untimed subject drills or test exam readiness under real negative-marking
                and timer discipline. Catalog browsing is open; starting a graded quiz prompts a
                free student sign-in so scores save privately.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href="/my-attempts"
                className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border-strong)] text-xs sm:text-sm font-semibold"
              >
                <span>My Attempt History</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/geography#quiz-module"
                className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-xs sm:text-sm font-semibold"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                <span>Open Geography Quiz</span>
              </Link>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="ground" className="py-8 sm:py-12">
        <QuizCatalogClient
          initialItems={initial.items}
          initialPagination={initial.pagination}
          initialConfigured={initial.configured}
        />
      </SectionBand>
    </div>
  );
}
