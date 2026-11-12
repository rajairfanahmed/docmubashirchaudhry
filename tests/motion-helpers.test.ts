import { describe, it, expect } from 'vitest';
import { isReducedMotionPreferred } from '@/lib/motion/useReducedMotion';
import { DMC_NAV_START_EVENT, notifyNavigationStart } from '@/lib/motion/navigation-events';
import { scrollToElementWithOffset, setActiveLenisScroll } from '@/lib/motion/scroll';

describe('Motion & Navigation Feedback Utilities', () => {
  it('returns false safely in non-browser SSR/Node environment', () => {
    expect(isReducedMotionPreferred()).toBe(false);
  });

  it('exposes the canonical navigation start event name and guards Node runtime calls', () => {
    expect(DMC_NAV_START_EVENT).toBe('dmc:navigation-start');
    expect(() => notifyNavigationStart()).not.toThrow();
  });

  it('registers Lenis scroll adapter cleanly and guards Node SSR scroll calls', () => {
    const adapter = { scrollTo: () => {} };
    expect(() => setActiveLenisScroll(adapter)).not.toThrow();
    expect(() => scrollToElementWithOffset('#quiz-module', { offset: -76 })).not.toThrow();
    expect(() => setActiveLenisScroll(null)).not.toThrow();
  });
});

