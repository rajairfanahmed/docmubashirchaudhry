export const LOGO_DEV_CDN_BASE_URL =
  process.env.LOGO_DEV_CDN_BASE_URL?.replace(/\/+$/, '') || 'https://img.logo.dev';

/**
 * Publishable Logo.dev CDN token provided for official agency emblem image URLs.
 * Override at runtime/build via NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY or LOGO_DEV_PUBLISHABLE_KEY.
 */
export function getLogoDevPublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim() ||
    process.env.LOGO_DEV_PUBLISHABLE_KEY?.trim() ||
    'pk_e4a3hiZuS9GaAmHepVmkcw'
  );
}

export interface LogoDevUrlOptions {
  size?: number;
  format?: 'png' | 'jpg' | 'webp';
  fallback?: 'monogram' | '404';
  token?: string;
}

/**
 * Builds a deterministic Logo.dev CDN image URL for a verified commission domain.
 */
export function buildLogoDevUrl(domain: string, options: LogoDevUrlOptions = {}): string {
  const cleanDomain = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  const size = options.size ?? 128;
  const format = options.format ?? 'png';
  const fallback = options.fallback ?? '404';
  const token = options.token ?? getLogoDevPublishableKey();

  const params = new URLSearchParams({
    token,
    size: String(size),
    format,
    fallback
  });

  return `${LOGO_DEV_CDN_BASE_URL}/${encodeURIComponent(cleanDomain)}?${params.toString()}`;
}

export interface ExamBrandingRecord {
  code: string;
  slug: string;
  title: string;
  officialDomain: string;
  logoUrl: string | null;
  logoVerifiedOnCdn: boolean;
  fallbackMonogram: string;
  accentHex: string;
}

/**
 * Canonical branding catalog for Pakistani competitive exam commissions and hubs.
 * Domains where Logo.dev currently returns 404 (KPPSC, BPSC) keep logoUrl=null so UI renders clean fallback monograms.
 */
export const EXAM_BRANDING_CATALOG: ExamBrandingRecord[] = [
  {
    code: 'PPSC',
    slug: 'ppsc',
    title: 'Punjab Public Service Commission',
    officialDomain: 'ppsc.gop.pk',
    logoUrl: buildLogoDevUrl('ppsc.gop.pk'),
    logoVerifiedOnCdn: true,
    fallbackMonogram: 'PPSC',
    accentHex: '#0D4A28'
  },
  {
    code: 'FPSC',
    slug: 'fpsc',
    title: 'Federal Public Service Commission',
    officialDomain: 'fpsc.gov.pk',
    logoUrl: buildLogoDevUrl('fpsc.gov.pk'),
    logoVerifiedOnCdn: true,
    fallbackMonogram: 'FPSC',
    accentHex: '#15803D'
  },
  {
    code: 'CSS / PMS',
    slug: 'css-pms',
    title: 'Central Superior Services & Provincial Management Service',
    officialDomain: 'fpsc.gov.pk',
    logoUrl: buildLogoDevUrl('fpsc.gov.pk'),
    logoVerifiedOnCdn: true,
    fallbackMonogram: 'CSS',
    accentHex: '#0F766E'
  },
  {
    code: 'NTS',
    slug: 'nts',
    title: 'National Testing Service (NAT / GAT)',
    officialDomain: 'nts.org.pk',
    logoUrl: buildLogoDevUrl('nts.org.pk'),
    logoVerifiedOnCdn: true,
    fallbackMonogram: 'NTS',
    accentHex: '#1D4ED8'
  },
  {
    code: 'SPSC',
    slug: 'spsc',
    title: 'Sindh Public Service Commission',
    officialDomain: 'spsc.gos.pk',
    logoUrl: buildLogoDevUrl('spsc.gos.pk'),
    logoVerifiedOnCdn: true,
    fallbackMonogram: 'SPSC',
    accentHex: '#B45309'
  },
  {
    code: 'KPPSC',
    slug: 'kppsc',
    title: 'Khyber Pakhtunkhwa Public Service Commission',
    officialDomain: 'kppsc.gov.pk',
    logoUrl: null,
    logoVerifiedOnCdn: false,
    fallbackMonogram: 'KPPSC',
    accentHex: '#4338CA'
  },
  {
    code: 'BPSC',
    slug: 'bpsc',
    title: 'Balochistan Public Service Commission',
    officialDomain: 'bpsc.gob.pk',
    logoUrl: null,
    logoVerifiedOnCdn: false,
    fallbackMonogram: 'BPSC',
    accentHex: '#9A3412'
  }
];

export interface SubjectBrandingRecord {
  subjectId: string;
  slug: string;
  iconName: string;
  badgeLabel: string;
  iconUrl?: string;
}

/**
 * Canonical semantic icon and optional image mappings for taxonomy subjects.
 */
export const SUBJECT_ICON_CATALOG: Record<string, SubjectBrandingRecord> = {
  'sub-gk': {
    subjectId: 'sub-gk',
    slug: 'general-knowledge',
    iconName: 'Globe',
    badgeLabel: 'GK & World'
  },
  'sub-pak-studies': {
    subjectId: 'sub-pak-studies',
    slug: 'pakistan-affairs',
    iconName: 'Landmark',
    badgeLabel: 'Pakistan',
    iconUrl: 'https://flagcdn.com/pk.svg'
  },
  'sub-islamic-studies': {
    subjectId: 'sub-islamic-studies',
    slug: 'islamic-studies',
    iconName: 'BookOpenCheck',
    badgeLabel: 'Islamiat'
  },
  'sub-everyday-science': {
    subjectId: 'sub-everyday-science',
    slug: 'everyday-science',
    iconName: 'FlaskConical',
    badgeLabel: 'Science'
  },
  'sub-english': {
    subjectId: 'sub-english',
    slug: 'english',
    iconName: 'Languages',
    badgeLabel: 'English'
  },
  'sub-urdu': {
    subjectId: 'sub-urdu',
    slug: 'urdu',
    iconName: 'Feather',
    badgeLabel: 'Urdu'
  },
  'sub-math': {
    subjectId: 'sub-math',
    slug: 'basic-mathematics',
    iconName: 'Calculator',
    badgeLabel: 'Math'
  },
  'sub-computer': {
    subjectId: 'sub-computer',
    slug: 'basic-computer-studies',
    iconName: 'Cpu',
    badgeLabel: 'CS / IT'
  },
  'sub-sports': {
    subjectId: 'sub-sports',
    slug: 'sports-and-physical-education',
    iconName: 'Trophy',
    badgeLabel: 'Sports'
  }
};

export function getExamBranding(slugOrCode: string): ExamBrandingRecord | undefined {
  const needle = slugOrCode.trim().toLowerCase();
  return EXAM_BRANDING_CATALOG.find(
    (entry) => entry.slug === needle || entry.code.toLowerCase() === needle
  );
}

