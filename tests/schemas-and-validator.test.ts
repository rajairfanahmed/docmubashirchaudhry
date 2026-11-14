import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { loadDefaultSnapshot, getContentRepository } from '@/lib/data';
import { validateDatasetBundle, type DatasetBundleInput } from '@/lib/validation/dataset-validator';
import { parseCsvRows } from '../scripts/import-csv';

function cloneBundle(): DatasetBundleInput {
  return structuredClone(loadDefaultSnapshot()) as unknown as DatasetBundleInput;
}

describe('Dataset Validation Engine (15 PRD Rules)', () => {
  it('validates the canonical production src/data/ dataset with zero errors including real PDF hashes', () => {
    const snapshot = loadDefaultSnapshot();
    const report = validateDatasetBundle(snapshot, {
      publicRootDir: path.resolve(process.cwd(), 'public'),
      referenceDate: new Date('2026-11-11T00:00:00Z')
    });

    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.counts.countries).toBe(250);
    expect(report.counts.pdfResources).toBe(0);
    expect(report.counts.questions).toBe(0);
  });

  it('rejects a published record marked unverified or lacking sourceIds', () => {
    const bundle = cloneBundle();
    (bundle.countries[0] as Record<string, unknown>).verification = {
      status: 'unverified',
      sourceIds: [],
      lastCheckedAt: '2026-11-11',
      reviewIntervalDays: 180
    };

    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R04_PUBLISHED_UNVERIFIED')).toBe(true);
    expect(report.errors.some((e) => e.ruleId === 'R04_EMPTY_SOURCES')).toBe(true);
  });

  it('rejects broken foreign keys across sources and geography hierarchy', () => {
    const bundle = cloneBundle();
    const first = bundle.countries[0] as Record<string, unknown>;
    first.regionId = 'reg-western-europe'; // Asia country pointing to Europe region
    (first.verification as Record<string, unknown>).sourceIds = ['src-nonexistent'];

    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R03_REGION_CONTINENT_MISMATCH')).toBe(true);
    expect(report.errors.some((e) => e.ruleId === 'R03_FK_SOURCE')).toBe(true);
  });

  it('rejects duplicate ids and slugs', () => {
    const bundle = cloneBundle();
    bundle.countries.push(structuredClone(bundle.countries[0]));

    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R02_UNIQUE_ID')).toBe(true);
    expect(report.errors.some((e) => e.ruleId === 'R02_UNIQUE_SLUG')).toBe(true);
  });

  it('rejects MCQ questions with invalid correctOptionId or duplicate option text', () => {
    const bundle = cloneBundle();
    bundle.questions = [
      {
        id: 'q-test-invalid',
        slug: 'q-test-invalid',
        stem: 'Sample stem for validation?',
        options: [
          { id: 'a', text: 'Duplicate option' },
          { id: 'b', text: 'Duplicate option' },
          { id: 'c', text: 'Option C' },
          { id: 'd', text: 'Option D' }
        ],
        correctOptionId: 'e' as any,
        explanation: 'Sample explanation',
        difficulty: 'easy',
        topicIds: ['top-general-knowledge'],
        postIds: [],
        attribution: 'self_written',
        status: 'published',
        verification: {
          status: 'verified',
          sourceIds: [(bundle.sources[0] as { id: string }).id],
          lastCheckedAt: '2026-11-11',
          reviewIntervalDays: 180
        }
      } as any
    ];

    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R01_SCHEMA_VALIDATION')).toBe(true);
  });

  it('rejects Blueprint whose editorial weights do not sum to 100 or lack disclaimer', () => {
    const bundle = cloneBundle();
    const bp = bundle.blueprints[0] as {
      editorialDisclaimer: string;
      editorialTopicWeights: Array<{ estimatedWeightPct: number }>;
    };
    bp.editorialDisclaimer = 'Study guide breakdown'; // omits "editorial"
    bp.editorialTopicWeights[0].estimatedWeightPct = 99;

    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R06_EDITORIAL_DISCLAIMER_REQUIRED')).toBe(true);
    expect(report.errors.some((e) => e.ruleId === 'R06_EDITORIAL_SUM_100')).toBe(true);
  });

  it('rejects disputed country entries missing disputedNote', () => {
    const bundle = cloneBundle();
    (bundle.countries[0] as Record<string, unknown>).disputed = {
      capital: true,
      disputedNote: ''
    };

    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R01_SCHEMA_VALIDATION')).toBe(true);
  });

  it('rejects PDF size/SHA-256 mismatches against files on disk', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dmc-pdf-mismatch-'));
    try {
      const docsSubdir = path.join(tmpRoot, 'documents', 'test');
      fs.mkdirSync(docsSubdir, { recursive: true });
      const testFilePath = path.join(docsSubdir, 'sample.pdf');
      fs.writeFileSync(testFilePath, '%PDF-1.4 dummy valid header and test body');

      const bundle = cloneBundle();
      bundle.pdfResources = [
        {
          id: 'pdf-test-mismatch',
          slug: 'pdf-test-mismatch',
          title: 'Test Booklet',
          author: 'Doc Mubashir Chaudhry',
          edition: '2026 Edition',
          gradeLabel: 'BS-16',
          summary: 'Test summary',
          highlights: ['Key point 1'],
          filePath: '/documents/test/sample.pdf',
          fileSizeBytes: 999999,
          sha256: '0'.repeat(64),
          rights: 'author_original',
          topicIds: ['top-general-knowledge'],
          postIds: [],
          status: 'published',
          verification: {
            status: 'verified',
            sourceIds: [(bundle.sources[0] as { id: string }).id],
            lastCheckedAt: '2026-11-11',
            reviewIntervalDays: 180
          }
        } as any
      ];

      const report = validateDatasetBundle(bundle, {
        publicRootDir: tmpRoot
      });
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.ruleId === 'R10_PDF_SIZE_MATCH')).toBe(true);
      expect(report.errors.some((e) => e.ruleId === 'R10_PDF_SHA256_MATCH')).toBe(true);
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('rejects any dataset containing secret token patterns', () => {
    const bundle = cloneBundle();
    (bundle.sources[0] as Record<string, unknown>).notes = 'rc_live_secret123456';

    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R13_NO_SECRETS_IN_DATA')).toBe(true);
  });

  it('emits staleness warnings when referenceDate passes lastCheckedAt + reviewIntervalDays', () => {
    const bundle = cloneBundle();
    const report = validateDatasetBundle(bundle, {
      referenceDate: new Date('2028-01-01T00:00:00Z')
    });
    expect(report.valid).toBe(true);
    expect(report.warnings.some((w) => w.ruleId === 'R14_REVIEW_OVERDUE')).toBe(true);
  });

  it('parses RFC-4180 CSV with quoted commas and escaped double quotes', () => {
    const csv = 'id,stem,notes\nq1,"What is the capital, today?","Say ""Hello"""\n';
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ['id', 'stem', 'notes'],
      ['q1', 'What is the capital, today?', 'Say "Hello"']
    ]);
  });

  it('queries PPSC data via ContentRepository cleanly keeping official marks separated from editorial weights', async () => {
    const repo = getContentRepository();
    const post = await repo.getRecruitmentPost('intelligent-officer');
    const bp = await repo.getBlueprint('intelligent-officer');
    const pdfs = await repo.getPdfResources({ postId: post?.id });

    expect(post?.basicScale).toBe('BS-14');
    expect(post?.verification.status).toBe('unverified');
    expect(bp?.officialSections.every((s) => s.officialMarksPct === null)).toBe(true);
    expect(pdfs.length).toBe(0);
  });

  it('rejects unsafe PDF path traversal or non-/documents paths (R12_SAFE_PDF_PATH)', () => {
    const bundle = cloneBundle();
    bundle.pdfResources = [
      {
        id: 'pdf-test-unsafe',
        slug: 'pdf-test-unsafe',
        title: 'Unsafe Path Booklet',
        author: 'Doc Mubashir Chaudhry',
        edition: '2026 Edition',
        gradeLabel: 'BS-16',
        summary: 'Testing path traversal check',
        highlights: ['Key point 1'],
        filePath: '/documents/../secrets/test.pdf?leak=1',
        fileSizeBytes: 100,
        sha256: '0'.repeat(64),
        rights: 'author_original',
        topicIds: ['top-general-knowledge'],
        postIds: [],
        status: 'published',
        verification: {
          status: 'verified',
          sourceIds: [(bundle.sources[0] as { id: string }).id],
          lastCheckedAt: '2026-11-11',
          reviewIntervalDays: 180
        }
      } as any
    ];
    const report = validateDatasetBundle(bundle);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.ruleId === 'R12_SAFE_PDF_PATH')).toBe(true);
  });

  it('rejects duplicate PDF binaries sharing identical SHA-256 digests under public/documents', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dmc-pdf-dedup-'));
    try {
      const docsSubdir = path.join(tmpRoot, 'documents', 'ppsc');
      fs.mkdirSync(docsSubdir, { recursive: true });
      const f1 = path.join(docsSubdir, 'file1.pdf');
      const f2 = path.join(docsSubdir, 'file2.pdf');
      fs.writeFileSync(f1, '%PDF-1.4 identical content for dedup test');
      fs.writeFileSync(f2, '%PDF-1.4 identical content for dedup test');

      const bundle = cloneBundle();
      const report = validateDatasetBundle(bundle, {
        publicRootDir: tmpRoot,
        referenceDate: new Date('2026-11-11T00:00:00Z')
      });
      expect(report.valid).toBe(false);
      expect(report.errors.some((e) => e.ruleId === 'R10_PDF_NO_DUPLICATE_HASH')).toBe(true);
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

