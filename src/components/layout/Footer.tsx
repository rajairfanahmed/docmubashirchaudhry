import React from 'react';
import Link from 'next/link';
import { DmcLogo } from '@/components/branding/DmcLogo';
import { PageContainer } from '@/components/layout/PageContainer';

const STUDY_HUB_LINKS = [
  { label: 'World Geography', href: '/geography' },
  { label: 'PPSC Exam Hub', href: '/ppsc' },
  { label: 'FPSC Exam Hub', href: '/fpsc' },
  { label: 'All Examinations', href: '/exams' },
  { label: 'Solved PDF Library', href: '/library' },
  { label: 'Timed Mock Quizzes', href: '/quizzes' }
];

const EDITORIAL_POLICY_LINKS = [
  { label: 'About Doc Mubashir', href: '/about' },
  { label: 'Editorial Methodology', href: '/methodology' },
  { label: 'Report a Correction', href: '/corrections' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Copyright Notice', href: '/copyright' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' }
];

const USER_TOOL_LINKS = [
  { label: 'Search Portal', href: '/search' },
  { label: 'Practice MCQs', href: '/mcq' },
  { label: 'My Quiz Attempts', href: '/my-attempts' },
  { label: 'My Downloads', href: '/my-downloads' },
  { label: 'Platform Status', href: '/status' }
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      data-dmc-surface="dark"
      aria-labelledby="footer-heading"
      className="bg-[var(--dmc-brand-footer)] text-white border-t border-white/15"
    >
      <PageContainer className="py-12 sm:py-14">
        <h2 id="footer-heading" className="sr-only">
          Site Footer Navigation and Academic Attribution
        </h2>
        {/* Primary 4-Column Navigation Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand Summary (4 cols) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 group focus:outline-none rounded-[var(--radius-control)]"
              aria-label="DocMubashir Exam Portal Home"
            >
              <DmcLogo className="h-9 w-auto transition-transform duration-150 group-hover:scale-[1.03]" variant="inverted" />
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-tight text-white leading-none">
                  Doc<span className="text-emerald-300">Mubashir</span>
                </span>
                <span className="text-[11px] font-medium text-white/75 tracking-wide mt-1 leading-none">
                  Exam Preparation Portal
                </span>
              </div>
            </Link>

            <p className="text-sm text-white/80 leading-relaxed max-w-sm">
              Free, ad-free academic study portal for PPSC, FPSC, CSS, PMS, FIA, and PERA aspirants.
              Browse open geography reference records alongside free signed-in mock quizzes and verified solved PDF booklets.
            </p>
          </div>

          {/* Column 2: Study & Exam Hubs (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Study &amp; Exam Hubs
            </h3>
            <ul className="space-y-1 text-sm">
              {STUDY_HUB_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center min-h-[28px] py-1 text-white/80 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: About & Standards (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              About &amp; Standards
            </h3>
            <ul className="space-y-1 text-sm">
              {EDITORIAL_POLICY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center min-h-[28px] py-1 text-white/80 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Aspirant Tools (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Aspirant Tools
            </h3>
            <ul className="space-y-1 text-sm">
              {USER_TOOL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center min-h-[28px] py-1 text-white/80 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Structured Academic Profile & Independent Disclaimer */}
        <div className="border-t border-white/15 mt-10 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Prepared &amp; Curated By Doc Mubashir Chaudhry
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              Competitive Exam Educator, Researcher, Writer, Philanthropist, and Career Counselor
              guiding aspirants across PPSC, FPSC, CSS, PMS, FIA, and PERA preparation streams.
            </p>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              Academic Credentials: M.Phil. Biology and B.S. Botany (The University of Agriculture,
              Faisalabad), M.A. English, M.A. Political Science, B.A., B-Pharmacist qualification,
              and Basic IT Training.
            </p>
          </div>

          <div className="lg:col-span-4 rounded-xl border border-white/15 bg-white/[0.04] p-4 space-y-1.5">
            <div className="text-xs font-semibold text-white">
              Independent Academic Disclaimer
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Independent educational platform; not affiliated with PPSC, FPSC, NTS, or any
              government commission. Always verify official test updates directly.
            </p>
            <p className="text-xs font-semibold text-[var(--color-accent)] pt-0.5">
              Note: My views are personal and for academic debate only.
            </p>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-white/15 mt-8 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/75">
          <p>
            &copy; {currentYear} DocMubashir Exam Portal. Independent Open-Access Study Resource.
          </p>
          <p className="text-white/75">
            Free study guides, verified PDF booklets, and timed practice assessments.
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
