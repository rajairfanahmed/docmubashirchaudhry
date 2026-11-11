'use client';

export const DMC_NAV_START_EVENT = 'dmc:navigation-start';

/**
 * Signals the global TopLoadingBar that a programmatic client navigation
 * (e.g. `router.push(...)` from search submit or MCQ setup) has begun.
 */
export function notifyNavigationStart(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DMC_NAV_START_EVENT));
}

