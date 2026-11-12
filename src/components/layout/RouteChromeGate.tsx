'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Renders public navigation/footer slots on standard routes while omitting
 * public chrome on isolated /admin/* workspace routes.
 */
export interface RouteChromeGateProps {
  children: React.ReactNode;
  hideOnPractice?: boolean;
}

/**
 * Renders public navigation/footer slots on standard routes while omitting
 * public chrome on isolated /admin/* workspace routes (and optionally pre-footer CTA
 * on distraction-free practice runners).
 */
export function RouteChromeGate({ children, hideOnPractice = false }: RouteChromeGateProps) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  if (
    hideOnPractice &&
    (pathname === '/mcq/practice' || pathname?.startsWith('/quizzes/'))
  ) {
    return null;
  }
  return <>{children}</>;
}

