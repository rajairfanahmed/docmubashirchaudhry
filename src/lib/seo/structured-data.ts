import type { CountryEntity, PdfResource, Source } from '@/lib/schemas';
import { SITE_NAME, SITE_URL, buildCanonicalUrl } from './metadata';

export interface BreadcrumbInput {
  label: string;
  href?: string;
}

/**
 * Safely serializes JSON-LD payloads for inline script rendering.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function mapSourceCitations(sources: Source[]) {
  return sources.map((source) => ({
    '@type': 'CreativeWork',
    name: source.title,
    publisher: {
      '@type': 'Organization',
      name: source.publisher
    },
    url: source.url.startsWith('/') ? buildCanonicalUrl(source.url) : source.url
  }));
}

/**
 * Root sitewide EducationalOrganization + WebSite SearchAction JSON-LD graph.
 */
export function buildRootSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: 'DocMubashir Exam Portal',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon.svg`,
        email: 'editorial@docmubashirchaudhary.com',
        publishingPrinciples: `${SITE_URL}/methodology`,
        description:
          'Independent, free educational portal for PPSC, CSS/PMS, FPSC, NTS preparation, World Geography practice, and verified solved PDF booklets.'
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        alternateName: 'DocMubashir Exam Portal',
        publisher: {
          '@id': `${SITE_URL}/#organization`
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };
}

/**
 * Builds a Schema.org BreadcrumbList matching the rendered breadcrumb trail.
 */
export function buildBreadcrumbListSchema(
  items: BreadcrumbInput[],
  currentPath?: string
): Record<string, unknown> {
  const trail: BreadcrumbInput[] = [{ label: 'Home', href: '/' }, ...items];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => {
      const resolvedHref =
        item.href ?? (index === trail.length - 1 ? currentPath : undefined);
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        ...(resolvedHref ? { item: buildCanonicalUrl(resolvedHref) } : {})
      };
    })
  };
}

/**
 * Builds Schema.org Quiz + LearningResource markup for interactive MCQ / Geography quiz portals.
 */
export function buildQuizResourceSchema(options: {
  title: string;
  description: string;
  path: string;
  about: string[];
  questionCount?: number;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['Quiz', 'LearningResource'],
    name: options.title,
    description: options.description,
    url: buildCanonicalUrl(options.path),
    inLanguage: 'en',
    isAccessibleForFree: true,
    educationalUse: 'Practice Quiz',
    provider: {
      '@id': `${SITE_URL}/#organization`
    },
    about: options.about.map((topic) => ({
      '@type': 'Thing',
      name: topic
    })),
    ...(typeof options.questionCount === 'number' && options.questionCount > 0
      ? { numberOfQuestions: options.questionCount }
      : {})
  };
}

/**
 * Builds Schema.org Country + DefinedTermSet graph matching verified country profile facts.
 */
export function buildCountryProfileSchema(options: {
  country: CountryEntity;
  capitals: string[];
  currencyNames: string[];
  languageNames: string[];
  continentName?: string;
  regionName?: string;
  sources: Source[];
}): Record<string, unknown> {
  const { country, capitals, currencyNames, languageNames, continentName, regionName, sources } =
    options;
  const canonicalUrl = buildCanonicalUrl(`/geography/${country.slug}`);
  const capitalsLabel = capitals.length > 0 ? capitals.join(', ') : 'None listed';
  const currenciesLabel = currencyNames.length > 0 ? currencyNames.join(', ') : 'None listed';
  const languagesLabel = languageNames.length > 0 ? languageNames.join(', ') : 'None listed';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Country',
        '@id': `${canonicalUrl}#country`,
        name: country.nameCommon,
        ...(country.nameOfficial !== country.nameCommon
          ? { alternateName: country.nameOfficial }
          : {}),
        identifier: [country.isoAlpha2, country.isoAlpha3],
        description: `${country.nameCommon} (${country.isoAlpha2}): Capital ${capitalsLabel}; Currency ${currenciesLabel}; Official Language(s) ${languagesLabel}.`,
        url: canonicalUrl,
        ...(continentName || regionName
          ? {
              containedInPlace: {
                '@type': 'Place',
                name: [regionName, continentName].filter(Boolean).join(', ')
              }
            }
          : {})
      },
      {
        '@type': 'DefinedTermSet',
        '@id': `${canonicalUrl}#facts`,
        name: `${country.nameCommon} Verified Geography Reference Facts`,
        url: canonicalUrl,
        isAccessibleForFree: true,
        dateModified: country.verification.lastCheckedAt,
        about: {
          '@id': `${canonicalUrl}#country`
        },
        hasDefinedTerm: [
          { '@type': 'DefinedTerm', name: 'Capital', description: capitalsLabel },
          { '@type': 'DefinedTerm', name: 'Currency', description: currenciesLabel },
          { '@type': 'DefinedTerm', name: 'Official Language', description: languagesLabel },
          {
            '@type': 'DefinedTerm',
            name: 'ISO Codes',
            description: `${country.isoAlpha2} / ${country.isoAlpha3}`
          }
        ],
        ...(sources.length > 0 ? { citation: mapSourceCitations(sources) } : {})
      }
    ]
  };
}

