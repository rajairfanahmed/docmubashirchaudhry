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
  buildPdfDigitalDocumentSchema
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

  it('builds DigitalDocument JSON-LD and adds expires only when PDF status is archived', async () => {
    const repo = getContentRepository();
    const pdfs = await repo.getPdfResources({ includeDrafts: true });
    expect(pdfs.length).toBeGreaterThan(0);

    const activeSchema = buildPdfDigitalDocumentSchema({
      pdf: pdfs[0],
      formatBytesLabel: '2.5 MB',
      sources: []
    });
    expect(activeSchema['@type']).toBe('DigitalDocument');
    expect(activeSchema.encodingFormat).toBe('application/pdf');
    expect(activeSchema.expires).toBeUndefined();

    const archivedSchema = buildPdfDigitalDocumentSchema({
      pdf: { ...pdfs[0], status: 'archived' },
      formatBytesLabel: '2.5 MB',
      sources: []
    });
    expect(archivedSchema.creativeWorkStatus).toBe('Archived');
    expect(archivedSchema.expires).toBe(pdfs[0].verification.lastCheckedAt);
  });
});

describe('Dynamic Sitemap & Robots Configuration', () => {
  it('generates canonical v1 sitemap excluding redirects, search, practice sessions, and empty hubs', async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(urls.has(`${SITE_URL}/`)).toBe(true);
    expect(urls.has(`${SITE_URL}/geography`)).toBe(true);
    expect(urls.has(`${SITE_URL}/ppsc`)).toBe(true);
    expect(urls.has(`${SITE_URL}/ppsc/intelligent-officer`)).toBe(true);
    expect(urls.has(`${SITE_URL}/geography/pakistan`)).toBe(true);
    expect(urls.has(`${SITE_URL}/library/resource/intelligence-officer-bs-14-set-01`)).toBe(true);
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
      expect.arrayContaining(['/', '/geography', '/ppsc', '/library', '/topics', '/data/v1/'])
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
  });
});

