import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SITE_URL,
  SITE_URL,
  buildCanonicalUrl,
  buildPageMetadata,
  resolveSiteUrl
} from '@/lib/seo/metadata';
import {
  buildBreadcrumbListSchema,
  buildPdfDigitalDocumentSchema,
  buildRootSchema
} from '@/lib/seo/structured-data';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { getContentRepository } from '@/lib/data';

describe('SEO Metadata & Structured Data Utilities', () => {
  it('normalizes canonical URLs consistently without spurious trailing slashes', () => {
    expect(buildCanonicalUrl('/')).toBe(`${SITE_URL}/`);
    expect(buildCanonicalUrl('/geography/')).toBe(`${SITE_URL}/geography`);
    expect(buildCanonicalUrl('ppsc/intelligent-officer')).toBe(
      `${SITE_URL}/ppsc/intelligent-officer`
    );
  });

  it('builds complete Page Metadata with og-default.png social image and robots directives', () => {
    const meta = buildPageMetadata({
      title: 'World Geography',
      description: 'Reference guide and recall quiz.',
      path: '/geography'
    });

    expect(meta.title).toBe('World Geography');
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/geography`);
    expect(meta.openGraph?.images).toEqual([
      expect.objectContaining({
        url: `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`,
        width: 1200,
        height: 630
      })
    ]);
    expect(meta.twitter).toEqual(
      expect.objectContaining({
        card: 'summary_large_image',
        images: [`${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`]
      })
    );

    const noindexMeta = buildPageMetadata({
      title: 'Search',
      description: 'Query search',
      path: '/search',
      index: false,
      follow: true
    });
    expect(noindexMeta.robots).toEqual(
      expect.objectContaining({ index: false, follow: true })
    );
  });

  it('emits Schema.org BreadcrumbList starting at Home and resolving currentPath on leaf', () => {
    const schema = buildBreadcrumbListSchema(
      [{ label: 'Geography', href: '/geography' }, { label: 'Pakistan' }],
      '/geography/pakistan'
    ) as {
      '@type': string;
      itemListElement: Array<{ position: number; name: string; item?: string }>;
    };

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Geography', item: `${SITE_URL}/geography` },
      { '@type': 'ListItem', position: 3, name: 'Pakistan', item: `${SITE_URL}/geography/pakistan` }
    ]);
  });

  it('builds DigitalDocument JSON-LD and adds expires only when PDF status is archived', () => {
    const samplePdf = {
      id: 'pdf-sample',
      slug: 'sample-booklet',
      title: 'Sample Booklet',
      author: 'Doc Mubashir Chaudhry',
      edition: '2026 Edition',
      gradeLabel: 'BS-16',
      summary: 'Sample description',
      highlights: ['Key booklet point'],
      filePath: '/documents/sample.pdf',
      fileSizeBytes: 2_500_000,
      sha256: 'a'.repeat(64),
      rights: 'author_original' as const,
      topicIds: [],
      postIds: [],
      status: 'published' as const,
      verification: {
        status: 'verified' as const,
        sourceIds: [],
        lastCheckedAt: '2026-11-11',
        reviewIntervalDays: 180
      }
    };

    const activeSchema = buildPdfDigitalDocumentSchema({
      pdf: samplePdf,
      formatBytesLabel: '2.5 MB',
      sources: []
    });
    expect(activeSchema['@type']).toBe('DigitalDocument');
    expect(activeSchema.encodingFormat).toBe('application/pdf');
    expect(activeSchema.expires).toBeUndefined();

    const archivedSchema = buildPdfDigitalDocumentSchema({
      pdf: { ...samplePdf, status: 'archived' },
      formatBytesLabel: '2.5 MB',
      sources: []
    });
    expect(archivedSchema.creativeWorkStatus).toBe('Archived');
    expect(archivedSchema.expires).toBe(samplePdf.verification.lastCheckedAt);
  });
});

describe('Dynamic Sitemap & Robots Configuration', () => {
  it('generates canonical v1 sitemap excluding redirects, search, practice sessions, and empty hubs', async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has(`${SITE_URL}/`)).toBe(true);
    expect(urls.has(`${SITE_URL}/geography`)).toBe(true);
    expect(urls.has(`${SITE_URL}/ppsc`)).toBe(true);
    expect(urls.has(`${SITE_URL}/quizzes`)).toBe(true);
    expect(urls.has(`${SITE_URL}/ppsc/intelligent-officer`)).toBe(false);
    expect(urls.has(`${SITE_URL}/geography/pakistan`)).toBe(true);
    expect(urls.has(`${SITE_URL}/library/resource/intelligence-officer-bs-14-set-01`)).toBe(false);
    expect(urls.has(`${SITE_URL}/library/ppsc`)).toBe(true);

    // Excluded routes
    expect(urls.has(`${SITE_URL}/countries`)).toBe(false);
    expect(urls.has(`${SITE_URL}/ppsc/intelligent-officer/blueprint`)).toBe(false);
    expect(urls.has(`${SITE_URL}/search`)).toBe(false);
    expect(urls.has(`${SITE_URL}/mcq/practice`)).toBe(false);
    expect(urls.has(`${SITE_URL}/fpsc`)).toBe(false);
    expect(urls.has(`${SITE_URL}/nts`)).toBe(false);
    expect(urls.has(`${SITE_URL}/css-pms`)).toBe(false);
    expect(urls.has(`${SITE_URL}/library/fpsc`)).toBe(false);
  });

  it('permits public crawling of primary hubs and verification endpoints in robots.ts', () => {
    const config = robots();
    expect(config.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const wildcard = rules.find((r) => r.userAgent === '*');
    expect(wildcard?.allow).toEqual(
      expect.arrayContaining([
        '/',
        '/geography',
        '/ppsc',
        '/quizzes',
        '/exams',
        '/library',
        '/topics',
        '/data/v1/'
      ])
    );
    expect(wildcard?.disallow).toEqual(
      expect.arrayContaining(['/api/', '/admin/', '/my-attempts', '/my-downloads'])
    );
  });

  it('resolves canonical URL priority across explicit env vars, Vercel system vars, and fallback', () => {
    expect(resolveSiteUrl({})).toBe(DEFAULT_SITE_URL);
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://docmubashirchaudhry.vercel.app/',
        VERCEL_PROJECT_PRODUCTION_URL: 'other.vercel.app'
      })
    ).toBe('https://docmubashirchaudhry.vercel.app');
    expect(
      resolveSiteUrl({
        SITE_CANONICAL_URL: 'docmubashirchaudhary.com/subpath'
      })
    ).toBe('https://docmubashirchaudhary.com');
    expect(
      resolveSiteUrl({
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'docmubashirchaudhry-git-main.vercel.app',
        VERCEL_PROJECT_PRODUCTION_URL: 'docmubashirchaudhry.vercel.app'
      })
    ).toBe('https://docmubashirchaudhry-git-main.vercel.app');
    expect(
      resolveSiteUrl({
        VERCEL_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: 'docmubashirchaudhry.vercel.app'
      })
    ).toBe('https://docmubashirchaudhry.vercel.app');
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'http://[::invalid' })).toBe(DEFAULT_SITE_URL);
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })).toBe(
      DEFAULT_SITE_URL
    );
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3000' })).toBe(
      DEFAULT_SITE_URL
    );
  });

  it('uses the Vercel canonical domain, emits CollectionPage JSON-LD, hardens robots, and keeps country meta truthful', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { buildCanonicalUrl, buildCountryPageMetadata } = await import('@/lib/seo/metadata');
    const { buildCollectionPageSchema } = await import('@/lib/seo/structured-data');
    const { default: robotsFn } = await import('@/app/robots');
    const { getContentRepository } = await import('@/lib/data');

    expect(DEFAULT_SITE_URL).toBe('https://docmubashirchaudhry.vercel.app');
    expect(buildCanonicalUrl('/')).toBe('https://docmubashirchaudhry.vercel.app/');

    const collection = buildCollectionPageSchema({
      title: 'Exam Library',
      description: 'Solved booklets.',
      path: '/library',
      items: [{ name: 'PPSC Booklets', path: '/library/ppsc' }],
      totalItems: 1
    });
    expect(collection['@type']).toBe('CollectionPage');
    expect(collection.url).toBe(`${DEFAULT_SITE_URL}/library`);
    const mainEntity = collection.mainEntity as {
      '@type': string;
      numberOfItems: number;
      itemListElement: Array<{ url: string; position: number; name: string }>;
    };
    expect(mainEntity['@type']).toBe('ItemList');
    expect(mainEntity.numberOfItems).toBe(1);
    expect(mainEntity.itemListElement[0]?.url).toBe(`${DEFAULT_SITE_URL}/library/ppsc`);

    const robotsConfig = robotsFn();
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
    const wildcardRule = rules.find((rule) => rule.userAgent === '*');
    const gptRule = rules.find(
      (rule) => Array.isArray(rule.userAgent) && rule.userAgent.includes('GPTBot')
    );
    expect(wildcardRule?.disallow).toContain('/api/');
    expect(gptRule?.disallow).toContain('/api/');
    expect(robotsConfig.sitemap).toBe(`${DEFAULT_SITE_URL}/sitemap.xml`);

    const repo = getContentRepository();
    const [pakistan, antarctica, palestine, reference] = await Promise.all([
      repo.getCountry('pakistan'),
      repo.getCountry('antarctica'),
      repo.getCountry('palestine'),
      repo.getGeographyReference()
    ]);
    expect(pakistan).toBeTruthy();
    expect(antarctica).toBeTruthy();
    expect(palestine).toBeTruthy();

    const pakistanMeta = buildCountryPageMetadata({
      country: pakistan!,
      currencies: reference.currencies,
      languages: reference.languages
    });
    expect(pakistanMeta.description).toContain('Islamabad');
    expect(pakistanMeta.alternates?.canonical).toBe(`${DEFAULT_SITE_URL}/geography/pakistan`);
    expect(String(pakistanMeta.title)).not.toContain(' | docmubashirchaudhry | ');

    const antarcticaMeta = buildCountryPageMetadata({
      country: antarctica!,
      currencies: reference.currencies,
      languages: reference.languages
    });
    expect(antarcticaMeta.description).not.toContain('capitals ()');
    expect(antarcticaMeta.description).toContain('no designated administrative capital');

    const palestineMeta = buildCountryPageMetadata({
      country: palestine!,
      currencies: reference.currencies,
      languages: reference.languages
    });
    expect(String(palestineMeta.description).toLowerCase()).not.toContain('verified country');

    const llms = fs.readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8');
    expect(llms).toContain('https://docmubashirchaudhry.vercel.app/');
    expect(llms).not.toContain('https://docmubashirchaudhary.com/');
    expect(llms.trimStart().startsWith('# ')).toBe(true);
    expect(llms).toContain('\n> ');
    const markdownLinks = llms.match(/\[[^\]]+\]\(https:\/\/docmubashirchaudhry\.vercel\.app\/[^)]*\)/g) ?? [];
    expect(markdownLinks.length).toBeGreaterThanOrEqual(10);

    const homePageSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');
    expect(homePageSrc).toContain('<span>Start Geography Quiz</span>');
    expect(homePageSrc).toContain("path: '/'");
    expect(homePageSrc).not.toContain('<span>Start</span>');

    const rootSchema = buildRootSchema() as { '@graph': Array<Record<string, unknown>> };
    expect(rootSchema['@graph'][0]?.alternateName).toBe('DocMubashir Exam Portal');
    expect(rootSchema['@graph'][1]?.alternateName).toBe('DocMubashir Exam Portal');

    const layoutSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    expect(layoutSrc).toContain("google: 'cyPaDLlCl9e3xk1KzdznBwXvizColXpowGUNSc2M4Ws'");
  });
});

