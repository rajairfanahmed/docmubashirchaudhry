'use client';

import React, { useEffect, useState } from 'react';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import { GatedPdfDownloadButton } from '@/components/library/GatedPdfDownloadButton';

export interface StickyMobileDownloadBarProps {
  title: string;
  filePath: string;
  fileSizeBytes: number;
  pageCount?: number;
  pdfSlug?: string;
}

export function StickyMobileDownloadBar({
  title,
  filePath,
  fileSizeBytes,
  pageCount,
  pdfSlug
}: StickyMobileDownloadBarProps) {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const footer =
      document.querySelector('footer[role="contentinfo"]') ?? document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsFooterVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      data-sticky-download-bar="true"
      aria-hidden={isFooterVisible || undefined}
      className={cn(
        'md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur border-t border-[var(--color-border)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-3 elevation-3 min-h-[64px] transition-[transform,opacity] duration-200 motion-reduce:transition-none',
        isFooterVisible && 'translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-[var(--color-ink)] truncate">{title}</div>
        <div className="text-[11px] text-[var(--color-ink-muted)] tabular-nums">
          {formatBytes(fileSizeBytes)} &middot; {pageCount ? `${pageCount} pages` : 'PDF Booklet'}
        </div>
      </div>

      <GatedPdfDownloadButton
        pdfId={pdfSlug ?? title}
        title={title}
        fileSizeBytes={fileSizeBytes}
        fallbackPublicHref={filePath}
        tabIndex={isFooterVisible ? -1 : undefined}
        label="Download PDF"
      />
    </div>
  );
}
