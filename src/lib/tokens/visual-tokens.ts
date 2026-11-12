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
  brandInk: 'var(--dmc-brand-ink)',
  gold: 'var(--dmc-accent-gold)',
  goldHover: 'var(--dmc-accent-gold-hover)',
  goldInk: 'var(--dmc-accent-gold-ink)',
  highlightBg: 'var(--dmc-highlight-bg)',
  highlightInk: 'var(--dmc-highlight-ink)',
  highlightBorder: 'var(--dmc-highlight-border)',
  ground: 'var(--dmc-surface-ground)',
  muted: 'var(--dmc-surface-muted)',
  card: 'var(--dmc-surface-card)',
  overlay: 'var(--dmc-surface-overlay)',
  portraitScrim: 'var(--dmc-scrim-portrait)'
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
  },
  locked: {
    bgVar: 'var(--dmc-status-locked-bg)',
    borderVar: 'var(--dmc-status-locked-border)',
    inkVar: 'var(--dmc-status-locked-ink)'
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

/**
 * Canonical Step 02 token references for M3 tonal mint surfaces, interactive
 * emerald accents, timed mock countdown states, charts, typography, spacing,
 * radii, and Material elevations. All values bind strictly to src/app/globals.css.
 */
export const V3_SURFACE_TOKENS = {
  mintWashVar: 'var(--dmc-surface-mint-wash)',
  mintTonalVar: 'var(--dmc-surface-mint-tonal)',
  mintBorderVar: 'var(--dmc-surface-mint-border)',
  emeraldAccentVar: 'var(--dmc-emerald-accent)',
  emeraldAccentHoverVar: 'var(--dmc-emerald-accent-hover)',
  emeraldAccentDarkVar: 'var(--dmc-emerald-accent-dark)',
  emeraldAccentInkVar: 'var(--dmc-emerald-accent-ink)'
} as const;

export const TIMER_STATE_TOKENS = {
  safe: {
    bgVar: 'var(--dmc-timer-safe-bg)',
    borderVar: 'var(--dmc-timer-safe-border)',
    inkVar: 'var(--dmc-timer-safe-ink)'
  },
  warn: {
    bgVar: 'var(--dmc-timer-warn-bg)',
    borderVar: 'var(--dmc-timer-warn-border)',
    inkVar: 'var(--dmc-timer-warn-ink)'
  },
  danger: {
    bgVar: 'var(--dmc-timer-danger-bg)',
    borderVar: 'var(--dmc-timer-danger-border)',
    inkVar: 'var(--dmc-timer-danger-ink)'
  }
} as const;

export const CHART_PALETTE_TOKENS = {
  visitsVar: 'var(--dmc-chart-visits)',
  attemptsVar: 'var(--dmc-chart-attempts)',
  downloadsVar: 'var(--dmc-chart-downloads)',
  gridVar: 'var(--dmc-chart-grid)',
  axisInkVar: 'var(--dmc-chart-axis-ink)'
} as const;

export const TYPOGRAPHY_SCALE_TOKENS = {
  displayHeroVar: 'var(--dmc-text-display-hero)',
  pageTitleVar: 'var(--dmc-text-page-title)',
  sectionHeadingVar: 'var(--dmc-text-section-heading)',
  cardTitleVar: 'var(--dmc-text-card-title)',
  bodyBaseVar: 'var(--dmc-text-body-base)',
  bodySmVar: 'var(--dmc-text-body-sm)',
  labelMicroVar: 'var(--dmc-text-label-micro)',
  labelXsVar: 'var(--dmc-text-label-xs)',
  urduSizeVar: 'var(--dmc-text-urdu)',
  urduLeadingVar: 'var(--dmc-leading-urdu)',
  proseMeasureVar: 'var(--dmc-measure-prose)'
} as const;

export const FONT_STACK_VARS = {
  sansVar: 'var(--font-sans)',
  displayVar: 'var(--font-display)',
  urduVar: 'var(--font-urdu)'
} as const;

export const SPACING_SCALE_TOKENS = {
  s1: 'var(--dmc-space-1)',
  s2: 'var(--dmc-space-2)',
  s3: 'var(--dmc-space-3)',
  s4: 'var(--dmc-space-4)',
  s5: 'var(--dmc-space-5)',
  s6: 'var(--dmc-space-6)',
  s8: 'var(--dmc-space-8)',
  s12: 'var(--dmc-space-12)',
  s16: 'var(--dmc-space-16)'
} as const;

export const RADII_SCALE_TOKENS = {
  pill: 'var(--dmc-radius-pill)',
  button: 'var(--dmc-radius-button)',
  squircle: 'var(--dmc-radius-squircle)',
  card: 'var(--dmc-radius-card)',
  modal: 'var(--dmc-radius-modal)'
} as const;

export const ELEVATION_TOKENS = {
  level0: 'var(--dmc-shadow-0)',
  level1: 'var(--dmc-shadow-1)',
  level2: 'var(--dmc-shadow-2)',
  level3: 'var(--dmc-shadow-3)'
} as const;

export const EDITORIAL_SURFACE_TOKENS = {
  page: 'var(--color-page)',
  surface: 'var(--color-surface)',
  surfaceSoft: 'var(--color-surface-soft)',
  surfaceRaised: 'var(--color-surface-raised)',
  ink: 'var(--color-ink)',
  inkSecondary: 'var(--color-ink-secondary)',
  inkMuted: 'var(--color-ink-muted)',
  border: 'var(--color-border)',
  borderStrong: 'var(--color-border-strong)',
  brandDeep: 'var(--color-brand-deep)',
  brandDeepHover: 'var(--color-brand-deep-hover)',
  accent: 'var(--color-accent)',
  accentInk: 'var(--color-accent-ink)',
  action: 'var(--color-action)',
  actionHover: 'var(--color-action-hover)',
  actionInk: 'var(--color-action-ink)',
  darkSurface: 'var(--color-dark-surface)',
  darkSurfaceRaised: 'var(--color-dark-surface-raised)',
  darkInk: 'var(--color-dark-ink)',
  darkInkSecondary: 'var(--color-dark-ink-secondary)',
  darkBorder: 'var(--color-dark-border)'
} as const;

export const SEMANTIC_FEEDBACK_TOKENS = {
  successBg: 'var(--color-success-bg)',
  successInk: 'var(--color-success-ink)',
  successBorder: 'var(--color-success-border)',
  warningBg: 'var(--color-warning-bg)',
  warningInk: 'var(--color-warning-ink)',
  warningBorder: 'var(--color-warning-border)',
  dangerBg: 'var(--color-danger-bg)',
  dangerInk: 'var(--color-danger-ink)',
  dangerBorder: 'var(--color-danger-border)',
  infoBg: 'var(--color-info-bg)',
  infoInk: 'var(--color-info-ink)',
  infoBorder: 'var(--color-info-border)'
} as const;

export const EDITORIAL_TYPOGRAPHY_TOKENS = {
  displayHero: 'var(--text-display-hero)',
  pageTitle: 'var(--text-page-title)',
  sectionHeading: 'var(--text-section-heading)',
  cardTitle: 'var(--text-card-title)',
  body: 'var(--text-body)',
  supporting: 'var(--text-supporting)',
  metadata: 'var(--text-metadata)',
  urduSize: 'var(--dmc-text-urdu)',
  urduLeading: 'var(--dmc-leading-urdu)',
  proseMeasure: 'var(--dmc-measure-prose)'
} as const;

export const EDITORIAL_RADII_TOKENS = {
  control: 'var(--radius-control)',
  panel: 'var(--radius-panel)',
  sheet: 'var(--radius-sheet)',
  pill: 'var(--dmc-radius-pill)'
} as const;

export const EDITORIAL_ELEVATION_TOKENS = {
  level0: 'var(--shadow-editorial-0)',
  level1: 'var(--shadow-editorial-1)',
  level2: 'var(--shadow-editorial-2)',
  level3: 'var(--shadow-editorial-3)'
} as const;

export const EDITORIAL_TAXONOMY_TOKENS = {
  sage: { bgVar: 'var(--dmc-ed-tax-sage-bg)', inkVar: 'var(--dmc-ed-tax-sage-ink)' },
  stone: { bgVar: 'var(--dmc-ed-tax-stone-bg)', inkVar: 'var(--dmc-ed-tax-stone-ink)' },
  slate: { bgVar: 'var(--dmc-ed-tax-slate-bg)', inkVar: 'var(--dmc-ed-tax-slate-ink)' },
  olive: { bgVar: 'var(--dmc-ed-tax-olive-bg)', inkVar: 'var(--dmc-ed-tax-olive-ink)' }
} as const;

export const MOTION_TOKENS = {
  durationPress: 'var(--motion-duration-press)',
  durationHover: 'var(--motion-duration-hover)',
  durationPopover: 'var(--motion-duration-popover)',
  durationDialog: 'var(--motion-duration-dialog)',
  durationReveal: 'var(--motion-duration-reveal)',
  durationRoute: 'var(--motion-duration-route)',
  durationQuiz: 'var(--motion-duration-quiz)',
  easeEnter: 'var(--motion-ease-enter)',
  easeExit: 'var(--motion-ease-exit)'
} as const;
