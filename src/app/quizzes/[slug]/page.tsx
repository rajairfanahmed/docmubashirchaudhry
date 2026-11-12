import React from 'react';
import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { QuizSessionRunner } from '@/components/quizzes/QuizSessionRunner';
import { JsonLd } from '@/components/seo/JsonLd';
import { parseSecretSupabaseConfig } from '@/lib/env';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildQuizResourceSchema } from '@/lib/seo/structured-data';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizRow } from '@/lib/supabase/database.types';
import { notoNastaliqUrdu } from '@/lib/fonts/urdu';

export const dynamic = 'force-dynamic';

async function getQuizSummaryBySlug(slug: string) {
  if (!parseSecretSupabaseConfig()) {
    return null;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('quizzes')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle<QuizRow>();

    if (error || !data) return null;

    const { count } = await admin
      .from('quiz_questions')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', data.id);

    return {
      title: data.title,
      description: data.description,
      type: data.type,
      subject: data.subject,
      examTag: data.exam_tag,
      timeLimitSeconds: data.time_limit_seconds,
      negativeMarking: data.negative_marking,
      negativeMarkingValue: Number(data.negative_marking_value),
      language: data.language,
      questionCount: count ?? 0
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quizMeta = await getQuizSummaryBySlug(slug);

  if (!quizMeta) {
    return buildPageMetadata({
      title: 'Quiz Session',
      description: 'Interactive timed PPSC and FPSC quiz runner.',
      path: `/quizzes/${slug}`,
      index: false
    });
  }

  const timeLimitSeconds = quizMeta.timeLimitSeconds ?? 0;
  const parts = [
    quizMeta.questionCount > 0 ? `${quizMeta.questionCount} MCQs` : null,
    timeLimitSeconds > 0 ? `${Math.round(timeLimitSeconds / 60)} min timed` : 'untimed',
    quizMeta.negativeMarking ? `-${quizMeta.negativeMarkingValue} negative marking` : null
  ].filter(Boolean);

  return buildPageMetadata({
    title: `${quizMeta.title} | Timed Quiz`,
    description:
      quizMeta.description?.trim() ||
      `Practice ${quizMeta.title} (${parts.join(', ')}) on DocMubashir Exam Portal.`,
    path: `/quizzes/${slug}`
  });
}

export default async function QuizRunnerPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quizMeta = await getQuizSummaryBySlug(slug);
  const displayTitle = quizMeta?.title ?? `Quiz Session: ${slug}`;

  return (
    <section
      aria-labelledby="quiz-runner-heading"
      className={`${notoNastaliqUrdu.variable} bg-[var(--color-page)] min-h-[calc(100dvh-10rem)] py-6 sm:py-10`}
    >
      {quizMeta && (
        <JsonLd
          data={buildQuizResourceSchema({
            title: quizMeta.title,
            description:
              quizMeta.description?.trim() ||
              `Interactive competitive exam quiz for ${quizMeta.subject || quizMeta.examTag || 'one-paper'} preparation.`,
            path: `/quizzes/${slug}`,
            about: [quizMeta.examTag, quizMeta.subject].filter(
              (item): item is string => Boolean(item)
            ),
            questionCount: quizMeta.questionCount
          })}
        />
      )}
      <PageContainer size="wide" className="space-y-5 sm:space-y-6">
        <Breadcrumbs
          items={[{ label: 'Quizzes & Mocks', href: '/quizzes' }, { label: displayTitle }]}
          currentPath={`/quizzes/${slug}`}
        />

        <QuizSessionRunner slug={slug} initialMetadata={quizMeta} />
      </PageContainer>
    </section>
  );
}
