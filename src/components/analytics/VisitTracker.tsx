'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { v3Api } from '@/lib/v3/client';

const LAST_VISIT_STORAGE_KEY = 'dmc:v3:last-visit-path';

function shouldTrackPath(pathname: string | null): pathname is string {
  if (!pathname || !pathname.startsWith('/')) return false;
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return false;
  return true;
}

/**
 * Lightweight first-party site visit beacon fired when the browser becomes idle
 * on public/student routes. Never blocks paint or user interactions.
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldTrackPath(pathname) || typeof window === 'undefined') return;

    try {
      const lastRecorded = window.sessionStorage.getItem(LAST_VISIT_STORAGE_KEY);
      if (lastRecorded === pathname) return;
      window.sessionStorage.setItem(LAST_VISIT_STORAGE_KEY, pathname);
    } catch {
      // Ignore sessionStorage restrictions in private/restricted browsers
    }

    const sendVisit = () => {
      void v3Api.analytics.recordVisit(pathname).catch(() => {
        // Non-blocking telemetry: ignore transient network or rate-limit responses
      });
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(sendVisit, { timeout: 2500 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timerId = globalThis.setTimeout(sendVisit, 1200);
    return () => globalThis.clearTimeout(timerId);
  }, [pathname]);

  return null;
}
