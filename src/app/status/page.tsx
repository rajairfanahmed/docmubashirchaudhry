import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Database } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { ManifestHealthPanel } from '@/components/status/ManifestHealthPanel';
import { getContentRepository } from '@/lib/data';
import { getServerManifest } from '@/lib/data/server-manifest';
import { formatVerificationDate } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata(): Metadata {
  const manifest = getServerManifest();
  return buildPageMetadata({
    title: `Platform & Dataset Status (${manifest.datasetVersion})`,
    description: `Live build-time counts and manifest integrity (${manifest.datasetVersion}) across verified countries, recruitment posts, MCQs, and SHA-256 PDF booklets.`,
    path: '/status'
  });
}

export default async function StatusPage() {
  const repo = getContentRepository();
  const [exams, posts, countries, pdfs, questions, subjects, topics] = await Promise.all([
    repo.getExams(),
    repo.getRecruitmentPosts('ppsc'),
    repo.getCountries({ includeDrafts: true }),
    repo.getPdfResources({ includeDrafts: true }),
    repo.getQuestions({ includeDrafts: true }),
    repo.getSubjects(),
    repo.getTopics()
  ]);

  const metrics = [
    { label: 'Countries & Territories', count: countries.length, href: '/geography' },
    { label: 'Solved PDF Booklets', count: pdfs.length, href: '/library' },
    { label: 'Tracked MCQ Items', count: questions.length, href: '/mcq' },
    { label: 'Exam Authorities', count: exams.length, href: '/exams' },
    { label: 'PPSC Recruitment Posts', count: posts.length, href: '/ppsc' },
    { label: 'Subjects & Topics', count: `${subjects.length} / ${topics.length}`, href: '/mcq' }
  ];

  const latestCheck = posts[0]?.verification.lastCheckedAt ?? exams[0]?.verification.lastCheckedAt;

  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="status-heading">
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Status' }]} currentPath="/status" />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <div className="space-y-2">
              <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
                <span className="pulse-dot mr-1.5" aria-hidden="true" />
                ALL STATIC PORTALS OPERATIONAL
              </span>
              <h1 id="status-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
                Platform &amp; Dataset Status
              </h1>
              <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
                Zero database downtime risk: every page serves directly from schema-validated static builds.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>Snapshot Verified: {formatVerificationDate(latestCheck)}</span>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="status-metrics">
        <div className="space-y-6">
          <h2 id="status-metrics" className="type-card-title text-[var(--dmc-ink-primary)] flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
            <span>Repository Snapshot Inventory</span>
          </h2>

          <ManifestHealthPanel />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="track-card bg-white border border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-emerald)] rounded-2xl p-5 elevation-1 space-y-1.5 group"
              >
                <div className="text-xs font-semibold text-[var(--dmc-ink-muted)]">{item.label}</div>
                <div className="text-2xl font-extrabold text-[var(--dmc-ink-primary)] tabular-nums">
                  {item.count}
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-emerald)] group-hover:underline">
                  <span>Inspect Hub</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </SectionBand>
    </>
  );
}
