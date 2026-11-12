import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readProjectFile(...segments: string[]): string {
  return fs.readFileSync(path.resolve(process.cwd(), ...segments), 'utf8');
}

const STEP03_FILES = [
  ['src', 'components', 'layout', 'PageContainer.tsx'],
  ['src', 'components', 'layout', 'Navbar.tsx'],
  ['src', 'components', 'layout', 'Footer.tsx'],
  ['src', 'components', 'layout', 'StandingTrustNotice.tsx'],
  ['src', 'components', 'layout', 'PreFooterCta.tsx'],
  ['src', 'components', 'home', 'AuthorityExamTiles.tsx'],
  ['src', 'app', 'page.tsx'],
  ['src', 'app', 'quizzes', 'page.tsx'],
  ['src', 'app', 'quizzes', '[slug]', 'page.tsx'],
  ['src', 'app', 'my-attempts', 'page.tsx'],
  ['src', 'app', 'my-downloads', 'page.tsx'],
  ['src', 'components', 'admin', 'AdminShell.tsx'],
  ['src', 'app', 'admin', 'page.tsx'],
  ['src', 'app', 'admin', 'users', 'page.tsx'],
  ['src', 'app', 'admin', 'quizzes', 'page.tsx'],
  ['src', 'app', 'admin', 'questions', 'page.tsx'],
  ['src', 'app', 'admin', 'pdfs', 'page.tsx']
];

describe('Step 03 Structural Layout Shell', () => {
  it('enforces primary navigation links, auth slot, and zero /admin links in Navbar', () => {
    const navbar = readProjectFile('src', 'components', 'layout', 'Navbar.tsx');

    expect(navbar).toContain("href: '/'");
    expect(navbar).toContain("href: '/geography'");
    expect(navbar).toContain("href: '/ppsc'");
    expect(navbar).toContain("href: '/fpsc'");
    expect(navbar).toContain("href: '/library'");
    expect(navbar).toContain("href: '/quizzes'");
    expect(navbar).toContain('lg:grid-cols-[1fr_auto_1fr]');
    expect(navbar).not.toContain('NavbarSearch');
    expect(navbar).not.toContain('/admin');

    expect(navbar).toContain('useAuthSession');
    expect(navbar).toContain('useAuthModal');
    expect(navbar).toContain('/my-attempts');
    expect(navbar).toContain('/my-downloads');
    expect(navbar).toContain('href="#main-content"');
    expect(navbar).toContain('Skip to main content');
    expect(navbar).toContain('setIsMobileMenuOpen(false)');
  });

  it('includes the readable educator credit, institutional links, and disclaimer in Footer and meta', () => {
    const footer = readProjectFile('src', 'components', 'layout', 'Footer.tsx');
    const layout = readProjectFile('src', 'app', 'layout.tsx');

    expect(footer).toContain('Note: My views are personal and for academic debate only.');
    expect(footer).toContain('Doc Mubashir Chaudhry');
    expect(footer).toContain('The University of Agriculture,');
    expect(footer).toContain("href: '/about'");
    expect(footer).toContain("href: '/methodology'");
    expect(footer).toContain("href: '/corrections'");
    expect(footer).toContain("href: '/copyright'");
    expect(footer).toContain("href: '/accessibility'");
    expect(footer).toContain("href: '/privacy'");
    expect(footer).toContain('border-t border-white/15');
    expect(footer).toContain('data-dmc-surface="dark"');
    expect(footer).not.toContain('text-slate-400');

    expect(layout).not.toContain('StandingTrustNotice');
    expect(layout).toContain(
      'Notes, MCQs, quizzes, practice material and other useful resources, all in one place for PPSC and FPSC aspirants.'
    );
  });

  it('removes stale no-login and no-signup claims across layout and trust components', () => {
    const filesToCheck = [
      readProjectFile('src', 'components', 'layout', 'Navbar.tsx'),
      readProjectFile('src', 'components', 'layout', 'Footer.tsx'),
      readProjectFile('src', 'components', 'layout', 'StandingTrustNotice.tsx'),
      readProjectFile('src', 'components', 'layout', 'PreFooterCta.tsx'),
      readProjectFile('src', 'components', 'home', 'AuthorityExamTiles.tsx')
    ];

    for (const content of filesToCheck) {
      expect(content.toLowerCase()).not.toContain('no login');
      expect(content.toLowerCase()).not.toContain('zero login');
      expect(content.toLowerCase()).not.toContain('no signup');
    }
  });

  it('renders light-first editorial split hero, verified portrait, and preserved MCQ hooks on Homepage', () => {
    const home = readProjectFile('src', 'app', 'page.tsx');

    expect(home).toContain(
      'Notes, MCQs, quizzes, practice material and other useful resources, all in one place'
    );
    expect(home).toContain('/images/mubashirchaudhry1 (3).jpg');
    expect(home).toContain('portrait-scrim');
    expect(home).toContain('McqSubjectStrip');
    expect(home).toContain('hideSubjectStrip');
    expect(home).toContain('<span>Start Geography Quiz</span>');
    expect(home).toContain('surface="hero"');
    expect(home).not.toContain('hero-gradient');
    expect(home).not.toContain('<span>Start</span>');
    expect(home).not.toContain('lh3.googleusercontent.com');
  });

  it('uses calm editorial stage topology on practice/quiz routes and isolates AdminShell', () => {
    const quizRunnerPage = readProjectFile('src', 'app', 'quizzes', '[slug]', 'page.tsx');
    const practicePage = readProjectFile('src', 'app', 'mcq', 'practice', 'page.tsx');
    const quizzesCatalog = readProjectFile('src', 'app', 'quizzes', 'page.tsx');
    const quizRunnerClient = readProjectFile(
      'src',
      'components',
      'quizzes',
      'QuizSessionRunner.tsx'
    );
    const adminShell = readProjectFile('src', 'components', 'admin', 'AdminShell.tsx');

    expect(quizRunnerPage).toContain('bg-[var(--color-page)]');
    expect(quizRunnerPage).not.toContain('mcq-sheet-surface');
    expect(quizRunnerPage).toContain('QuizSessionRunner');
    expect(quizRunnerPage).toContain('notoNastaliqUrdu.variable');

    expect(practicePage).not.toContain('mcq-sheet-surface');
    expect(practicePage).not.toContain('strokeWidth="48"');
    expect(quizzesCatalog).not.toContain('hero-gradient');

    expect(quizRunnerClient).toContain('CircularProgressRing');
    expect(quizRunnerClient).toContain('lg:grid-cols-[1fr_170px]');

    expect(adminShell).toContain("href: '/admin'");
    expect(adminShell).toContain("href: '/admin/users'");
    expect(adminShell).toContain("href: '/admin/quizzes'");
    expect(adminShell).toContain("href: '/admin/questions'");
    expect(adminShell).toContain("href: '/admin/pdfs'");
    expect(adminShell).toContain('Return to Public Site');
  });

  it('contains zero Unicode em dashes across all Step 03 files', () => {
    for (const segments of STEP03_FILES) {
      const content = readProjectFile(...segments);
      expect(content, `${segments.join('/')} must not contain U+2014 em dashes`).not.toContain(
        '\u2014'
      );
    }
  });
});

