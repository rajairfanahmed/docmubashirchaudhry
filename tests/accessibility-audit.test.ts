import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

function readProjectFile(...segments: string[]): string {
  return fs.readFileSync(path.resolve(process.cwd(), ...segments), 'utf8');
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16)
  ];
}

function relativeLuminance(hex: string): number {
  const toLinear = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Step 9 WCAG 2.2 AA Accessibility Audit', () => {
  it('enforces WCAG AA/AAA luminance contrast across all core and dark-surface token pairs', () => {
    // AAA highlights & badges (>= 7:1)
    expect(contrastRatio('#78350F', '#FEF08A')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#0F172A', '#FFFFFF')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#475569', '#FAFBFC')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#FFFFFF', '#0D4A28')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#FFFFFF', '#08331B')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#0F172A', '#F0B938')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#065F46', '#ECFDF5')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#991B1B', '#FEF2F2')).toBeGreaterThanOrEqual(7.0);

    // Unverified caution Amber-800 on Amber-50 passes AA (6.84:1 >= 4.5:1)
    expect(contrastRatio('#92400E', '#FFFBEB')).toBeGreaterThanOrEqual(4.5);

    // Muted secondary slate-500 metadata passes 4.5:1 AA on white
    expect(contrastRatio('#64748B', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);

    // Dark-surface gold focus rings & footer links pass non-text 3:1 and AAA text thresholds
    expect(contrastRatio('#F0B938', '#051C0E')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#F0B938', '#08331B')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#F0B938', '#0D4A28')).toBeGreaterThanOrEqual(3.0);

    // Confirm why slate-400 (#94A3B8) is prohibited on white surfaces (< 3:1)
    expect(contrastRatio('#94A3B8', '#FFFFFF')).toBeLessThan(3.0);
  });

  it('defines light and dark-surface :focus-visible rules and reduced-motion safeguards in globals.css', () => {
    const css = readProjectFile('src', 'app', 'globals.css');

    expect(css).toContain(':focus-visible');
    expect(css).toContain('var(--dmc-brand-forest)');
    expect(css).toContain(":is(footer, [data-dmc-surface='dark']) :focus-visible");
    expect(css).toContain('var(--dmc-accent-gold)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('provides skip-link landmark flow, #dmc-app-shell wrapper, and dark-surface attributes', () => {
    const layout = readProjectFile('src', 'app', 'layout.tsx');
    const navbar = readProjectFile('src', 'components', 'layout', 'Navbar.tsx');
    const footer = readProjectFile('src', 'components', 'layout', 'Footer.tsx');
    const band = readProjectFile('src', 'components', 'layout', 'SectionBand.tsx');
    const preFooter = readProjectFile('src', 'components', 'layout', 'PreFooterCta.tsx');
    const trustNotice = readProjectFile('src', 'components', 'layout', 'StandingTrustNotice.tsx');
    const adminShell = readProjectFile('src', 'components', 'admin', 'AdminShell.tsx');

    expect(layout).toContain('id="dmc-app-shell"');
    expect(layout).toContain('<main id="main-content" role="main"');

    expect(navbar).toContain('href="#main-content"');
    expect(navbar).toContain('Skip to main content');
    expect(navbar).toContain('usePathname');
    expect(navbar).toContain('setIsMobileMenuOpen(false)');
    expect(navbar).toContain('mobileDrawerRef');
    expect(navbar).toContain('mobileCloseBtnRef');

    expect(adminShell).toContain('href="#main-content"');
    expect(adminShell).toContain('Skip to main content');

    expect(footer).toContain('data-dmc-surface="dark"');
    expect(footer).toContain('id="footer-heading"');
    expect(footer).not.toContain('text-slate-400');
    expect(band).toContain('data-dmc-surface');
    expect(preFooter).toContain('data-dmc-surface="dark"');
    expect(trustNotice).toContain('data-dmc-surface="dark"');
  });

  it('isolates background inertness, portals to document.body, and manages focus in Modal.tsx', () => {
    const modal = readProjectFile('src', 'components', 'ui', 'Modal.tsx');

    expect(modal).toContain('createPortal');
    expect(modal).toContain('document.body');
    expect(modal).toContain('getElementById(\'dmc-app-shell\')');
    expect(modal).toContain('inert');
    expect(modal).toContain('aria-hidden');
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain('onCloseRef');
  });

  it('prevents focus loss on locked options, omits pre-lock spoilers, and guards focus across MCQ transitions', () => {
    const mcqCard = readProjectFile('src', 'components', 'mcq', 'SingleQuestionCard.tsx');
    const geoCard = readProjectFile('src', 'components', 'geography', 'GeographyQuizCard.tsx');
    const strip = readProjectFile('src', 'components', 'mcq', 'McqPaginationStrip.tsx');
    const runner = readProjectFile('src', 'components', 'mcq', 'McqPracticeRunner.tsx');
    const summary = readProjectFile('src', 'components', 'mcq', 'McqSessionSummary.tsx');

    for (const card of [mcqCard, geoCard]) {
      expect(card).not.toContain('disabled={isLocked}');
      expect(card).toContain('aria-disabled={isLocked || undefined}');
      expect(card).toContain('aria-labelledby=');
      expect(card).toContain('aria-live="polite"');
      expect(card).toContain('sr-only');
      expect(card).not.toContain('data-correct');
      expect(card).not.toContain('opacity-75');
    }

    expect(strip).toContain('min-h-[44px] min-w-[44px]');
    expect(strip).toContain("isAnswered ? 'answered' : 'unanswered'");

    expect(runner).toContain('mcq-summary-heading');
    expect(runner).toContain('question-stage-heading');
    expect(summary).toContain('id="mcq-summary-heading"');
  });

  it('implements WAI-ARIA tablist + tabpanel keyboard navigation in SearchResultsGroup and removes slate-400 in NavbarSearch', () => {
    const tabs = readProjectFile('src', 'components', 'search', 'SearchResultsGroup.tsx');
    const navSearch = readProjectFile('src', 'components', 'layout', 'NavbarSearch.tsx');

    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('role="tab"');
    expect(tabs).toContain('role="tabpanel"');
    expect(tabs).toContain('aria-controls="search-results-panel"');
    expect(tabs).toContain('ArrowLeft');
    expect(tabs).toContain('ArrowRight');
    expect(tabs).toContain('Home');
    expect(tabs).toContain('End');

    expect(navSearch).not.toContain('slate-400');
  });
});
