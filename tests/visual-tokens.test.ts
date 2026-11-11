import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { loadDefaultSnapshot } from '@/lib/data';
import {
  BRAND_SURFACE_TOKENS,
  FOLIO_COVER_TOKENS,
  MCQ_SHEET_TOKENS,
  STATUS_SEMANTIC_TOKENS,
  SUBJECT_PASTEL_TOKENS
} from '@/lib/tokens/visual-tokens';

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
      '--dmc-accent-gold: #f0b938;',
      '--dmc-highlight-bg: #fef08a;',
      '--dmc-highlight-ink: #78350f;',
      '--dmc-surface-ground: #fafbfc;',
      '--dmc-surface-card: #ffffff;',
      '--dmc-surface-mcq-sheet: #e6f4f1;',
      '--dmc-surface-mcq-sheet-tint: #f0fbf8;',
      '--dmc-mcq-heading: #14281d;',
      '--dmc-ring-track: #e5e7eb;'
    ];

    for (const tokenDecl of expectedVars) {
      expect(css).toContain(tokenDecl);
    }
  });

  it('keeps exported token maps strictly bound to CSS custom properties', () => {
    const allRefs = [
      ...Object.values(BRAND_SURFACE_TOKENS),
      ...Object.values(FOLIO_COVER_TOKENS),
      ...Object.values(MCQ_SHEET_TOKENS),
      ...Object.values(STATUS_SEMANTIC_TOKENS).flatMap((group) => Object.values(group))
    ];

    for (const ref of allRefs) {
      expect(ref).toMatch(/^var\(--dmc-/);
    }
  });
});

