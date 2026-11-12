import React from 'react';
import { cn } from '@/lib/utils';

export interface DmcLogoProps {
  className?: string;
  variant?: 'default' | 'inverted';
  decorative?: boolean;
}

/**
 * Pure transparent-background vector DMC emblem (no wrapping circle or square).
 */
export function DmcLogo({
  className = 'h-9 w-auto',
  variant = 'default',
  decorative = true
}: DmcLogoProps) {
  const primaryColor = variant === 'inverted' ? '#ECFDF5' : '#0E5A52';
  const accentColor = variant === 'inverted' ? '#4ADE80' : '#43A047';
  const starColor = variant === 'inverted' ? '#052E16' : '#FFFFFF';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 164"
      fill="none"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : 'DocMubashir DMC Logo'}
      className={cn('shrink-0 overflow-visible', className)}
    >
      {/* Outer Book-Bracket Silhouette (No Square or Circle Frame) */}
      <path
        d="M 65 28 L 28 28 Q 14 28 14 42 L 14 122 Q 14 136 28 136 L 86 136 C 103 136 112 145 120 154 C 128 145 137 136 154 136 L 212 136 Q 226 136 226 122 L 226 42 Q 226 28 212 28 L 179 28"
        stroke={primaryColor}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner Elevated Open Book & Top-Right Folded Page Corner */}
      <path
        d="M 73 10 Q 98 14 120 28 Q 142 14 154 11 L 172 30 L 172 124 Q 145 122 120 136 Q 95 122 73 124 Z"
        stroke={primaryColor}
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 154 11 L 154 30 L 172 30"
        stroke={primaryColor}
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Center Bookmark Ribbon Shaft & Arrowhead */}
      <path
        d="M 109 19 L 120 29 L 131 19 L 131 28 L 125.5 33 L 125.5 110 L 141 110 L 120 133 L 99 110 L 114.5 110 L 114.5 33 L 109 28 Z"
        fill={accentColor}
      />

      {/* Sparkle Star inside Arrowhead */}
      <path
        d="M 120 113.5 L 121.8 117.8 L 126 119.5 L 121.8 121.2 L 120 125.5 L 118.2 121.2 L 114 119.5 L 118.2 117.8 Z"
        fill={starColor}
      />

      {/* Geometric Letter: d */}
      <circle cx="43" cy="88" r="15" stroke={primaryColor} strokeWidth="10" />
      <path
        d="M 58 38 L 58 106"
        stroke={primaryColor}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Geometric Letter: m */}
      <path
        d="M 92 106 L 92 78 A 14 14 0 0 1 120 78 L 120 88 M 120 78 A 14 14 0 0 1 148 78 L 148 106"
        stroke={primaryColor}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Geometric Letter: c */}
      <path
        d="M 209 73 A 18 19 0 1 0 209 103"
        stroke={primaryColor}
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}

