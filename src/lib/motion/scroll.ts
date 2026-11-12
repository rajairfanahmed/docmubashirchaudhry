import { isReducedMotionPreferred } from '@/lib/motion/useReducedMotion';

export interface ScrollToElementOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
}

export interface LenisScrollAdapter {
  scrollTo: (
    target: HTMLElement | string | number,
    options?: {
      offset?: number;
      immediate?: boolean;
      duration?: number;
    }
  ) => void;
}

let activeLenisAdapter: LenisScrollAdapter | null = null;

/**
 * Register or clear the active Lenis smooth scroll instance from SmoothScrollProvider.
 */
export function setActiveLenisScroll(adapter: LenisScrollAdapter | null): void {
  activeLenisAdapter = adapter;
}

/**
 * Scroll cleanly to a DOM element, selector, or vertical coordinate with an optional sticky-header offset.
 * Uses Lenis when active and falls back to native OS scrolling while honoring OS reduced-motion preferences.
 */
export function scrollToElementWithOffset(
  target: HTMLElement | string | number | null | undefined,
  options: ScrollToElementOptions = {}
): void {
  if (typeof window === 'undefined' || target === null || target === undefined) {
    return;
  }

  const reduced = isReducedMotionPreferred();
  const offset = options.offset ?? 0;
  const immediate = options.immediate || reduced;

  if (activeLenisAdapter && !immediate) {
    activeLenisAdapter.scrollTo(target, {
      offset,
      immediate: false,
      duration: options.duration ?? 0.65
    });
    return;
  }

  const behavior: ScrollBehavior = immediate ? 'auto' : 'smooth';

  if (typeof target === 'number') {
    window.scrollTo({
      top: Math.max(0, target + offset),
      behavior
    });
    return;
  }

  const element =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;

  if (!element) {
    return;
  }

  const targetTop = element.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior
  });
}
