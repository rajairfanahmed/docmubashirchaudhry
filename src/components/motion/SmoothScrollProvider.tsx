'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { isReducedMotionPreferred, useReducedMotion } from '@/lib/motion/useReducedMotion';

export interface ScrollTargetOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
}

interface SmoothScrollContextValue {
  scrollToTarget: (target: HTMLElement | string | number, options?: ScrollTargetOptions) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollToTarget: () => {}
});

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      lerp: 0.115,
      smoothWheel: true,
      autoRaf: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      anchors: {
        offset: -76
      },
      prevent: (node) => Boolean(node.closest('[data-lenis-prevent]'))
    });

    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      if (lenisRef.current === lenis) {
        lenisRef.current = null;
      }
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (previousPathRef.current === null) {
      previousPathRef.current = pathname;
      return;
    }

    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;

    if (typeof window === 'undefined') return;
    const hash = window.location.hash;

    if (!hash) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true, force: true });
      }
      return;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    window.requestAnimationFrame(() => {
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      if (lenisRef.current && !isReducedMotionPreferred()) {
        lenisRef.current.scrollTo(targetEl, { offset: -76, duration: 0.7 });
      } else {
        targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    });
  }, [pathname]);

  const scrollToTarget = useCallback(
    (target: HTMLElement | string | number, options: ScrollTargetOptions = {}) => {
      if (typeof window === 'undefined') return;

      const reduced = prefersReducedMotion || isReducedMotionPreferred();
      const offset = options.offset ?? -76;
      const immediate = options.immediate ?? reduced;

      if (lenisRef.current && !reduced) {
        lenisRef.current.scrollTo(target, {
          offset,
          immediate,
          duration: immediate ? 0 : (options.duration ?? 0.65)
        });
        return;
      }

      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
        return;
      }

      const element =
        typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;

      element?.scrollIntoView({
        behavior: immediate ? 'auto' : 'smooth',
        block: 'start'
      });
    },
    [prefersReducedMotion]
  );

  return (
    <SmoothScrollContext.Provider value={{ scrollToTarget }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll(): SmoothScrollContextValue {
  return useContext(SmoothScrollContext);
}

