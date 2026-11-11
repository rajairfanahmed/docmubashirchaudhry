import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe } from 'lucide-react';
import { SectionBand } from '@/components/layout/SectionBand';
import { StandingTrustNotice } from '@/components/layout/StandingTrustNotice';
import { HeroSearch } from '@/components/home/HeroSearch';
import { AuthorityExamTiles } from '@/components/home/AuthorityExamTiles';
import { McqLauncherWidget } from '@/components/home/McqLauncherWidget';
import { PdfResourceCard } from '@/components/library/PdfResourceCard';
import { CountryCard } from '@/components/geography/CountryCard';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { getContentRepository } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  absoluteTitle: 'docmubashirchaudhry | Free PPSC, CSS/PMS, Geography Quiz & Solved PDFs',
  description:
    'Independent, free competitive exam preparation portal for PPSC, CSS/PMS, FPSC, and NTS candidates. Practice World Geography, browse recruitment post guides, and download solved MCQ booklets.',
  path: '/'
});

export default async function HomePage() {
  const repo = getContentRepository();
  const [pdfs, countries, questions, refData, subjects, topics, exams] = await Promise.all([
    repo.getPdfResources({ sort: 'newest', includeDrafts: false }),
    repo.getCountries({ onlyVerified: true, includeDrafts: false }),
    repo.getQuestions({ includeDrafts: false }),
    repo.getGeographyReference(),
    repo.getSubjects(),
    repo.getTopics(),
    repo.getExams()
  ]);

  const featuredCountry =
    countries.find((c) => c.slug === 'pakistan') ?? countries[0] ?? null;

  const currencyMap = new Map(refData.currencies.map((c) => [c.id, c]));
  const languageMap = new Map(refData.languages.map((l) => [l.id, l]));
  const continentMap = new Map(refData.continents.map((c) => [c.id, c]));
  const regionMap = new Map(refData.regions.map((r) => [r.id, r]));

  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const questionCountsBySubject: Record<string, number> = {};
  for (const question of questions) {
    const seenSubjects = new Set<string>();
    for (const topicId of question.topicIds) {
      const topic = topicMap.get(topicId);
      if (topic && !seenSubjects.has(topic.subjectId)) {
        seenSubjects.add(topic.subjectId);
        questionCountsBySubject[topic.subjectId] =
          (questionCountsBySubject[topic.subjectId] ?? 0) + 1;
      }
    }
  }

  return (
    <div>
      {/* Band 1: Emerald Hero + Predictive Search Box */}
      <SectionBand surface="hero" density="spacious" labelledBy="hero-heading">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center pill-badge bg-[var(--dmc-brand-surface)] text-[var(--dmc-accent-gold)] border border-emerald-400/30">
            Free, Open-Access Candidate Preparation
          </div>

          <h1 id="hero-heading" className="type-display-hero text-white">
            Verified Exam Guides, Geography Drills &amp; Solved MCQs
          </h1>

          <p className="type-body-base text-emerald-100 max-w-2xl mx-auto">
            Free past-paper PDFs, data-verified World Geography quizzes, and topic-filtered MCQ drills with zero ads and zero login.
          </p>

          <HeroSearch />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-left">
            <div className="rounded-xl bg-[var(--dmc-brand-surface)]/80 border border-emerald-400/20 p-3.5">
              <div className="text-lg font-extrabold text-white tabular-nums">{countries.length} Nations</div>
              <div className="text-xs text-emerald-200">World Geography Profiles</div>
            </div>
            <div className="rounded-xl bg-[var(--dmc-brand-surface)]/80 border border-emerald-400/20 p-3.5">
              <div className="text-lg font-extrabold text-[var(--dmc-accent-gold)] tabular-nums">{pdfs.length} PDF Booklets</div>
              <div className="text-xs text-emerald-200">SHA-256 Verified Downloads</div>
            </div>
            <div className="rounded-xl bg-[var(--dmc-brand-surface)]/80 border border-emerald-400/20 p-3.5">
              <div className="text-lg font-extrabold text-white tabular-nums">{questions.length} MCQs</div>
              <div className="text-xs text-emerald-200">Active Recall Question Bank</div>
            </div>
            <div className="rounded-xl bg-[var(--dmc-brand-surface)]/80 border border-emerald-400/20 p-3.5">
              <div className="text-lg font-extrabold text-[var(--dmc-accent-gold)]">Zero Login</div>
              <div className="text-xs text-emerald-200">Free Forever, No Ads</div>
            </div>
          </div>
        </div>
      </SectionBand>

      {/* Band 2: Five Exam Tiles Strip + Check Strip + Independence Notice */}
      <SectionBand surface="card" density="standard" labelledBy="exam-tiles-heading">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <span className="pill-badge bg-[var(--dmc-status-unverified-bg)] text-[var(--dmc-status-unverified-ink)] border border-[var(--dmc-status-unverified-border)]/40">
              Prepare For
            </span>
            <h2 id="exam-tiles-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
              Exam Categories &amp; Commission Shortcuts
            </h2>
          </div>

          <AuthorityExamTiles />
        </div>
      </SectionBand>

      {/* Band 3: Latest PDFs */}
      <SectionBand surface="muted" density="standard" labelledBy="latest-pdfs-heading">
        <ScrollReveal>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 id="latest-pdfs-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
                  Latest PDFs
                </h2>
                <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
                  Direct SHA-256 verified solved MCQ booklets with file size and edition provenance.
                </p>
              </div>
              <Link
                href="/library"
                className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 text-sm font-bold text-[var(--dmc-brand-forest)] hover:underline"
              >
                <span>Browse Full PDF Library</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfs.slice(0, 3).map((pdf) => {
                const firstTopic = topicMap.get(pdf.topicIds[0] ?? '');
                const firstSubject = firstTopic ? subjectMap.get(firstTopic.subjectId) : undefined;
                return (
                  <PdfResourceCard
                    key={pdf.id}
                    pdf={pdf}
                    subjectLabel={firstSubject?.name}
                  />
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </SectionBand>

      {/* Band 4: World Geography Teaser (5:7 Split) */}
      <SectionBand surface="card" density="standard" labelledBy="geo-teaser-heading">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="inline-flex items-center gap-1.5 type-label-micro text-[var(--dmc-brand-forest)] bg-[var(--dmc-status-verified-bg)] px-3 py-1 rounded-full">
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Interactive Geography Module</span>
              </span>
              <h2 id="geo-teaser-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
                World Geography Reference &amp; Active Quiz
              </h2>
              <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
                Filter verified sovereign states by A-Z letter, continent, and region. Review high-yield golden answer pills first, then launch Tier 2 quiz drills on the same page.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/geography"
                  className="dmc-press inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-[var(--dmc-radius-button)] bg-[var(--dmc-accent-gold)] hover:bg-[var(--dmc-accent-gold-hover)] text-[var(--dmc-ink-primary)] text-sm font-bold"
                >
                  <span>Start</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              {featuredCountry ? (
                <CountryCard
                  country={featuredCountry}
                  currencies={featuredCountry.currencyIds
                    .map((id) => currencyMap.get(id))
                    .filter((c): c is NonNullable<typeof c> => Boolean(c))}
                  languages={featuredCountry.officialLanguageIds
                    .map((id) => languageMap.get(id))
                    .filter((l): l is NonNullable<typeof l> => Boolean(l))}
                  continentName={continentMap.get(featuredCountry.continentId)?.name}
                  regionName={regionMap.get(featuredCountry.regionId)?.name}
                />
              ) : null}
            </div>
          </div>
        </ScrollReveal>
      </SectionBand>

      {/* Band 5: MCQ Practice Entry + Subject Grid */}
      <SectionBand surface="ground" density="standard" labelledBy="mcq-entry-heading">
        <ScrollReveal>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 id="mcq-entry-heading" className="type-section-heading text-[var(--dmc-ink-primary)]">
                  Pick Exam &amp; Subject to Practice MCQs
                </h2>
                <p className="type-body-sm text-[var(--dmc-ink-secondary)]">
                  Single-question practice mode with locked answer verification, golden pills, explanations, and missed-question retry.
                </p>
              </div>
              <Link
                href="/mcq"
                className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-0 text-xs font-bold text-[var(--dmc-brand-forest)] hover:underline shrink-0"
              >
                <span>Advanced Topic Filters</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            <McqLauncherWidget
              exams={exams}
              subjects={subjects}
              topics={topics}
              questionCountsBySubject={questionCountsBySubject}
            />
          </div>
        </ScrollReveal>
      </SectionBand>

      {/* Band 6: Standing Trust Banner */}
      <StandingTrustNotice variant="band" />
    </div>
  );
}
