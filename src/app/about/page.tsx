import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Check,
  Database,
  Globe,
  Quote,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AcademicFeedbackForm } from '@/components/about/AcademicFeedbackForm';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'About docmubashirchaudhry: Mission & Provenance',
  description:
    'Learn about docmubashirchaudhry: faculty leadership of Dr. Mubashir Chaudhry, open educational access, official source methodology, and zero-ad guarantee.',
  path: '/about'
});

export default async function AboutPage() {
  const repo = getContentRepository();
  const [countries, pdfs, questions] = await Promise.all([
    repo.getCountries({ includeDrafts: false }),
    repo.getPdfResources({ includeDrafts: false }),
    repo.getQuestions({ includeDrafts: false })
  ]);

  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact" labelledBy="about-heading">
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: 'About' }]} currentPath="/about" />

          <div className="space-y-2.5 border-b border-[var(--dmc-border-subtle)] pb-5">
            <span className="pill-badge bg-emerald-50 text-[var(--dmc-brand-emerald)] border border-emerald-200">
              <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
              OPEN EDUCATIONAL MISSION
            </span>
            <h1 id="about-heading" className="type-page-title text-[var(--dmc-ink-primary)]">
              Empowering Pakistan&apos;s Aspirants with Verified Precision
            </h1>
            <p className="type-body-base text-[var(--dmc-ink-secondary)] max-w-3xl">
              Independent, distraction-free civil service and screening exam preparation backed by explicit provenance citations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-xl p-4 elevation-1">
              <div className="type-label-micro text-[var(--dmc-ink-muted)]">Geography Scope</div>
              <div className="text-lg sm:text-xl font-extrabold text-[var(--dmc-ink-primary)] mt-1 tabular-nums">
                {countries.length}+ Nations
              </div>
              <div className="text-[11px] text-[var(--dmc-ink-muted)] mt-0.5">
                UN-Aligned Sovereign Profiles
              </div>
            </div>
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-xl p-4 elevation-1">
              <div className="type-label-micro text-[var(--dmc-ink-muted)]">Booklet Archive</div>
              <div className="text-lg sm:text-xl font-extrabold text-[var(--dmc-brand-emerald)] mt-1 tabular-nums">
                {pdfs.length} Verified PDFs
              </div>
              <div className="text-[11px] text-[var(--dmc-ink-muted)] mt-0.5">
                SHA-256 Checksummed
              </div>
            </div>
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-xl p-4 elevation-1">
              <div className="type-label-micro text-[var(--dmc-ink-muted)]">Active Recall Bank</div>
              <div className="text-lg sm:text-xl font-extrabold text-[var(--dmc-accent-gold)] mt-1 tabular-nums">
                {questions.length}+ MCQs
              </div>
              <div className="text-[11px] text-[var(--dmc-ink-muted)] mt-0.5">
                Detailed Explanations
              </div>
            </div>
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-xl p-4 elevation-1">
              <div className="type-label-micro text-[var(--dmc-ink-muted)]">Access Guarantee</div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-1">
                100% Free
              </div>
              <div className="text-[11px] text-[var(--dmc-ink-muted)] mt-0.5">
                No Ads, No Login
              </div>
            </div>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard" labelledBy="leadership-heading">
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 sm:p-8 elevation-1 border-l-4 border-l-[var(--dmc-brand-emerald)] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Award className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Educational Independence</span>
              </div>
              <h2 id="leadership-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
                Built Against Clutter &amp; Unverified Answer Keys
              </h2>
              <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
                <strong>docmubashirchaudhary</strong> was created to remove structural friction facing exam aspirants across Pakistan: paywalled past papers, intrusive ad overlays, and unverified MCQ keys that cause negative marking penalties.
              </p>
              <p className="text-sm text-[var(--dmc-ink-secondary)] leading-relaxed">
                We operate independently of PPSC, FPSC, NTS, and any provincial or federal government body. Whenever primary official syllabus percentages are pending confirmation, we label them transparently instead of inventing weights.
              </p>
            </div>

            <div className="lg:col-span-5 bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-6 elevation-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <UserCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span>Faculty Leadership</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                  Chief Mentor
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[var(--dmc-ink-primary)]">Dr. Mubashir Chaudhry</h3>
                <div className="text-xs text-[var(--dmc-ink-muted)] font-medium">
                  Chief Academic Mentor &amp; Research Lead
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-[var(--dmc-ink-secondary)] space-y-1.5">
                <div className="font-bold text-[var(--dmc-ink-primary)] text-[11px] uppercase tracking-wider">
                  Academic Credentials:
                </div>
                <ul className="space-y-1">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>M.Phil. in Biology</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>B.S in Botany</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>M.A in English Literature</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>M.A in Political Science</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>B-Pharmacist, University of Agriculture Faisalabad (UAF)</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-950 italic flex items-start gap-2">
                <Quote className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  &ldquo;Zero advertisements, zero paywalls, and factual clarity so every candidate can prepare fairly on merit.&rdquo;
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-5 elevation-1 space-y-2.5">
              <Globe className="w-5 h-5 text-[var(--dmc-accent-gold)]" aria-hidden="true" />
              <h3 className="font-bold text-base text-[var(--dmc-ink-primary)]">World Geography Workbench</h3>
              <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                Canonical sovereign state dataset synchronized with UN member terminology, ISO codes, multi-capital handling, and active recall testing.
              </p>
              <Link href="/geography" className="text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline inline-block">
                Explore Geography
              </Link>
            </div>

            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-5 elevation-1 space-y-2.5">
              <BookOpen className="w-5 h-5 text-[var(--dmc-brand-emerald)]" aria-hidden="true" />
              <h3 className="font-bold text-base text-[var(--dmc-ink-primary)]">PPSC Cadres &amp; Intelligence Officer</h3>
              <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                Structured post records (including Intelligence Officer BS-14) linking commission notices directly to SHA-256 verified solved PDF booklets.
              </p>
              <Link href="/ppsc/intelligent-officer" className="text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline inline-block">
                View PPSC Hub
              </Link>
            </div>

            <div className="bg-white border border-[var(--dmc-border-subtle)] rounded-2xl p-5 elevation-1 space-y-2.5">
              <Database className="w-5 h-5 text-purple-700" aria-hidden="true" />
              <h3 className="font-bold text-base text-[var(--dmc-ink-primary)]">Provenance &amp; Open Verification</h3>
              <p className="text-xs text-[var(--dmc-ink-secondary)] leading-relaxed">
                Read our editorial review methodology, PDF SHA-256 verification checks, and privacy commitment.
              </p>
              <Link href="/methodology" className="text-xs font-bold text-[var(--dmc-brand-emerald)] hover:underline inline-block">
                Read Methodology
              </Link>
            </div>
          </div>

          <AcademicFeedbackForm />

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-2 text-xs sm:text-sm text-emerald-950">
            <div className="font-bold flex items-center gap-2 text-base text-[var(--dmc-brand-emerald)]">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              <span>Privacy &amp; Zero-Tracking Guarantee</span>
            </div>
            <p className="text-emerald-900 leading-relaxed">
              We do not run ad networks, user accounts, or analytics beacons. Quiz practice progress lives exclusively on your own browser via localStorage.
            </p>
          </div>
        </div>
      </SectionBand>
    </>
  );
}
