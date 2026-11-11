import React from 'react';
import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import type { Source, Verification } from '@/lib/schemas';
import { formatVerificationDate } from '@/lib/format';
import { VerificationBadge } from './Badge';
import { cn } from '@/lib/utils';

export interface ProvenanceBoxProps {
  officialUrl?: string;
  officialLabel?: string;
  verification: Verification;
  sources: Source[];
  title?: string;
  summary?: string;
  className?: string;
}

export function ProvenanceBox({
  officialUrl,
  officialLabel = 'Official Portal',
  verification,
  sources,
  title,
  summary,
  className
}: ProvenanceBoxProps) {
  const isVerified = verification.status === 'verified';

  return (
    <div
      role="note"
      className={cn(
        'rounded-[var(--dmc-radius-card)] p-4 sm:p-5 border space-y-3 min-w-0',
        isVerified
          ? 'bg-[var(--dmc-status-verified-bg)]/60 border-[var(--dmc-status-verified-border)]/40 text-emerald-950'
          : 'bg-[var(--dmc-status-unverified-bg)] border-[var(--dmc-status-unverified-border)]/60 text-amber-950',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          {isVerified ? (
            <ShieldCheck className="w-4 h-4 text-[var(--dmc-status-verified-icon)] shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[var(--dmc-status-unverified-icon)] shrink-0" aria-hidden="true" />
          )}
          <span>{title ?? (isVerified ? 'Verified Primary Source' : 'Unverified Source Metadata')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge
            status={verification.status}
            label={isVerified ? 'Verified' : 'Unverified'}
          />
          <span className="text-[11px] font-semibold">
            Checked: {formatVerificationDate(verification.lastCheckedAt)}
          </span>
        </div>
      </div>

      {(summary || verification.notes) && (
        <p className="text-xs sm:text-sm leading-relaxed">
          {summary ? `${summary} ` : null}
          {verification.notes ??
            (!isVerified
              ? 'Always confirm closing dates, challenge fees, and qualification equivalence directly on the official commission portal.'
              : null)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-0 font-bold underline break-words"
          >
            <span>{officialLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </a>
        )}
        {sources.map((src) => (
          <a
            key={src.id}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-0 font-medium underline opacity-90 break-words"
          >
            <span>{src.title}</span>
            <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

