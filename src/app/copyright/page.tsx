import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Mail, Scale } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Copyright & Takedown Notice',
  description:
    'Rights classifications for PDF booklets, public-domain official commission notices, attribution, and copyright takedown request instructions.',
  path: '/copyright'
});

export default function CopyrightPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="copyright-heading">
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Copyright' }]} currentPath="/copyright" />

          <div className="space-y-2 pb-4 border-b border-[var(--dmc-border-subtle)]">
            <span className="pill-badge bg-slate-100 text-slate-800 border border-slate-300">
              RIGHTS &amp; LICENSING GOVERNANCE
            </span>
            <h1 id="copyright-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Copyright, Attribution &amp; Takedowns
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)]">
              Clear licensing rules governing author compilations, open geographic datasets, and third-party rights inquiries.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="copyright-details">
        <div className="space-y-6">
          <h2 id="copyright-details" className="sr-only">
            Rights Categories and Takedown Contact
          </h2>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <BookOpen className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>1. Original Compilations &amp; Study Material</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Solved MCQ booklets authored by Dr. Mubashir Chaudhry (`author_original`) are distributed free of charge for individual aspirants, learners, and teachers for personal academic preparation, with attribution intact. Commercial repackaging or paywalling our open booklets is prohibited.
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--dmc-ink-primary)]">
              <Scale className="w-4 h-4 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <span>2. Official Notifications &amp; Geographic Datasets</span>
            </div>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              Statutory texts, commission advertisements, and UN sovereign country descriptors belong strictly to their respective issuing bodies and public international standards. Every PDF resource card states its explicit rights classification (`author_original`, `public_domain_official`, `cc_by_4`, or `permission_granted`).
            </p>
          </article>

          <article className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-3">
            <h3 className="font-bold text-base text-[var(--dmc-ink-primary)]">
              Takedown Request Procedure
            </h3>
            <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
              If you believe any compilation, excerpt, or PDF file infringes your rights, email us with the exact URL and ownership details for prompt review and removal.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="mailto:copyright@docmubashirchaudhary.com?subject=Copyright%20or%20Takedown%20Notice"
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>copyright@docmubashirchaudhary.com</span>
              </a>
              <Link href="/library" className="text-xs font-semibold text-[var(--dmc-ink-muted)] hover:underline">
                Open PDF Library
              </Link>
            </div>
          </article>
        </div>
      </SectionBand>
    </>
  );
}
