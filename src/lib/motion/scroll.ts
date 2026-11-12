import { isReducedMotionPreferred } from '@/lib/motion/useReducedMotion';

export interface ScrollToElementOptions {
  offset?: number;
  immediate?: boolean;
}

/**
 * Scroll cleanly to a DOM element, selector, or vertical coordinate with an optional sticky-header offset.
 * Uses native browser scrolling and automatically honors OS reduced-motion preferences.
 */
export function scrollToElementWithOffset(
  target: HTMLElement | string | number | null | undefined,
  options: ScrollToElementOptions = {}
): void {
  if (typeof window === 'undefined' || target === null || target === undefined) {
    return;
  }

  const offset = options.offset ?? 0;
  const behavior: ScrollBehavior =
    options.immediate || isReducedMotionPreferred() ? 'auto' : 'smooth';

  if (typeof target === 'number') {
    window.scrollTo({
      top: Math.max(0, target + offset),
      behavior,
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
    behavior,
  });
}

