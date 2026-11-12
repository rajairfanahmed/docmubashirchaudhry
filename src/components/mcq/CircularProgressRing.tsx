import React from 'react';
import { cn } from '@/lib/utils';
import type { CircularProgressRingProps } from './types';

/**
 * SVG circular progress ring tailored to the /mcq/practice white card layout.
 * Bound strictly to --dmc-ring-track (#E5E7EB) and --dmc-mcq-heading (#14281D) / --dmc-brand-forest.
 */
export function CircularProgressRing({
  answeredCount,
  totalCount,
  sizePx = 116,
  strokeWidth,
  className
}: CircularProgressRingProps) {
  const safeTotal = Math.max(1, totalCount);
  const clampedAnswered = Math.min(Math.max(0, answeredCount), safeTotal);
  const resolvedStroke = strokeWidth ?? Math.max(5, Math.round(sizePx * 0.095));
  const radius = (sizePx - resolvedStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = clampedAnswered / safeTotal;
  const dashOffset = circumference * (1 - progressRatio);
  const isCompact = sizePx < 72;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: sizePx, height: sizePx }}
      role="img"
      aria-label={`${clampedAnswered} of ${totalCount} questions answered`}
    >
      <svg
        width={sizePx}
        height={sizePx}
        viewBox={`0 0 ${sizePx} ${sizePx}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={resolvedStroke}
        />
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          stroke="var(--color-action)"
          strokeWidth={resolvedStroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-[250ms] ease-out motion-reduce:transition-none"
        />
      </svg>
      <span
        className={cn(
          'absolute font-extrabold tabular-nums text-[var(--color-ink)] tracking-tight select-none',
          isCompact ? 'text-xs' : 'text-lg sm:text-xl'
        )}
      >
        {clampedAnswered}/{totalCount}
      </span>
    </div>
  );
}

