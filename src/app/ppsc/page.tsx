import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  Sparkles
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { PostFilterBar } from '@/components/exams/PostFilterBar';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContentRepository } from '@/lib/data';
import { getLiveDatabaseQuestions } from '@/lib/data/live-questions';
import { parseSecretSupabaseConfig } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildCollectionPageSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = buildPageMetadata({
  title: 'PPSC Recruitment Posts & Solved PDF Booklets',
  description:
    'Free PPSC exam preparation hub featuring tracked recruitment posts, official portal provenance, online practice MCQs, and downloadable solved MCQ PDF booklets.',
  path: '/ppsc'
});

export default async function PPSCPage() {
  const repo = getContentRepository();
  const [ppscExam, posts, pdfs, questions, topics, subjects] = await Promise.all([
    repo.getExam('ppsc'),
    repo.getRecruitmentPosts('ppsc'),
    repo.getPdfResources({ includeDrafts: false }),
    repo.getQuestions({ includeDrafts: false }),
    repo.getTopics(),
    repo.getSubjects()
  ]);

  const liveQuestions = await getLiveDatabaseQuestions(topics, subjects, posts);
  const ppscQuestions = (liveQuestions.length > 0 ? liveQuestions : questions).filter(
    (q) => q.postIds.some((p) => p.toLowerCase().includes('ppsc'))
  );

  let livePdfCount = 0;
  if (parseSecretSupabaseConfig()) {
    try {
      const admin = createSupabaseAdminClient();
      const res = await admin
        .from('pdf_resources')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .ilike('exam_tag', '%ppsc%');
      livePdfCount = res.count ?? 0;
    } catch {
      livePdfCount = 0;
    }
  }
  const totalPdfCount = livePdfCount > 0 ? livePdfCount : pdfs.length;

  const pdfByPost: Record<string, number> = {};
  for (const pdf of pdfs) {
    for (const pid of pdf.postIds) {
      pdfByPost[pid] = (pdfByPost[pid] ?? 0) + (pdf.questionCount ?? 0);
    }
  }

  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          title: 'PPSC Recruitment Posts & Solved MCQ Booklets',
          description:
            'Open-access PPSC recruitment post guides and downloadable SHA-256 verified solved MCQ booklets.',
          path: '/ppsc',
          items: posts.map((post) => ({
            name: post.title,
            path: `/ppsc/${post.slug}`
          }))
        })}
      />
      <SectionBand surface="ground" density="compact" labelledBy="ppsc-hub-heading">
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Exams', href: '/exams' },
              { label: 'PPSC' }
            ]}
            currentPath="/ppsc"
          />

          <div className="space-y-3 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <span className="pill-badge bg-[var(--color-brand-tint)] text-[var(--color-brand-deep)] border border-[var(--color-border-strong)]">
              <Sparkles className="w-3 h-3 mr-1 text-[var(--color-brand-deep)]" aria-hidden="true" />
              OPEN-ACCESS PPSC PREPARATION REPOSITORY
            </span>
            <div className="flex items-center gap-3.5">
              <CommissionBrandBadge examCodeOrSlug="ppsc" size="lg" />
              <h1 id="ppsc-hub-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                {ppscExam?.title ?? 'Punjab Public Service Commission (PPSC)'}
              </h1>
            </div>
            <p className="type-body-base text-[var(--dmc-ink-secondary)] max-w-3xl">
              {ppscExam?.summary} Filter recruitment posts by Open/Closed status and download solved MCQ booklets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-5 elevation-1 space-y-1">
              <div className="flex items-center gap-2 type-label-micro text-[var(--dmc-ink-muted)]">
                <BookOpen className="w-4 h-4 text-[var(--dmc-brand-forest)]" aria-hidden="true" />
                <span>Tracked Recruitment Cadres</span>
              </div>
              <div className="text-xl font-extrabold text-[var(--dmc-ink-primary)] tabular-nums">
                {posts.length} Tracked Post{posts.length === 1 ? '' : 's'}
              </div>
              <p className="text-xs text-[var(--dmc-ink-muted)]">
                Data-driven basic scale and advertisement status metadata
              </p>
            </div>

            <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-5 elevation-1 space-y-1">
              <div className="flex items-center gap-2 type-label-micro text-[var(--dmc-ink-muted)]">
                <FileText className="w-4 h-4 text-[var(--dmc-accent-gold-hover)]" aria-hidden="true" />
                <span>Verified Booklets &amp; Question Bank</span>
              </div>
              <div className="text-xl font-extrabold text-[var(--dmc-ink-primary)] tabular-nums">
                {totalPdfCount} PDFs &middot; {ppscQuestions.length} MCQs
              </div>
              <p className="text-xs text-[var(--dmc-ink-muted)]">
                SHA-256 checksummed compilations with zero login wall
              </p>
            </div>

            <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-5 elevation-1 space-y-1">
              <div className="flex items-center gap-2 type-label-micro text-[var(--dmc-ink-muted)]">
                <Clock className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Negative Marking Standard</span>
              </div>
              <div className="text-xl font-extrabold text-[var(--dmc-ink-primary)] tabular-nums">
                -0.25 Marks
              </div>
              <p className="text-xs text-[var(--dmc-ink-muted)]">
                Standard 100 MCQs in 90 minutes single-paper screening rule
              </p>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" density="compact" labelledBy="posts-grid-title">
        <PostFilterBar posts={posts} questionCountByPostId={pdfByPost} />
      </SectionBand>

      <SectionBand surface="ground" density="compact" labelledBy="ppsc-resources-strip">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[var(--dmc-status-verified-bg)]/60 border border-[var(--dmc-status-verified-border)]/40 rounded-2xl p-6">
          <div className="lg:col-span-8 space-y-2">
            <h2 id="ppsc-resources-strip" className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--dmc-status-verified-icon)]" aria-hidden="true" />
              <Shield className="w-4 h-4 text-[var(--dmc-status-verified-icon)]" aria-hidden="true" />
              <span>Source Provenance &amp; Cross-Hub Access</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
              Commission statuses gathered from secondary summaries remain labelled as unverified until primary PPSC advertisement PDFs are linked. Practice verified MCQs online or download full booklets directly.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
            <Link
              href="/mcq/practice"
              className="inline-flex items-center gap-1.5 bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white text-xs font-bold px-4 py-2.5 rounded-[var(--dmc-radius-button)] transition-colors"
            >
              <span>Practice PPSC MCQs</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/library/ppsc"
              className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 text-xs font-bold px-4 py-2.5 rounded-[var(--dmc-radius-button)] transition-colors"
            >
              <span>PPSC PDF Library</span>
            </Link>
          </div>
        </div>
      </SectionBand>
    </>
  );
}
