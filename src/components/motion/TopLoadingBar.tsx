'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DMC_NAV_START_EVENT } from '@/lib/motion/navigation-events';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

function TopLoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const isNavigatingRef = useRef(false);
  const trickleTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const routeKey = `${pathname ?? ''}?${searchParams?.toString() ?? ''}`;
  const lastRouteKeyRef = useRef(routeKey);

  const clearTimers = useCallback(() => {
    if (trickleTimerRef.current !== null) {
      window.clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finishLoading = useCallback(() => {
    if (!isNavigatingRef.current) return;
    isNavigatingRef.current = false;
    clearTimers();
    setProgress(1);
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = window.setTimeout(() => {
        setProgress(0);
      }, 160);
    }, prefersReducedMotion ? 60 : 180);
  }, [clearTimers, prefersReducedMotion]);

  const startLoading = useCallback(() => {
    clearTimers();
    isNavigatingRef.current = true;
    setVisible(true);
    setProgress(prefersReducedMotion ? 0.65 : 0.2);

    if (!prefersReducedMotion) {
      trickleTimerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 0.86) return prev;
          const step = prev < 0.5 ? 0.14 : prev < 0.72 ? 0.08 : 0.03;
          return Math.min(0.86, prev + step);
        });
      }, 150);
    }

    safetyTimerRef.current = window.setTimeout(() => {
      finishLoading();
    }, 5500);
  }, [clearTimers, finishLoading, prefersReducedMotion]);

  useEffect(() => {
    if (lastRouteKeyRef.current !== routeKey) {
      lastRouteKeyRef.current = routeKey;
      finishLoading();
    }
  }, [routeKey, finishLoading]);

  useEffect(() => {
    const onNavEvent = () => {
      startLoading();
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;
      if (
        anchor.hasAttribute('download') ||
        anchor.getAttribute('target') === '_blank' ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:')
      ) {
        return;
      }

      try {
        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;

        const currentBase = `${window.location.pathname}${window.location.search}`;
        const nextBase = `${nextUrl.pathname}${nextUrl.search}`;
        if (nextBase === currentBase) return;

        startLoading();
      } catch {
        // Ignore malformed hrefs
      }
    };

    window.addEventListener(DMC_NAV_START_EVENT, onNavEvent);
    document.addEventListener('click', onDocumentClick, true);

    return () => {
      window.removeEventListener(DMC_NAV_START_EVENT, onNavEvent);
      document.removeEventListener('click', onDocumentClick, true);
      clearTimers();
    };
  }, [clearTimers, startLoading]);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: prefersReducedMotion ? 'none' : 'opacity 180ms ease-out'
      }}
    >
      <div
        className="h-full w-full origin-left"
        style={{
          transform: `scaleX(${progress})`,
          background:
            'linear-gradient(90deg, var(--color-highlight-border) 0%, var(--color-accent-gold) 65%, var(--color-highlight-bg) 100%)',
          boxShadow: visible ? '0 0 8px rgba(240, 185, 56, 0.55)' : 'none',
          transition: prefersReducedMotion
            ? 'none'
            : 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      />
    </div>
  );
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarInner />
    </Suspense>
  );
}

