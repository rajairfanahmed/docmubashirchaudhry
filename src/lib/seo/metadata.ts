import type { Metadata } from 'next';
import type { CountryEntity, Currency, Language } from '@/lib/schemas/geography';

export const DEFAULT_SITE_URL = 'https://docmubashirchaudhry.vercel.app';
export const SITE_NAME = 'docmubashirchaudhry';
export const DEFAULT_OG_IMAGE_PATH = '/images/og-default.png';

/**
 * Resolves the canonical public origin for metadata, sitemaps, and JSON-LD.
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL (explicit Vercel / production URL configured post-deploy)
 *  2. SITE_CANONICAL_URL (server/build canonical override)
 *  3. VERCEL_URL when VERCEL_ENV === 'preview'
 *  4. VERCEL_PROJECT_PRODUCTION_URL (Vercel production domain fallback)
 *  5. VERCEL_URL fallback
 *  6. DEFAULT_SITE_URL
 */
export function resolveSiteUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const vercelPreviewHost =
    env.VERCEL_ENV === 'preview' ? env.VERCEL_URL?.trim() : undefined;

  const raw =
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    env.SITE_CANONICAL_URL?.trim() ||
    vercelPreviewHost ||
    env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    env.VERCEL_URL?.trim() ||
    DEFAULT_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();

/**
 * Normalizes a site path into a canonical absolute HTTPS URL with no trailing slash (except root).
 */
export function buildCanonicalUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') {
    return `${SITE_URL}/`;
  }
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return `${SITE_URL}${withoutTrailingSlash || '/'}`;
}

export interface BuildPageMetadataOptions {
  /** Short page title formatted via root layout `%s | docmubashirchaudhry` template. */
  title?: string;
  /** Full un-templated `<title>` string (e.g. for root homepage). */
  absoluteTitle?: string;
  description: string;
  path: string;
  index?: boolean;
  follow?: boolean;
  type?: 'website' | 'article';
  keywords?: string[];
}

/**
 * Builds complete Next.js Metadata including canonical URL, Open Graph image, Twitter card,
 * and explicit robots directives.
 */
export function buildPageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  index = true,
  follow = true,
  type = 'website',
  keywords
}: BuildPageMetadataOptions): Metadata {
  const canonicalUrl = buildCanonicalUrl(path);
  const ogTitle = absoluteTitle ?? (title ? `${title} | ${SITE_NAME}` : SITE_NAME);
  const ogImageUrl = `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_US',
      type,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} Free Competitive Exam Preparation Portal`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogImageUrl]
    },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

/**
 * Generates truthful per-territory metadata for /geography/[slug] profiles,
 * handling 0-capital territories and unverified/disputed verification statuses.
 */
export function buildCountryPageMetadata(options: {
  country: CountryEntity;
  currencies: readonly Currency[];
  languages: readonly Language[];
}): Metadata {
  const { country, currencies, languages } = options;
  const currencyNames = country.currencyIds
    .map((id) => currencies.find((c) => c.id === id))
    .filter((c): c is Currency => Boolean(c))
    .slice(0, 3)
    .map((c) => `${c.name} (${c.code})`);

  const languageNames = country.officialLanguageIds
    .map((id) => languages.find((l) => l.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);

  const prefix =
    country.verification.status === 'verified'
      ? `Verified country profile for ${country.nameCommon} (${country.isoAlpha3})`
      : `Documented profile for ${country.nameCommon} (${country.isoAlpha3}, status: ${country.verification.status})`;

  const factParts: string[] = [];
  factParts.push(
    country.capitals.length > 0
      ? `capital${country.capitals.length > 1 ? 's' : ''}: ${country.capitals.join(', ')}`
      : 'no designated administrative capital'
  );
  if (currencyNames.length > 0) {
    factParts.push(`currencies: ${currencyNames.join(', ')}`);
  }
  if (languageNames.length > 0) {
    factParts.push(`official languages: ${languageNames.join(', ')}`);
  }

  return buildPageMetadata({
    title: `${country.nameCommon}: Capital, Currency & Languages`,
    description: `${prefix}: ${factParts.join('; ')}, with source citations and quiz practice.`,
    path: `/geography/${country.slug}`,
    index: country.status === 'published'
  });
}

