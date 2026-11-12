import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, Shield } from 'lucide-react';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';

interface ExamTileItem {
  code: string;
  label: string;
  subtitle: string;
  href: string;
  brandSlug?: string;
}

const EXAM_TILES: ExamTileItem[] = [
  {
    code: 'PPSC',
    label: 'Punjab Public Service Commission',
    subtitle: 'Active post blueprints, solved papers & PDFs',
    href: '/ppsc',
    brandSlug: 'ppsc'
  },
  {
    code: 'FPSC',
    label: 'Federal Public Service Commission',
    subtitle: 'Generalist, FIA & federal objective prep',
    href: '/fpsc',
    brandSlug: 'fpsc'
  },
  {
    code: 'CSS / PMS',
    label: 'Superior & Provincial Services',
    subtitle: 'MPT screening, one-paper & essay tracks',
    href: '/exams/css-pms',
    brandSlug: 'css-pms'
  },
  {
    code: 'NTS',
    label: 'National Testing Service',
    subtitle: 'NAT, GAT & screening exam guides',
    href: '/exams/nts',
    brandSlug: 'nts'
  },
  {
    code: 'Geography',
    label: 'World Geography & Countries',
    subtitle: 'Capitals, currencies, languages & recall quiz',
    href: '/geography'
  }
];

const TRUST_CHECKS = [
  'Open Reference Guides',
  'Free Sign-In for Quizzes & PDFs',
  'Watermarked Study Booklets',
  'Zero Ads'
];

export function AuthorityExamTiles() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {EXAM_TILES.map((tile) => (
          <Link
            key={tile.code}
            href={tile.href}
            className="track-card group bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] rounded-[var(--radius-panel)] p-4 sm:p-5 flex flex-col justify-between gap-4 elevation-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                {tile.brandSlug ? (
                  <CommissionBrandBadge examCodeOrSlug={tile.brandSlug} size="md" priority />
                ) : (
                  <span className="h-11 w-11 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-brand-deep)] inline-flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" aria-hidden="true" />
                  </span>
                )}
                <span className="text-xs font-semibold text-[var(--color-brand-deep)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-md">
                  {tile.code}
                </span>
              </div>

              <div>
                <div className="font-display font-semibold text-sm text-[var(--color-ink)] group-hover:text-[var(--color-brand-deep)] transition-colors leading-snug">
                  {tile.label}
                </div>
                <p className="text-xs text-[var(--color-ink-secondary)] mt-1 leading-relaxed">
                  {tile.subtitle}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-deep)] group-hover:underline">
              <span>Explore</span>
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
        <ul className="flex flex-wrap items-center gap-2">
          {TRUST_CHECKS.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-success-ink)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] px-2.5 py-1 rounded-md"
            >
              <CheckCircle2
                className="w-3.5 h-3.5 text-[var(--color-success-ink)] shrink-0"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-secondary)]">
          <Shield className="w-3.5 h-3.5 text-[var(--color-ink-muted)] shrink-0" aria-hidden="true" />
          <span>
            Independent educational platform, not affiliated with PPSC, FPSC, NTS, or any
            commission.
          </span>
        </p>
      </div>
    </div>
  );
}
