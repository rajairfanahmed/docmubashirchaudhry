/**
 * Canonical semantic token maps referencing CSS variables declared in src/app/globals.css.
 * Prevents raw hex duplication inside Step 3-10 components.
 */

export interface SubjectTokenMapping {
  bgVar: string;
  inkVar: string;
}

export const SUBJECT_PASTEL_TOKENS: Record<string, SubjectTokenMapping> = {
  'sub-gk': {
    bgVar: 'var(--dmc-subject-gk-bg)',
    inkVar: 'var(--dmc-subject-gk-ink)'
  },
  'sub-pak-studies': {
    bgVar: 'var(--dmc-subject-pak-bg)',
    inkVar: 'var(--dmc-subject-pak-ink)'
  },
  'sub-islamic-studies': {
    bgVar: 'var(--dmc-subject-islamic-bg)',
    inkVar: 'var(--dmc-subject-islamic-ink)'
  },
  'sub-everyday-science': {
    bgVar: 'var(--dmc-subject-science-bg)',
    inkVar: 'var(--dmc-subject-science-ink)'
  },
  'sub-english': {
    bgVar: 'var(--dmc-subject-english-bg)',
    inkVar: 'var(--dmc-subject-english-ink)'
  },
  'sub-urdu': {
    bgVar: 'var(--dmc-subject-urdu-bg)',
    inkVar: 'var(--dmc-subject-urdu-ink)'
  },
  'sub-math': {
    bgVar: 'var(--dmc-subject-math-bg)',
    inkVar: 'var(--dmc-subject-math-ink)'
  },
  'sub-computer': {
    bgVar: 'var(--dmc-subject-computer-bg)',
    inkVar: 'var(--dmc-subject-computer-ink)'
  },
  'sub-sports': {
    bgVar: 'var(--dmc-subject-sports-bg)',
    inkVar: 'var(--dmc-subject-sports-ink)'
  },
  'sub-mixed': {
    bgVar: 'var(--dmc-subject-mixed-bg)',
    inkVar: 'var(--dmc-subject-mixed-ink)'
  }
};

export const BRAND_SURFACE_TOKENS = {
  forest: 'var(--dmc-brand-forest)',
  dark: 'var(--dmc-brand-dark)',
  emerald: 'var(--dmc-brand-emerald)',
  surfaceDark: 'var(--dmc-brand-surface-dark)',
  footer: 'var(--dmc-brand-footer)',
  gold: 'var(--dmc-accent-gold)',
  goldHover: 'var(--dmc-accent-gold-hover)',
  highlightBg: 'var(--dmc-highlight-bg)',
  highlightInk: 'var(--dmc-highlight-ink)',
  highlightBorder: 'var(--dmc-highlight-border)',
  ground: 'var(--dmc-surface-ground)',
  muted: 'var(--dmc-surface-muted)',
  card: 'var(--dmc-surface-card)'
} as const;

export const STATUS_SEMANTIC_TOKENS = {
  verified: {
    bgVar: 'var(--dmc-status-verified-bg)',
    borderVar: 'var(--dmc-status-verified-border)',
    inkVar: 'var(--dmc-status-verified-ink)',
    iconVar: 'var(--dmc-status-verified-icon)'
  },
  error: {
    bgVar: 'var(--dmc-status-error-bg)',
    borderVar: 'var(--dmc-status-error-border)',
    inkVar: 'var(--dmc-status-error-ink)',
    iconVar: 'var(--dmc-status-error-icon)'
  },
  unverified: {
    bgVar: 'var(--dmc-status-unverified-bg)',
    borderVar: 'var(--dmc-status-unverified-border)',
    inkVar: 'var(--dmc-status-unverified-ink)',
    iconVar: 'var(--dmc-status-unverified-icon)'
  },
  disputed: {
    bgVar: 'var(--dmc-status-disputed-bg)',
    borderVar: 'var(--dmc-status-disputed-border)',
    inkVar: 'var(--dmc-status-disputed-ink)'
  },
  archived: {
    bgVar: 'var(--dmc-status-archived-bg)',
    borderVar: 'var(--dmc-status-archived-border)',
    inkVar: 'var(--dmc-status-archived-ink)'
  },
  outdated: {
    bgVar: 'var(--dmc-status-outdated-bg)',
    borderVar: 'var(--dmc-status-outdated-border)',
    inkVar: 'var(--dmc-status-outdated-ink)'
  }
} as const;

export const FOLIO_COVER_TOKENS = {
  bandBgVar: 'var(--dmc-brand-forest)',
  bandAccentVar: 'var(--dmc-accent-gold)',
  bodyBgVar: 'var(--dmc-surface-card)',
  stampBgVar: 'var(--dmc-status-verified-bg)',
  stampInkVar: 'var(--dmc-status-verified-ink)'
} as const;

/**
 * Semantic token references for Step 3-5 /mcq/practice sheet & pagination surfaces.
 * Populated via CSS custom properties in src/app/globals.css.
 */
export const MCQ_SHEET_TOKENS = {
  sheetBgVar: 'var(--dmc-surface-mcq-sheet)',
  sheetTintVar: 'var(--dmc-surface-mcq-sheet-tint)',
  sheetArcVar: 'var(--dmc-mcq-sheet-arc)',
  headingInkVar: 'var(--dmc-mcq-heading)',
  ringTrackVar: 'var(--dmc-ring-track)',
  ringFillVar: 'var(--dmc-brand-forest)'
} as const;
