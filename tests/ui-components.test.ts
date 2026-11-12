import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function readProjectFile(...segments: string[]): string {
  return fs.readFileSync(path.join(ROOT, ...segments), 'utf-8');
}

const STEP04_COMPONENT_FILES: string[][] = [
  ['src', 'components', 'branding', 'DmcLogo.tsx'],
  ['src', 'components', 'ui', 'FormPrimitives.tsx'],
  ['src', 'components', 'auth', 'AuthModal.tsx'],
  ['src', 'components', 'auth', 'AuthModalProvider.tsx'],
  ['src', 'components', 'library', 'GatedPdfDownloadButton.tsx'],
  ['src', 'components', 'library', 'CloudPdfCatalogSection.tsx'],
  ['src', 'components', 'quizzes', 'QuizCatalogCard.tsx'],
  ['src', 'components', 'quizzes', 'QuizCatalogClient.tsx'],
  ['src', 'components', 'quizzes', 'MockExamTimerBar.tsx'],
  ['src', 'components', 'quizzes', 'BilingualQuestionStem.tsx'],
  ['src', 'components', 'quizzes', 'ConfirmSubmitModal.tsx'],
  ['src', 'components', 'quizzes', 'QuizResultsPanel.tsx'],
  ['src', 'components', 'quizzes', 'QuizSessionRunner.tsx'],
  ['src', 'components', 'account', 'AttemptsHistoryClient.tsx'],
  ['src', 'components', 'account', 'DownloadsHistoryClient.tsx'],
  ['src', 'components', 'admin', 'AdminOverviewClient.tsx'],
  ['src', 'components', 'admin', 'AdminUsersClient.tsx'],
  ['src', 'components', 'admin', 'QuizFormModal.tsx'],
  ['src', 'components', 'admin', 'AdminQuizzesClient.tsx'],
  ['src', 'components', 'admin', 'CsvQuestionImporterModal.tsx'],
  ['src', 'components', 'admin', 'AdminQuestionsClient.tsx'],
  ['src', 'components', 'admin', 'AdminPdfsClient.tsx']
];

describe('Step 04 UI Components & Branding Integrity', () => {
  it('renders pure transparent DMC vector logo & favicons without square/circle enclosure', () => {
    const logoComponent = readProjectFile('src', 'components', 'branding', 'DmcLogo.tsx');
    const iconSvg = readProjectFile('public', 'icon.svg');
    const faviconSvg = readProjectFile('public', 'favicon.svg');
    const navbar = readProjectFile('src', 'components', 'layout', 'Navbar.tsx');
    const adminShell = readProjectFile('src', 'components', 'admin', 'AdminShell.tsx');
    const rootLayout = readProjectFile('src', 'app', 'layout.tsx');

    for (const svgSource of [logoComponent, iconSvg, faviconSvg]) {
      // No outer badge/box square, rounded square, or enclosing frame circle (small letter 'd' bowl circle r=15 is fine)
      expect(svgSource).not.toMatch(/<circle[^>]*\br="(?:[3-9]\d|\d{3,})"/i);
      expect(svgSource).not.toMatch(/<rect\b/i);
      expect(svgSource).not.toMatch(/<ellipse\b/i);
      expect(svgSource).toContain('fill="none"');
      expect(svgSource.toLowerCase()).toContain('#43a047');
    }

    expect(iconSvg).toContain('prefers-color-scheme: dark');
    expect(faviconSvg).toContain('prefers-color-scheme: dark');
    expect(navbar).toContain('<DmcLogo');
    expect(adminShell).toContain('<DmcLogo');
    expect(rootLayout).toContain('/icon.svg');
    expect(rootLayout).toContain('/favicon.svg');
  });

  it('implements all Step 04 interactive client components with zero raw R2 leaks and zero em dashes', () => {
    for (const segments of STEP04_COMPONENT_FILES) {
      const fullPath = path.join(ROOT, ...segments);
      expect(fs.existsSync(fullPath)).toBe(true);
      const source = fs.readFileSync(fullPath, 'utf-8');
      expect(source).not.toContain('\u2014');
    }

    const pdfCard = readProjectFile('src', 'components', 'library', 'PdfResourceCard.tsx');
    const pdfDetail = readProjectFile('src', 'components', 'library', 'PdfDetailPanel.tsx');
    const stickyBar = readProjectFile('src', 'components', 'library', 'StickyMobileDownloadBar.tsx');

    for (const file of [pdfCard, pdfDetail, stickyBar]) {
      expect(file).toContain('GatedPdfDownloadButton');
      expect(file).not.toContain('href={pdf.filePath}');
      expect(file.toLowerCase()).not.toContain('no login');
    }
  });

  it('keeps /admin strictly omitted from public navigation and footer chrome', () => {
    const navbar = readProjectFile('src', 'components', 'layout', 'Navbar.tsx');
    const footer = readProjectFile('src', 'components', 'layout', 'Footer.tsx');

    expect(navbar).not.toContain('/admin');
    expect(footer).not.toContain('/admin');
  });

  it('unifies Geography, Quizzes, and Practice MCQs on the Practice MCQ sheet and card design', () => {
    const practicePage = readProjectFile('src', 'app', 'mcq', 'practice', 'page.tsx');
    const geoWorkbench = readProjectFile('src', 'components', 'geography', 'GeographyWorkbench.tsx');
    const quizRunnerPage = readProjectFile('src', 'app', 'quizzes', '[slug]', 'page.tsx');

    for (const surfaceHost of [practicePage, geoWorkbench, quizRunnerPage]) {
      expect(surfaceHost).not.toContain('mcq-sheet-surface');
      expect(surfaceHost).not.toContain('<circle');
    }

    expect(practicePage).toContain('bg-[var(--color-surface-soft)]');
    expect(geoWorkbench).toContain('bg-[var(--color-surface-soft)]');
    expect(quizRunnerPage).toContain('bg-[var(--color-page)]');

    const practiceCard = readProjectFile('src', 'components', 'mcq', 'SingleQuestionCard.tsx');
    const geoCard = readProjectFile('src', 'components', 'geography', 'GeographyQuizCard.tsx');
    const quizRunner = readProjectFile('src', 'components', 'quizzes', 'QuizSessionRunner.tsx');

    for (const mcqCard of [practiceCard, geoCard, quizRunner]) {
      expect(mcqCard).toContain('CircularProgressRing');
      expect(mcqCard).toMatch(/Question \{(?:questionIndex|currentIndex) \+ 1\} of/);
      expect(mcqCard).toContain('rounded-lg');
      expect(mcqCard).not.toContain('w-7 h-7 rounded-lg');
    }

    expect(geoWorkbench).toContain('McqPaginationStrip');
    expect(geoWorkbench).toContain('Score:');
  });
});
