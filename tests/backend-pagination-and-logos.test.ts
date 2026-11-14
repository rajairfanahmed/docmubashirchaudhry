import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { describe, it, expect } from 'vitest';
import {
  EXAM_BRANDING_CATALOG,
  SUBJECT_ICON_CATALOG,
  buildLogoDevUrl,
  getExamBranding,
  getLogoDevPublishableKey
} from '@/lib/branding/logos';
import {
  getContentRepository,
  loadDefaultSnapshot,
  paginateItems
} from '@/lib/data';
import { GET as getCountriesRoute } from '@/app/api/countries/route';
import { GET as getQuestionsRoute } from '@/app/api/questions/route';
import { GET as getHealthRoute } from '@/app/api/health/route';

describe('Branding Catalog (Logo.dev CDN & Subject Icons)', () => {
  it('builds Logo.dev CDN URLs using the publishable key for official exam bodies', () => {
    expect(getLogoDevPublishableKey()).toBe('pk_e4a3hiZuS9GaAmHepVmkcw');

    const ppscUrl = buildLogoDevUrl('ppsc.gop.pk');
    expect(ppscUrl).toContain('https://img.logo.dev/ppsc.gop.pk');
    expect(ppscUrl).toContain('token=pk_e4a3hiZuS9GaAmHepVmkcw');
    expect(ppscUrl).toContain('fallback=404');

    expect(getExamBranding('ppsc')?.logoUrl).toContain('ppsc.gop.pk');
    expect(getExamBranding('fpsc')?.logoUrl).toContain('fpsc.gov.pk');
    expect(getExamBranding('nts')?.logoUrl).toContain('nts.org.pk');
    expect(getExamBranding('css-pms')?.logoUrl).toContain('fpsc.gov.pk');
    expect(getExamBranding('spsc')?.logoUrl).toContain('spsc.gos.pk');
    expect(getExamBranding('kppsc')?.logoUrl).toBeNull();
    expect(getExamBranding('bpsc')?.logoUrl).toBeNull();
    expect(EXAM_BRANDING_CATALOG.length).toBe(7);
  });

  it('defines icon metadata on all 9 canonical subjects and loads matching subject catalog entries', () => {
    const snapshot = loadDefaultSnapshot();
    expect(snapshot.subjects.length).toBe(9);

    for (const subject of snapshot.subjects) {
      expect(subject.iconName).toBeTruthy();
      expect(subject.badgeLabel).toBeTruthy();
      expect(SUBJECT_ICON_CATALOG[subject.id]).toBeDefined();
      expect(SUBJECT_ICON_CATALOG[subject.id].iconName).toBe(subject.iconName);
    }

    const pakStudies = snapshot.subjects.find((s) => s.id === 'sub-pak-studies');
    expect(pakStudies?.iconUrl).toBe('https://flagcdn.com/pk.svg');
  });
});

describe('Complete 250-Country Dataset & Non-Duplicated PDF Paths', () => {
  it('includes all 250 countries and territories including sovereign states and edge regions', () => {
    const snapshot = loadDefaultSnapshot();
    expect(snapshot.countries.length).toBe(250);
    expect(snapshot.countries.filter((c) => c.isSovereign).length).toBeGreaterThanOrEqual(193);

    const fsm = snapshot.countries.find((c) => c.id === 'fsm');
    expect(fsm?.currencyIds).toContain('usd');

    const ata = snapshot.countries.find((c) => c.id === 'ata');
    expect(ata?.continentId).toBe('cont-antarctica');
    expect(ata?.regionId).toBe('reg-antarctic');
    expect(ata?.isSovereign).toBe(false);

    const fallbackPath = path.resolve(process.cwd(), 'public', 'data', 'countries-fallback.json');
    const fallbackItems = JSON.parse(fs.readFileSync(fallbackPath, 'utf8')) as unknown[];
    expect(fallbackItems.length).toBe(250);
  });

  it('verifies zero static PDFs in public/documents (reserved for live R2 storage)', () => {
    const snapshot = loadDefaultSnapshot();
    expect(snapshot.pdfResources.length).toBe(0);

    const docsRoot = path.resolve(process.cwd(), 'public', 'documents');
    if (fs.existsSync(docsRoot)) {
      const allFiles = fs.readdirSync(docsRoot, { recursive: true });
      const pdfs = (allFiles as string[]).filter((f) => String(f).toLowerCase().endsWith('.pdf'));
      expect(pdfs.length).toBe(0);
    }
  });
});

