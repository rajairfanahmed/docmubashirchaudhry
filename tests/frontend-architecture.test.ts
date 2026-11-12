import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scrollToElementWithOffset } from '@/lib/motion/scroll';
import {
  EDITORIAL_SURFACE_TOKENS,
  MOTION_TOKENS,
  SEMANTIC_FEEDBACK_TOKENS,
} from '@/lib/tokens/visual-tokens';

const PROJECT_ROOT = process.cwd();

function readProjectFile(...segments: string[]): string {
  return fs.readFileSync(path.join(PROJECT_ROOT, ...segments), 'utf8');
}

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe('Step 1 Frontend Architecture Foundation', () => {
  it('retires lenis and canvas-confetti from providers, components, styles, and dependencies', () => {
    const srcFiles = collectSourceFiles(path.join(PROJECT_ROOT, 'src'));
    for (const file of srcFiles) {
      const contents = fs.readFileSync(file, 'utf8');
      expect(contents, `${file} should not reference lenis`).not.toMatch(/lenis/i);
      expect(contents, `${file} should not reference SmoothScroll`).not.toContain('SmoothScroll');
      expect(contents, `${file} should not import canvas-confetti`).not.toContain('canvas-confetti');
    }

    expect(
      fs.existsSync(path.join(PROJECT_ROOT, 'src', 'components', 'motion', 'SmoothScrollProvider.tsx'))
    ).toBe(false);

    const pkg = JSON.parse(readProjectFile('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.lenis).toBeUndefined();
    expect(pkg.dependencies?.['canvas-confetti']).toBeUndefined();
    expect(pkg.devDependencies?.['@types/canvas-confetti']).toBeUndefined();
  });

  it('wires root Providers cleanly with MotionConfig, LazyMotion, auth, toast, analytics, and TopLoadingBar', () => {
    const providers = readProjectFile('src', 'app', 'providers.tsx');
    expect(providers).toContain('MotionConfig reducedMotion="user"');
    expect(providers).toContain('LazyMotion features={domAnimation}');
    expect(providers).toContain('AuthSessionProvider');
    expect(providers).toContain('ToastProvider');
    expect(providers).toContain('AuthModalProvider');
    expect(providers).toContain('VisitTracker');
    expect(providers).toContain('TopLoadingBar');
  });

  it('registers editorial palette, semantic feedback, and motion CSS tokens cleanly', () => {
    const css = readProjectFile('src', 'app', 'globals.css');

    const expectedCssVars = [
      '--color-page',
      '--color-surface',
      '--color-surface-soft',
      '--color-surface-raised',
      '--color-ink',
      '--color-ink-secondary',
      '--color-ink-muted',
      '--color-border',
      '--color-border-strong',
      '--color-brand-deep',
      '--color-accent',
      '--color-accent-ink',
      '--color-action',
      '--color-action-hover',
      '--color-success-bg',
      '--color-success-ink',
      '--color-warning-bg',
      '--color-warning-ink',
      '--color-danger-bg',
      '--color-danger-ink',
      '--color-info-bg',
      '--color-info-ink',
      '--motion-duration-press',
      '--motion-duration-hover',
      '--motion-duration-popover',
      '--motion-duration-dialog',
      '--motion-duration-reveal',
      '--motion-duration-route',
      '--motion-duration-quiz',
      '--motion-ease-enter',
      '--motion-ease-exit',
    ];

    for (const cssVar of expectedCssVars) {
      expect(css, `${cssVar} should be registered in globals.css`).toContain(cssVar);
    }

    expect(EDITORIAL_SURFACE_TOKENS.page).toBe('var(--color-page)');
    expect(SEMANTIC_FEEDBACK_TOKENS.successBg).toBe('var(--color-success-bg)');
    expect(MOTION_TOKENS.durationHover).toBe('var(--motion-duration-hover)');
  });

  it('keeps scrollToElementWithOffset SSR-safe without window in Node tests', () => {
    expect(() => scrollToElementWithOffset(null)).not.toThrow();
    expect(() => scrollToElementWithOffset(undefined)).not.toThrow();
    expect(() => scrollToElementWithOffset('#reference-guide', { offset: -72 })).not.toThrow();
    expect(() => scrollToElementWithOffset(0, { immediate: true })).not.toThrow();
  });
});

