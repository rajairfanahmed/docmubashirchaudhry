import { describe, it, expect } from 'vitest';
import { isReducedMotionPreferred } from '@/lib/motion/useReducedMotion';
import { DMC_NAV_START_EVENT, notifyNavigationStart } from '@/lib/motion/navigation-events';

describe('Motion & Navigation Feedback Utilities', () => {
  it('returns false safely in non-browser SSR/Node environment', () => {
    expect(isReducedMotionPreferred()).toBe(false);
  });

  it('exposes the canonical navigation start event name and guards Node runtime calls', () => {
    expect(DMC_NAV_START_EVENT).toBe('dmc:navigation-start');
    expect(() => notifyNavigationStart()).not.toThrow();
  });
});

