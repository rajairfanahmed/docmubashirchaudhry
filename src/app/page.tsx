import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  Globe,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { SectionBand } from '@/components/layout/SectionBand';
import { HeroSearch } from '@/components/home/HeroSearch';
import { AuthorityExamTiles } from '@/components/home/AuthorityExamTiles';
import { McqLauncherWidget } from '@/components/home/McqLauncherWidget';
import { McqSubjectStrip } from '@/components/home/McqSubjectStrip';
import { StandingTrustNotice } from '@/components/layout/StandingTrustNotice';
import { GatedPdfDownloadButton } from '@/components/library/GatedPdfDownloadButton';
import { CountryCard } from '@/components/geography/CountryCard';
import { getContentRepository } from '@/lib/data';
import { parseSecretSupabaseConfig } from '@/lib/env';
import { formatBytes } from '@/lib/format';
import { buildPageMetadata, SITE_NAME } from '@/lib/seo/metadata';
import type { PdfResourceRow } from '@/lib/supabase/database.types';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  absoluteTitle: `${SITE_NAME} | Free Competitive Exam Preparation Portal`,
  description:
    'Notes, MCQs, quizzes, practice material and other useful resources, all in one place for PPSC and FPSC aspirants.',
  path: '/'
});

interface PortalLiveMetrics {
  quizzes: number;
  pdfs: number;
  questions: number;
  subjectCounts: Record<string, number>;
  latestPdfs: Array<{
    id: string;
    title: string;
    description: string | null;
    subject: string;
    examTag: string;
    fileSize: number;
    downloadCount: number;
    isPublished: boolean;
  }>;
}

const SUBJECT_KEYWORD_MAP: Record<string, string[]> = {
  'sub-gk': ['general knowledge', 'geography', 'world', 'gk'],
  'sub-pak-studies': ['pakistan affairs', 'pakistan', 'history', 'constitution'],
  'sub-islamic-studies': ['islamic studies', 'islam', 'ethics', 'islamiat'],
  'sub-everyday-science': ['everyday science', 'science', 'biology', 'physics', 'chemistry'],
  'sub-english': ['english', 'vocabulary', 'grammar'],
  'sub-urdu': ['urdu', 'adab', 'literature'],
  'sub-math': ['basic mathematics', 'mathematics', 'math', 'arithmetic', 'ability'],
  'sub-computer': ['computer', 'it', 'information technology', 'cs'],
  'sub-sports': ['sports', 'physical education', 'olympic']
};

async function getSafeDbCounts(): Promise<PortalLiveMetrics> {
  const empty: PortalLiveMetrics = {
    quizzes: 0,
    pdfs: 0,
    questions: 0,
    subjectCounts: {},
    latestPdfs: []
  };

  if (!parseSecretSupabaseConfig()) {
    return empty;
  }

  try {
    const admin = createSupabaseAdminClient();
    const [quizRes, pdfRes, qRes, qSubjectRowsRes, latestPdfsRes] = await Promise.all([
      admin.from('quizzes').select('id', { count: 'exact', head: true }).eq('is_published', true),
      admin
        .from('pdf_resources')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),
      admin.from('quiz_questions').select('id', { count: 'exact', head: true }),
      admin.from('quiz_questions').select('subject'),
      admin
        .from('pdf_resources')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6)
    ]);

    const subjectCounts: Record<string, number> = {};
    const rows = qSubjectRowsRes.data ?? [];
    for (const r of rows) {
      const s = (r.subject || '').trim().toLowerCase();
      let matchedId: string | null = null;
      for (const [subId, keywords] of Object.entries(SUBJECT_KEYWORD_MAP)) {
        if (keywords.some((k) => s.includes(k))) {
          matchedId = subId;
          break;
        }
      }
      if (matchedId) {
        subjectCounts[matchedId] = (subjectCounts[matchedId] ?? 0) + 1;
      }
    }

    const latestPdfs = ((latestPdfsRes.data ?? []) as PdfResourceRow[]).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      subject: p.subject,
      examTag: p.exam_tag,
      fileSize: p.file_size,
      downloadCount: p.download_count,
      isPublished: p.is_published
    }));

    return {
      quizzes: quizRes.count ?? 0,
      pdfs: pdfRes.count ?? 0,
      questions: qRes.count ?? 0,
      subjectCounts,
      latestPdfs
    };
  } catch {
    return empty;
  }
}

