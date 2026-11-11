import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { CommissionBrandBadge } from '@/components/branding/CommissionBrandBadge';

export interface PostCardProps {
  slug: string;
  title: string;
  department: string;
  grade: string;
  syllabusTopics: string[];
  solvedMcqCount: number;
  status: string;
}

export function PostCard({
  slug,
  title,
  department,
  grade,
  syllabusTopics,
  solvedMcqCount,
  status
}: PostCardProps) {
  return (
    <div className="track-card flex flex-col justify-between bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-2xl p-4 sm:p-6 lg:p-7 elevation-1 border-t-4 border-t-[var(--dmc-brand-forest)] min-w-0">
      <div className="space-y-4 min-w-0">
        {/* Post Department & Status */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <CommissionBrandBadge examCodeOrSlug="ppsc" size="md" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--dmc-ink-muted)] truncate">{department}</div>
              <h3 className="text-lg font-bold text-[var(--dmc-ink-primary)] mt-0.5 break-words">{title}</h3>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] px-2.5 py-0.5 rounded-full shrink-0">
            {grade}
          </span>
        </div>

        {/* Post Quick Stats */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--dmc-ink-secondary)] bg-[var(--dmc-surface-muted)] border border-[var(--dmc-border-subtle)] rounded-xl p-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
            <span className="font-bold text-[var(--dmc-ink-primary)]">
              {solvedMcqCount > 0 ? `${solvedMcqCount}+ MCQs` : 'Solved PDF Booklets'}
            </span>
          </div>
          <span className="text-[var(--dmc-border-strong)]" aria-hidden="true">&middot;</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[var(--dmc-status-verified-ink)]">{status}</span>
          </div>
        </div>

        {/* Syllabus Coverage Chips */}
        <div>
          <div className="text-[11px] font-bold text-[var(--dmc-ink-muted)] uppercase tracking-wider mb-2">
            Syllabus Covered
          </div>
          <div className="flex flex-wrap gap-1.5">
            {syllabusTopics.map((topic) => (
              <span
                key={topic}
                className="text-[11px] font-medium bg-[var(--dmc-surface-muted)] text-[var(--dmc-ink-secondary)] border border-[var(--dmc-border-subtle)] px-2.5 py-0.5 rounded-md"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6 mt-auto">
        <Link
          href={`/ppsc/${slug}`}
          className="dmc-press inline-flex items-center justify-center gap-2 w-full min-h-[44px] bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white font-bold text-sm py-2.5 px-4 rounded-xl elevation-1"
        >
          <span>View Post &amp; Download PDF</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