describe('Backend Pagination & API Route Handlers', () => {
  it('paginates arbitrary arrays cleanly with clamped pageSize and accurate metadata', () => {
    const sample = Array.from({ length: 53 }, (_, i) => i + 1);

    const page1 = paginateItems(sample, { page: 1, pageSize: 20 });
    expect(page1.items.length).toBe(20);
    expect(page1.pagination).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 53,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false
    });

    const page3 = paginateItems(sample, { page: 3, pageSize: 20 });
    expect(page3.items.length).toBe(13);
    expect(page3.pagination.hasNextPage).toBe(false);
    expect(page3.pagination.hasPreviousPage).toBe(true);

    const outOfRange = paginateItems(sample, { page: 9, pageSize: 20 });
    expect(outOfRange.items).toEqual([]);
    expect(outOfRange.pagination.hasNextPage).toBe(false);
    expect(outOfRange.pagination.hasPreviousPage).toBe(true);
  });

  it('paginates countries and MCQs via ContentRepository', async () => {
    const repo = getContentRepository();

    const firstCountries = await repo.getCountriesPaginated({ page: 1, pageSize: 24 });
    expect(firstCountries.items.length).toBe(24);
    expect(firstCountries.pagination.totalItems).toBe(250);
    expect(firstCountries.pagination.totalPages).toBe(11);
    expect(firstCountries.pagination.hasNextPage).toBe(true);

    const lastCountries = await repo.getCountriesPaginated({ page: 11, pageSize: 24 });
    expect(lastCountries.items.length).toBe(10);
    expect(lastCountries.pagination.hasNextPage).toBe(false);
    expect(lastCountries.pagination.hasPreviousPage).toBe(true);

    const alphaFirst = await repo.getCountriesPaginated({
      page: 1,
      pageSize: 5,
      sort: 'alphabetical'
    });
    expect(alphaFirst.items[0].nameCommon).toBe('Afghanistan');

    const mcqPage1 = await repo.getQuestionsPaginated({ page: 1, pageSize: 2 });
    expect(mcqPage1.items.length).toBe(0);
    expect(mcqPage1.pagination.totalItems).toBe(0);
    expect(mcqPage1.pagination.hasNextPage).toBe(false);
  });

  it('serves GET /api/countries and GET /api/questions with Zod validation (200 & 400)', async () => {
    const okCountriesRes = await getCountriesRoute(
      new NextRequest('http://localhost/api/countries?page=2&pageSize=15&continentId=cont-asia')
    );
    expect(okCountriesRes.status).toBe(200);
    const countriesPayload = await okCountriesRes.json();
    expect(countriesPayload.items.length).toBe(15);
    expect(countriesPayload.pagination.page).toBe(2);
    expect(countriesPayload.pagination.hasPreviousPage).toBe(true);

    const badCountriesRes = await getCountriesRoute(
      new NextRequest('http://localhost/api/countries?page=0&pageSize=500')
    );
    expect(badCountriesRes.status).toBe(400);

    const badLetterRes = await getCountriesRoute(
      new NextRequest('http://localhost/api/countries?letter=AB')
    );
    expect(badLetterRes.status).toBe(400);

    const okQuestionsRes = await getQuestionsRoute(
      new NextRequest('http://localhost/api/questions?page=1&pageSize=2&examId=exam-ppsc')
    );
    expect(okQuestionsRes.status).toBe(200);
    const questionsPayload = await okQuestionsRes.json();
    expect(questionsPayload.items.length).toBe(0);
    expect(questionsPayload.pagination.totalItems).toBe(0);

    const badQuestionsRes = await getQuestionsRoute(
      new NextRequest('http://localhost/api/questions?difficulty=impossible')
    );
    expect(badQuestionsRes.status).toBe(400);
  });

  it('serves GET /api/health with dataset counts, manifest version, and non-cacheable status', async () => {
    const res = await getHealthRoute();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('docmubashirchaudhry');
    expect(body.counts.countries).toBe(250);
    expect(body.counts.pdfResources).toBe(0);
    expect(typeof body.datasetVersion).toBe('string');
  });
});