export default async function HomePage() {
  const repo = getContentRepository();
  const [exams, subjects, topics, questions, pdfs, countries, reference, dbCounts] =
    await Promise.all([
      repo.getExams(),
      repo.getSubjects(),
      repo.getTopics(),
      repo.getQuestions({ includeDrafts: false }),
      repo.getPdfResources({ sort: 'newest', includeDrafts: false }),
      repo.getCountries({ includeDrafts: false }),
      repo.getGeographyReference(),
      getSafeDbCounts()
    ]);

  const featuredCountry =
    countries.find((country) => country.slug === 'pakistan') ?? countries[0] ?? null;
  const continentName = featuredCountry
    ? reference.continents.find((c) => c.id === featuredCountry.continentId)?.name
    : undefined;
  const regionName = featuredCountry
    ? reference.regions.find((r) => r.id === featuredCountry.regionId)?.name
    : undefined;

  const quickStats = [
    {
      label: 'Active Quizzes & Mocks',
      value: String(dbCounts.quizzes),
      href: '/quizzes',
      icon: ClipboardCheck
    },
    {
      label: 'Solved PDF Booklets',
      value: String(dbCounts.pdfs),
      href: '/library',
      icon: FileText
    },
    {
      label: 'Published MCQs',
      value: String(dbCounts.questions),
      href: '/mcq',
      icon: BookOpen
    },
    {
      label: 'Country Profiles',
      value: String(countries.length),
      href: '/geography',
      icon: Globe
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Band 1: Light-First Editorial Split Hero */}
      <SectionBand
        surface="hero"
        density="compact"
        className="pt-5 pb-10 sm:pt-7 sm:pb-12 lg:pt-8 lg:pb-14"
        containerClassName="relative"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-brand-deep)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-3 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>PPSC &middot; FPSC &middot; CSS &middot; PMS &middot; FIA &middot; PERA</span>
            </div>

            <h1 className="type-display-hero text-[var(--color-ink)]">
              Notes, MCQs, quizzes, practice material and other useful resources, all in one place
              for PPSC and FPSC aspirants.
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] max-w-2xl leading-relaxed">
              Browse World Geography references and commission exam guides openly without login.
              Sign in with a free student account to attempt saved quizzes, timed mocks, and
              watermarked study PDFs.
            </p>

            <div className="bg-[var(--color-page)] p-2 sm:p-2.5 rounded-[var(--radius-panel)] border border-[var(--color-border-strong)]">
              <HeroSearch />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/quizzes"
                className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] font-semibold text-sm"
              >
                <ClipboardCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Explore Quizzes &amp; Mocks</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>

              <Link
                href="/library"
                className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border-strong)] font-semibold text-sm"
              >
                <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Browse PDF Library</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Framed Portrait Card with Crisp Scrim Credential */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[var(--radius-sheet)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-soft)] elevation-2 aspect-[4/4.5] max-h-[450px] w-full max-w-md mx-auto lg:ml-auto">
              <Image
                src="/images/mubashirchaudhry1 (3).jpg"
                alt="Doc Mubashir Chaudhry in formal dark navy suit beneath the PPSC Punjab Public Service Commission crest"
                fill
                priority
                quality={85}
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 portrait-scrim p-5 sm:p-6 flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-wide text-[var(--color-accent)]">
                  Portal Educator &amp; Mentor
                </span>
                <div className="font-display font-bold text-lg sm:text-xl text-white leading-tight">
                  Doc Mubashir Chaudhry
                </div>
                <p className="text-xs text-[var(--color-dark-ink-secondary)] leading-snug">
                  FIA, PPSC, PERA, FPSC, CSS &amp; PMS Competitive Exam Educator
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionBand>

      {/* Band 2: Honest 4-Column Quick Stats Strip */}
      <SectionBand
        surface="muted"
        density="compact"
        className="py-5 sm:py-6"
      >
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="track-card flex items-center gap-3.5 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] p-3.5 sm:p-4"
              >
                <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-brand-deep)] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-xl sm:text-2xl text-[var(--color-ink)] tabular-nums leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-[var(--color-ink-secondary)] mt-1 truncate">
                    {stat.label}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </SectionBand>

      {/* Band 3: Exam Hubs & Geography Strip */}
      <SectionBand labelledBy="home-exam-hubs-heading" surface="ground">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--color-brand-deep)]">
                Exam Hubs &amp; Open Reference
              </span>
              <h2 id="home-exam-hubs-heading" className="type-section-heading text-[var(--color-ink)]">
                Commission Hubs &amp; World Geography
              </h2>
            </div>
            <Link
              href="/exams"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-deep)] hover:underline shrink-0"
            >
              <span>All Exam Hubs</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <AuthorityExamTiles />
        </div>
      </SectionBand>

      {/* Band 4: Latest Solved Watermarked PDFs */}
      <SectionBand
        labelledBy="home-pdfs-heading"
        surface="card"
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--color-brand-deep)]">
                Watermarked Study Booklets
              </span>
              <h2 id="home-pdfs-heading" className="type-section-heading text-[var(--color-ink)]">
                Latest Solved Exam PDFs
              </h2>
            </div>
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-deep)] hover:underline shrink-0"
            >
              <span>Browse Full PDF Library</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {dbCounts.latestPdfs.length === 0 ? (
            <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--color-ink)]">
                Solved Past Paper Booklets Under Academic Review
              </h3>
              <p className="text-sm text-[var(--color-ink-secondary)] max-w-lg mx-auto">
                Verified solved booklets and past papers uploaded by Doc Mubashir Chaudhry will appear here with instant signed downloads.
              </p>
              <div className="pt-2">
                <Link
                  href="/corrections"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-deep)] hover:underline"
                >
                  <span>Request a specific past paper</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {dbCounts.latestPdfs.map((pdf) => (
                <article
                  key={pdf.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-5 sm:p-6 elevation-1 flex flex-col justify-between space-y-5 min-w-0"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)]">
                        {pdf.subject}
                      </span>
                      <span className="font-semibold text-slate-700 bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                        {pdf.examTag}
                      </span>
                    </div>

                    <h3 className="type-card-title text-[var(--color-ink)]">{pdf.title}</h3>

                    {pdf.description && (
                      <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed line-clamp-3">
                        {pdf.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 tabular-nums font-medium">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{formatBytes(pdf.fileSize)}</span>
                      </span>
                      <span>&middot;</span>
                      <span>{pdf.downloadCount} downloads</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Verified Watermarked PDF
                    </span>
                    <GatedPdfDownloadButton
                      pdfId={pdf.id}
                      title={pdf.title}
                      fileSizeBytes={pdf.fileSize}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </SectionBand>

      {/* Band 5: Featured World Geography Profile & Topic MCQ Practice */}
      <SectionBand labelledBy="home-practice-heading" surface="ground">
        <div className="space-y-10">
          {featuredCountry && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-deep)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-3 py-1 rounded-md">
                  <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Geography Module</span>
                </div>
                <h2 className="type-section-heading text-[var(--color-ink)]">
                  World Geography &amp; Country Reference
                </h2>
                <p className="type-body-base text-[var(--color-ink-secondary)]">
                  Explore {countries.length} country profiles with verified capitals, currencies,
                  official languages, and high-yield recall flashcards. Kept openly accessible with
                  zero login required.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    href="/geography#quiz-module"
                    className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold"
                  >
                    <span>Start Geography Quiz</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/geography"
                    className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-sm font-semibold text-[var(--color-ink)]"
                  >
                    <span>Browse All Countries</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                <CountryCard
                  country={featuredCountry}
                  currencies={reference.currencies}
                  languages={reference.languages}
                  continentName={continentName}
                  regionName={regionName}
                />
              </div>
            </div>
          )}

          {/* Subject MCQ Practice & Subject Strip */}
          <div className="space-y-6 pt-6 border-t border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[var(--color-brand-deep)] inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bilingual Subject Bank</span>
                </span>
                <h2
                  id="home-practice-heading"
                  className="type-section-heading text-[var(--color-ink)]"
                >
                  Practice MCQs by Exam &amp; Subject
                </h2>
              </div>
              <Link
                href="/quizzes"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-deep)] hover:underline shrink-0"
              >
                <span>Open Saved Quiz &amp; Mock Hub</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <McqLauncherWidget
              exams={exams}
              subjects={subjects}
              hideSubjectStrip
            />

            <McqSubjectStrip
              subjects={subjects}
              topics={topics}
              questionCountsBySubject={dbCounts.subjectCounts}
            />
          </div>
        </div>
      </SectionBand>

      {/* Band 6: Scoped Standing Trust Notice */}
      <StandingTrustNotice variant="band" />
    </div>
  );
}