/**
 * Builds Schema.org DigitalDocument markup for downloadable study PDF detail pages.
 */
export function buildPdfDigitalDocumentSchema(options: {
  pdf: PdfResource;
  formatBytesLabel: string;
  sources: Source[];
}): Record<string, unknown> {
  const { pdf, formatBytesLabel, sources } = options;

  return {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: pdf.title,
    description: pdf.summary,
    url: buildCanonicalUrl(`/library/resource/${pdf.slug}`),
    contentUrl: buildCanonicalUrl(encodeURI(pdf.filePath)),
    encodingFormat: 'application/pdf',
    contentSize: formatBytesLabel,
    version: pdf.edition,
    dateModified: pdf.verification.lastCheckedAt,
    isAccessibleForFree: true,
    author: {
      '@type': 'Person',
      name: pdf.author
    },
    publisher: {
      '@id': `${SITE_URL}/#organization`
    },
    ...(pdf.pageCount ? { numberOfPages: pdf.pageCount } : {}),
    ...(pdf.status === 'archived'
      ? {
          creativeWorkStatus: 'Archived',
          expires: pdf.verification.lastCheckedAt
        }
      : {
          creativeWorkStatus: 'Published'
        }),
    ...(sources.length > 0 ? { citation: mapSourceCitations(sources) } : {})
  };
}

/**
 * Builds Schema.org LearningResource markup for syllabus posts, blueprints, and topics.
 */
export function buildLearningResourceSchema(options: {
  title: string;
  description: string;
  path: string;
  educationalLevel?: string;
  learningResourceType?: string;
  dateModified?: string;
  about?: string[];
  sources?: Source[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: options.title,
    description: options.description,
    url: buildCanonicalUrl(options.path),
    inLanguage: 'en',
    isAccessibleForFree: true,
    provider: {
      '@id': `${SITE_URL}/#organization`
    },
    ...(options.educationalLevel ? { educationalLevel: options.educationalLevel } : {}),
    ...(options.learningResourceType ? { learningResourceType: options.learningResourceType } : {}),
    ...(options.dateModified ? { dateModified: options.dateModified } : {}),
    ...(options.about && options.about.length > 0
      ? {
          about: options.about.map((topic) => ({
            '@type': 'Thing',
            name: topic
          }))
        }
      : {}),
    ...(options.sources && options.sources.length > 0
      ? { citation: mapSourceCitations(options.sources) }
      : {})
  };
}

/**
 * Builds Schema.org CollectionPage + ItemList markup strictly matching visible rendered links.
 */
export function buildCollectionPageSchema(options: {
  title: string;
  description: string;
  path: string;
  items: Array<{ name: string; path: string }>;
  totalItems?: number;
}): Record<string, unknown> {
  const canonicalUrl = buildCanonicalUrl(options.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#collection`,
    name: options.title,
    description: options.description,
    url: canonicalUrl,
    inLanguage: 'en',
    isAccessibleForFree: true,
    publisher: {
      '@id': `${SITE_URL}/#organization`
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.totalItems ?? options.items.length,
      itemListElement: options.items.map((entry, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: entry.name,
        url: buildCanonicalUrl(entry.path)
      }))
    }
  };
}

