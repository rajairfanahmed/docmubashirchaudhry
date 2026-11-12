'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type LenisType from 'lenis';
import { scrollToElementWithOffset, setActiveLenisScroll } from '@/lib/motion/scroll';
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
  const lenisRef = useRef<LenisType | null>(null);
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') {
      setActiveLenisScroll(null);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    let cancelled = false;
    let instance: LenisType | null = null;

    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      instance = new Lenis({
        lerp: 0.11,
        smoothWheel: true,
        autoRaf: true,
        stopInertiaOnNavigate: true,
        respectReducedMotion: true,
        anchors: {
          offset: -76
        },
        prevent: (node) => Boolean(node.closest('[data-lenis-prevent]'))
      });
      lenisRef.current = instance;
      setActiveLenisScroll(instance);
    });

    return () => {
      cancelled = true;
      setActiveLenisScroll(null);
      if (instance) {
        instance.destroy();
        if (lenisRef.current === instance) {
          lenisRef.current = null;
        }
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
      scrollToElementWithOffset(target, {
        offset: options.offset ?? -76,
        immediate: options.immediate ?? prefersReducedMotion,
        duration: options.duration ?? 0.65
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

