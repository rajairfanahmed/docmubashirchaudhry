import React from 'react';
import type { ContentLanguage } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

export interface BilingualQuestionStemProps {
  language: ContentLanguage;
  textEn: string | null;
  textUr: string | null;
  id?: string;
  className?: string;
}

/**
 * Renders English LTR stems and Urdu RTL Nastaliq stems cleanly isolated from
 * bidirectional punctuation swaps across 'en' | 'ur' | 'bilingual' modes.
 */
export function BilingualQuestionStem({
  language,
  textEn,
  textUr,
  id,
  className
}: BilingualQuestionStemProps) {
  const showEn = Boolean(textEn && (language === 'en' || language === 'bilingual' || !textUr));
  const showUr = Boolean(textUr && (language === 'ur' || language === 'bilingual' || !textEn));

  return (
    <div id={id} className={cn('space-y-3', className)}>
      {showEn && textEn && (
        <p
          dir="ltr"
          lang="en"
          className="font-display font-bold text-base sm:text-lg text-[var(--color-ink)] type-prose-measure leading-snug unicode-bidi-isolate"
        >
          {textEn}
        </p>
      )}

      {showUr && textUr && (
        <p
          dir="rtl"
          lang="ur"
          className={cn(
            'type-urdu text-[var(--color-ink)] text-right leading-[2.1] unicode-bidi-isolate',
            showEn &&
              'bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-[var(--radius-control)] px-4 py-2.5 text-[var(--color-ink-secondary)]'
          )}
        >
          {textUr}
        </p>
      )}
    </div>
  );
}

