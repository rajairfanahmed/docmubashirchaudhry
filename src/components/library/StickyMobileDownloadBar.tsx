'use client';

import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface StickyMobileDownloadBarProps {
  title: string;
  filePath: string;
  fileSizeBytes: number;
  pageCount?: number;
}

export function StickyMobileDownloadBar({
  title,
  filePath,
  fileSizeBytes,
  pageCount
}: StickyMobileDownloadBarProps) {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const footer = document.querySelector('footer[role="contentinfo"]') ?? document.querySelector('footer');
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
        'md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[var(--dmc-border-subtle)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-3 elevation-3 min-h-[64px] transition-[transform,opacity] duration-200 motion-reduce:transition-none',
        isFooterVisible && 'translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-[var(--dmc-ink-primary)] truncate">{title}</div>
        <div className="text-[11px] text-[var(--dmc-ink-muted)] tabular-nums">
          {formatBytes(fileSizeBytes)} &middot; {pageCount ? `${pageCount} pages` : 'PDF Booklet'}
        </div>
      </div>

      <a
        href={filePath}
        download
        tabIndex={isFooterVisible ? -1 : undefined}
        className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-brand-emerald)] text-white text-xs font-bold px-4 py-2 rounded-[var(--dmc-radius-button)] shrink-0"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Download PDF</span>
      </a>
    </div>
  );
}

