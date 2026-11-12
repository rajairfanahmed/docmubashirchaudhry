import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { loadDefaultSnapshot } from '@/lib/data';
import {
  BRAND_SURFACE_TOKENS,
  CHART_PALETTE_TOKENS,
  EDITORIAL_ELEVATION_TOKENS,
  EDITORIAL_RADII_TOKENS,
  EDITORIAL_SURFACE_TOKENS,
  EDITORIAL_TAXONOMY_TOKENS,
  EDITORIAL_TYPOGRAPHY_TOKENS,
  ELEVATION_TOKENS,
  FOLIO_COVER_TOKENS,
  MCQ_SHEET_TOKENS,
  RADII_SCALE_TOKENS,
  SEMANTIC_FEEDBACK_TOKENS,
  SPACING_SCALE_TOKENS,
  STATUS_SEMANTIC_TOKENS,
  SUBJECT_PASTEL_TOKENS,
  TIMER_STATE_TOKENS,
  TYPOGRAPHY_SCALE_TOKENS,
  V3_SURFACE_TOKENS
} from '@/lib/tokens/visual-tokens';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16)
  ];
}

function relativeLuminance(hex: string): number {
  const linear = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('Step 2 Visual Design Tokens', () => {
  it('defines semantic CSS variable references for all published taxonomy subjects', () => {
    const snapshot = loadDefaultSnapshot();

    for (const subject of snapshot.subjects) {
      const mapping = SUBJECT_PASTEL_TOKENS[subject.id];
      expect(mapping, `Missing visual token map for subject ${subject.id}`).toBeDefined();
      expect(mapping.bgVar).toMatch(/^var\(--dmc-subject-/);
      expect(mapping.inkVar).toMatch(/^var\(--dmc-subject-/);
    }

    expect(SUBJECT_PASTEL_TOKENS['sub-mixed']).toBeDefined();
  });

  it('populates every required CSS custom property in src/app/globals.css', () => {
    const cssPath = path.resolve(process.cwd(), 'src', 'app', 'globals.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    const expectedVars = [
      '--dmc-brand-forest: #0d4a28;',
      '--dmc-brand-dark: #08331b;',
      '--dmc-brand-emerald: #116135;',
      '--dmc-brand-surface: #093a1f;',
      '--dmc-brand-footer: #051c0e;',
      '--dmc-brand-ink: #14281d;',
      '--dmc-accent-gold: #f0b938;',
      '--dmc-accent-gold-ink: #14281d;',
      '--dmc-highlight-bg: #fef08a;',
      '--dmc-highlight-ink: #78350f;',
      '--dmc-surface-ground: #fafbfc;',
      '--dmc-surface-muted: #f1f5f9;',
      '--dmc-surface-card: #ffffff;',
      '--dmc-surface-mcq-sheet: #e6f4f1;',
      '--dmc-surface-mcq-sheet-tint: #f0fbf8;',
      '--dmc-mcq-heading: #14281d;',
      '--dmc-ring-track: #e5e7eb;',
      '--dmc-surface-mint-wash: #ecfdf5;',
      '--dmc-surface-mint-tonal: #d1fae5;',
      '--dmc-emerald-accent: #047857;',
      '--dmc-timer-safe-bg: #ecfdf5;',
      '--dmc-timer-safe-border: #047857;',
      '--dmc-timer-safe-ink: #065f46;',
      '--dmc-timer-warn-bg: #fffbeb;',
      '--dmc-timer-warn-border: #d97706;',
      '--dmc-timer-warn-ink: #92400e;',
      '--dmc-timer-danger-bg: #fef2f2;',
      '--dmc-timer-danger-border: #ef4444;',
      '--dmc-timer-danger-ink: #991b1b;',
      '--dmc-status-locked-bg: #f8fafc;',
      '--dmc-status-locked-border: #cbd5e1;',
      '--dmc-status-locked-ink: #334155;',
      '--dmc-leading-urdu: 2.1;'
    ];

    for (const tokenDecl of expectedVars) {
      expect(css).toContain(tokenDecl);
    }

    expect(css).toContain('.type-urdu');
    expect(css).toContain('.unicode-bidi-isolate');
    expect(css).toContain('.portrait-scrim');
    expect(css).toContain('.modal-scrim');
    expect(css).toContain('.elevation-3');
    expect(css.toLowerCase()).not.toContain('#dfff36');
    expect(css).not.toContain('\u2014');
  });

  it('keeps exported token maps strictly bound to CSS custom properties declared in globals.css', () => {
    const cssPath = path.resolve(process.cwd(), 'src', 'app', 'globals.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    const allRefs = [
      ...Object.values(BRAND_SURFACE_TOKENS),
      ...Object.values(FOLIO_COVER_TOKENS),
      ...Object.values(MCQ_SHEET_TOKENS),
      ...Object.values(STATUS_SEMANTIC_TOKENS).flatMap((group) => Object.values(group)),
      ...Object.values(V3_SURFACE_TOKENS),
      ...Object.values(TIMER_STATE_TOKENS).flatMap((group) => Object.values(group)),
      ...Object.values(CHART_PALETTE_TOKENS),
      ...Object.values(TYPOGRAPHY_SCALE_TOKENS),
      ...Object.values(SPACING_SCALE_TOKENS),
      ...Object.values(RADII_SCALE_TOKENS),
      ...Object.values(ELEVATION_TOKENS)
    ];

    for (const ref of allRefs) {
      expect(ref).toMatch(/^var\(--dmc-/);
      const varName = ref.slice(4, -1);
      expect(css).toContain(`${varName}:`);
    }
  });

  it('meets WCAG 2.2 AA/AAA contrast thresholds across tonal mint, timer, locked, gold, and chart pairs', () => {
    // Interactive emerald accent & tonal mint text
    expect(contrastRatio('#047857', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#065F46', '#ECFDF5')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#065F46', '#D1FAE5')).toBeGreaterThanOrEqual(4.5);

    // Timer states: text >= 4.5:1 (AAA/AA) and non-text pill borders >= 3.0:1
    expect(contrastRatio('#065F46', '#ECFDF5')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#047857', '#ECFDF5')).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatio('#92400E', '#FFFBEB')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#D97706', '#FFFBEB')).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatio('#991B1B', '#FEF2F2')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#EF4444', '#FEF2F2')).toBeGreaterThanOrEqual(3.0);

    // Locked, gold, muted, and chart series pairs
    expect(contrastRatio('#334155', '#F8FAFC')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#14281D', '#F0B938')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#475569', '#F1F5F9')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0D4A28', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0369A1', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#B45309', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('populates complete Refined Academic Editorial palette, typography, radii, elevation, and 4-tint taxonomy tokens', () => {
    const cssPath = path.resolve(process.cwd(), 'src', 'app', 'globals.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    const expectedEditorialDecls = [
      '--dmc-ed-page: #f7f8f5;',
      '--dmc-ed-surface: #ffffff;',
      '--dmc-ed-surface-soft: #f0f2ed;',
      '--dmc-ed-surface-raised: #fbfcfa;',
      '--dmc-ed-ink: #171c1a;',
      '--dmc-ed-ink-secondary: #4e5952;',
      '--dmc-ed-ink-muted: #747f77;',
      '--dmc-ed-border: #e2e7e1;',
      '--dmc-ed-border-strong: #c8d0c8;',
      '--dmc-ed-brand-deep: #204638;',
      '--dmc-ed-accent: #d9f36a;',
      '--dmc-ed-accent-ink: #192116;',
      '--dmc-ed-action: #19231d;',
      '--dmc-ed-action-hover: #29372f;',
      '--dmc-ed-success-bg: #eaf5ee;',
      '--dmc-ed-success-ink: #21633e;',
      '--dmc-ed-warning-bg: #fff4d9;',
      '--dmc-ed-warning-ink: #79520b;',
      '--dmc-ed-danger-bg: #fcedec;',
      '--dmc-ed-danger-ink: #a3342e;',
      '--dmc-ed-info-bg: #eaf1f8;',
      '--dmc-ed-info-ink: #315d86;',
      '--dmc-ed-dark-surface: #171c1a;',
      '--dmc-ed-dark-surface-raised: #19231d;'
    ];

    for (const decl of expectedEditorialDecls) {
      expect(css).toContain(decl);
    }

    expect(css).toContain('background-color: var(--color-page);');
    expect(css).toContain('color: var(--color-ink);');
    expect(css).toContain('.type-supporting');
    expect(css).toContain('.type-metadata');

    const editorialRefs = [
      ...Object.values(EDITORIAL_SURFACE_TOKENS),
      ...Object.values(SEMANTIC_FEEDBACK_TOKENS),
      ...Object.values(EDITORIAL_TYPOGRAPHY_TOKENS),
      ...Object.values(EDITORIAL_RADII_TOKENS),
      ...Object.values(EDITORIAL_ELEVATION_TOKENS),
      ...Object.values(EDITORIAL_TAXONOMY_TOKENS).flatMap((group) => [group.bgVar, group.inkVar])
    ];

    for (const ref of editorialRefs) {
      expect(ref).toMatch(/^var\(--[a-z0-9-]+\)$/);
      const varName = ref.slice(4, -1);
      expect(css).toContain(`${varName}:`);
    }
  });

  it('meets WCAG 2.2 AA/AAA luminance contrast across every Refined Academic Editorial pairing', () => {
    // Primary & secondary text on light surfaces
    expect(contrastRatio('#171C1A', '#F7F8F5')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#171C1A', '#FFFFFF')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#171C1A', '#F0F2ED')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#4E5952', '#FFFFFF')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#4E5952', '#F7F8F5')).toBeGreaterThanOrEqual(6.5);
    expect(contrastRatio('#4E5952', '#F0F2ED')).toBeGreaterThanOrEqual(6.0);

    // Brand deep, selective lime accent, and primary dark actions
    expect(contrastRatio('#204638', '#FFFFFF')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#192116', '#D9F36A')).toBeGreaterThanOrEqual(10.0);
    expect(contrastRatio('#FFFFFF', '#19231D')).toBeGreaterThanOrEqual(10.0);
    expect(contrastRatio('#FFFFFF', '#29372F')).toBeGreaterThanOrEqual(10.0);

    // Semantic feedback tokens
    expect(contrastRatio('#21633E', '#EAF5EE')).toBeGreaterThanOrEqual(6.0);
    expect(contrastRatio('#79520B', '#FFF4D9')).toBeGreaterThanOrEqual(6.0);
    expect(contrastRatio('#A3342E', '#FCEDEC')).toBeGreaterThanOrEqual(5.0);
    expect(contrastRatio('#315D86', '#EAF1F8')).toBeGreaterThanOrEqual(5.5);

    // Dark anchor surface & compact 4-tint taxonomy tokens
    expect(contrastRatio('#F7F8F5', '#171C1A')).toBeGreaterThanOrEqual(12.0);
    expect(contrastRatio('#C8D0C8', '#171C1A')).toBeGreaterThanOrEqual(9.0);
    expect(contrastRatio('#D9F36A', '#171C1A')).toBeGreaterThanOrEqual(10.0);
    expect(contrastRatio('#204638', '#EEF3EE')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#4E4A3E', '#F4F1EA')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#2B4D6B', '#EEF3F7')).toBeGreaterThanOrEqual(7.0);
    expect(contrastRatio('#354B24', '#F2F5E8')).toBeGreaterThanOrEqual(7.0);

    // Guard against #D9F36A ever being treated as readable foreground text on white
    expect(contrastRatio('#D9F36A', '#FFFFFF')).toBeLessThan(1.5);
  });
});

