import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

function readProjectFile(...segments: string[]): string {
  return fs.readFileSync(path.resolve(process.cwd(), ...segments), 'utf8');
}

function fileSizeKB(...segments: string[]): number {
  const bytes = fs.statSync(path.resolve(process.cwd(), ...segments)).size;
  return bytes / 1024;
}

describe('Step 10 Performance Budgets, Code Splitting & Asset Optimization', () => {
  it('keeps prebuilt static JSON payloads within docs/performance-optimization.md budgets', () => {
    expect(fileSizeKB('public', 'data', 'v1', 'search-index', 'all.json')).toBeLessThanOrEqual(150);
    expect(fileSizeKB('public', 'data', 'v1', 'geography', 'countries-quiz-v1.json')).toBeLessThanOrEqual(120);
    expect(fileSizeKB('public', 'data', 'v1', 'geography', 'pages', 'page-1.json')).toBeLessThanOrEqual(25);
    expect(fileSizeKB('public', 'data', 'v1', 'questions', 'pages', 'page-1.json')).toBeLessThanOrEqual(10);
  });

  it('prevents static ContentRepository JSON and MiniSearch bundling in client entrypoints', () => {
    const api = readProjectFile('src', 'lib', 'api.ts');
    const navSearch = readProjectFile('src', 'components', 'layout', 'NavbarSearch.tsx');
    const heroSearch = readProjectFile('src', 'components', 'home', 'HeroSearch.tsx');

    expect(api).not.toMatch(/import\s*\{[^}]*getContentRepository[^}]*\}\s*from\s*'@\/lib\/data'/);
    expect(api).toContain("await import('@/lib/data')");

    expect(navSearch).toContain("import type { PortalSearchEngine, SearchHit } from '@/lib/search'");
    expect(navSearch).toContain("import('@/lib/search')");

    expect(heroSearch).toContain("import type { PortalSearchEngine, SearchHit } from '@/lib/search'");
    expect(heroSearch).toContain("import('@/lib/search')");
  });

  it('lazy-loads heavy modals, Lenis smooth scroll, and quiz summary while splitting Subject Strip to RSC', () => {
    const geoWorkbench = readProjectFile('src', 'components', 'geography', 'GeographyWorkbench.tsx');
    const mcqRunner = readProjectFile('src', 'components', 'mcq', 'McqPracticeRunner.tsx');
    const mcqPreview = readProjectFile('src', 'components', 'mcq', 'McqQuestionsPreviewList.tsx');
    const authModalProvider = readProjectFile('src', 'components', 'auth', 'AuthModalProvider.tsx');
    const smoothScroll = readProjectFile('src', 'components', 'motion', 'SmoothScrollProvider.tsx');
    const providers = readProjectFile('src', 'app', 'providers.tsx');
    const geoScoreModal = readProjectFile('src', 'components', 'geography', 'GeographyScoreModal.tsx');
    const homePage = readProjectFile('src', 'app', 'page.tsx');

    expect(geoWorkbench).toContain("from 'next/dynamic'");
    expect(geoWorkbench).toContain("import('./GeographyScoreModal')");
    expect(geoWorkbench).toContain('isDefaultFirstPage');

    expect(authModalProvider).toContain("from 'next/dynamic'");
    expect(authModalProvider).toContain("import('@/components/auth/AuthModal')");

    expect(smoothScroll).toContain("import('lenis')");
    expect(smoothScroll).toContain('respectReducedMotion: true');

    expect(mcqRunner).toContain("from 'next/dynamic'");
    expect(mcqRunner).toContain("import('./McqSessionSummary')");

    expect(mcqPreview).toContain('hasServerProvidedPageOne');

    expect(providers).not.toContain('QueryClientProvider');
    expect(providers).toContain('SmoothScrollProvider');
    expect(geoScoreModal).not.toContain('canvas-confetti');

    expect(homePage).toContain('McqSubjectStrip');
    expect(homePage).toContain('hideSubjectStrip');
  });

  it('enforces font subsetting, metric fallback, explicit image dimensions, and resource hints', () => {
    const layout = readProjectFile('src', 'app', 'layout.tsx');
    const countryCard = readProjectFile('src', 'components', 'geography', 'CountryCard.tsx');
    const countryPage = readProjectFile('src', 'app', 'geography', '[slug]', 'page.tsx');
    const badge = readProjectFile('src', 'components', 'branding', 'CommissionBrandBadge.tsx');
    const pdfDetail = readProjectFile('src', 'components', 'library', 'PdfDetailPanel.tsx');

    expect(layout).toContain("from 'next/font/local'");
    expect(layout).toContain('plus-jakarta-sans-latin.woff2');
    expect(layout).toContain('inter-latin.woff2');
    expect(layout).toContain("weight: '600 700'");
    expect(layout).toContain("display: 'swap'");
    expect(layout).toContain("adjustFontFallback: 'Arial'");
    expect(layout).toContain('href="https://img.logo.dev"');
    expect(layout).toContain('href="https://flagcdn.com"');

    expect(countryCard).toContain('width={40}');
    expect(countryCard).toContain('height={27}');
    expect(countryCard).toContain('priority = false');

    expect(countryPage).toContain('width={112}');
    expect(countryPage).toContain('height={84}');
    expect(countryPage).toContain('fetchPriority="high"');

    expect(badge).toContain('width={pixelSize}');
    expect(badge).toContain('height={pixelSize}');

    expect(pdfDetail).toContain('width={480}');
    expect(pdfDetail).toContain('height={640}');
  });

  it('aligns edge caching headers, AVIF/WebP image formats, and package import optimization', () => {
    const nextConfig = readProjectFile('next.config.ts');
    const headersFile = readProjectFile('public', '_headers');

    expect(nextConfig).toContain('"image/avif"');
    expect(nextConfig).toContain('"image/webp"');
    expect(nextConfig).toContain('optimizePackageImports');

    for (const file of [nextConfig, headersFile]) {
      expect(file).toContain('/data/v1/');
      expect(file).toContain('/documents/');
      expect(file).toContain('/images/');
      expect(file).toContain('icon.svg');
      expect(file).toContain('favicon.svg');
      expect(file).toContain('stale-while-revalidate');
    }
  });
});

