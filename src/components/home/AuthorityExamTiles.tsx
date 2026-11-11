import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';

interface ExamTileItem {
  code: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  featured?: boolean;
}

const EXAM_TILES: ExamTileItem[] = [
  {
    code: 'PPSC',
    title: 'PPSC Exams',
    subtitle: 'Punjab Provincial Cadres & Solved PDFs',
    href: '/ppsc',
    badge: 'Active Hub'
  },
  {
    code: 'CSS / PMS',
    title: 'CSS & PMS',
    subtitle: 'Federal & Provincial Screening Hub (In Progress)',
    href: '/css-pms',
    badge: 'Coming Soon'
  },
  {
    code: 'FPSC',
    title: 'FPSC Screening',
    subtitle: 'Federal General Recruitment Hub (In Progress)',
    href: '/fpsc',
    badge: 'Coming Soon'
  },
  {
    code: 'NTS',
    title: 'NTS Aptitude',
    subtitle: 'NAT, GAT General & Quantitative Prep (In Progress)',
    href: '/nts',
    badge: 'Coming Soon'
  },
  {
    code: 'IO BS-14',
    title: 'PPSC Intelligence Officer',
    subtitle: 'Direct BS-14 Provenance & Solved PDFs',
    href: '/ppsc/intelligent-officer',
    badge: 'BS-14 Featured',
    featured: true
  }
];

const TRUST_CHECKS = [
  'Free PDFs',
  'Solved MCQs',
  'Quiz Mode',
  'Verified Provenance',
  'Zero Ads',
  'No Signup'
];

export function AuthorityExamTiles() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {EXAM_TILES.map((tile) => (
          <Link
            key={tile.code}
            href={tile.href}
            className={`track-card group rounded-2xl p-3.5 sm:p-5 border elevation-1 flex flex-col justify-between space-y-3 sm:space-y-4 min-w-0 ${
              tile.featured
                ? 'col-span-2 sm:col-span-2 lg:col-span-1 bg-emerald-50/70 border-[var(--dmc-brand-forest)]/40 hover:border-[var(--dmc-brand-forest)]'
                : 'bg-[var(--dmc-surface-card)] border-[var(--dmc-border-subtle)] hover:border-[var(--dmc-brand-forest)]'
            }`}
          >
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CommissionBrandBadge
                  examCodeOrSlug={tile.featured ? 'ppsc' : tile.code}
                  size="lg"
                />
                {tile.badge && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      tile.featured
                        ? 'bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] border border-[var(--dmc-highlight-border)]'
                        : 'bg-slate-100 text-[var(--dmc-ink-secondary)]'
                    }`}
                  >
                    {tile.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="type-card-title text-base text-[var(--dmc-ink-primary)] group-hover:text-[var(--dmc-brand-forest)]">
                  {tile.title}
                </h3>
                <p className="text-xs text-[var(--dmc-ink-secondary)] mt-1 leading-relaxed">
                  {tile.subtitle}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-forest)] group-hover:underline">
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[var(--dmc-border-subtle)]">
        <ul className="flex flex-wrap items-center gap-2">
          {TRUST_CHECKS.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dmc-status-verified-ink)] bg-[var(--dmc-status-verified-bg)] border border-[var(--dmc-status-verified-border)]/30 px-2.5 py-1 rounded-full"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--dmc-ink-muted)]">
          <Shield className="w-3.5 h-3.5 text-[var(--dmc-ink-muted)] shrink-0" aria-hidden="true" />
          <span>Independent educational platform, not affiliated with PPSC, FPSC, NTS, or any commission.</span>
        </p>
      </div>
    </div>
  );
}

