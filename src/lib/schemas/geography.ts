import { z } from 'zod';
import { ContentLifecycleStatusSchema, SlugSchema, VerificationSchema } from './common';

export const ContinentSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  name: z.string().min(1),
  code: z.string().min(2).max(4)
});
export type Continent = z.infer<typeof ContinentSchema>;

export const RegionSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  name: z.string().min(1),
  continentId: z.string().min(1)
});
export type Region = z.infer<typeof RegionSchema>;

export const CurrencySchema = z.object({
  id: z.string().min(1),
  code: z.string().regex(/^[A-Z]{3}$/, 'Expected 3-letter ISO 4217 currency code'),
  name: z.string().min(1),
  symbol: z.string().min(1).optional(),
  minorUnit: z.number().int().min(0).max(4).default(2)
});
export type Currency = z.infer<typeof CurrencySchema>;

export const LanguageSchema = z.object({
  id: z.string().min(1),
  iso639_1: z.string().regex(/^[a-z]{2}$/).optional(),
  iso639_2: z.string().regex(/^[a-z]{3}$/).optional(),
  name: z.string().min(1),
  nativeName: z.string().min(1).optional(),
  family: z.string().optional()
});
export type Language = z.infer<typeof LanguageSchema>;

export const DisputedFlagsSchema = z
  .object({
    capital: z.boolean().optional(),
    sovereignty: z.boolean().optional(),
    currency: z.boolean().optional(),
    language: z.boolean().optional(),
    disputedNote: z.string().optional()
  })
  .superRefine((val, ctx) => {
    const anyDisputed = Boolean(val.capital || val.sovereignty || val.currency || val.language);
    if (anyDisputed && (!val.disputedNote || val.disputedNote.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'disputedNote is required whenever any disputed flag is true',
        path: ['disputedNote']
      });
    }
  });
export type DisputedFlags = z.infer<typeof DisputedFlagsSchema>;

export const FlagAssetsSchema = z.object({
  svgPath: z
    .string()
    .refine(
      (val) => val.startsWith('/') || val.startsWith('https://'),
      'Expected relative asset path or https flag URL'
    ),
  emoji: z.string().min(1),
  alt: z.string().min(1)
});
export type FlagAssets = z.infer<typeof FlagAssetsSchema>;

export const CountryDifficultySchema = z.enum(['core', 'standard', 'advanced']);

/**
 * Canonical Country entity supporting multi-capitals, multi-currencies,
 * multi-languages, disputed flags, and source verification.
 */
export const CountryEntitySchema = z.object({
  id: z.string().min(2),
  slug: SlugSchema,
  isoAlpha2: z.string().regex(/^[A-Z]{2}$/),
  isoAlpha3: z.string().regex(/^[A-Z]{3}$/),
  isoNumeric: z.string().regex(/^\d{3}$/).optional(),
  nameCommon: z.string().min(1),
  nameOfficial: z.string().min(1),
  capitals: z.array(z.string().min(1)),
  continentId: z.string().min(1),
  regionId: z.string().min(1),
  subregion: z.string().min(1).optional(),
  currencyIds: z.array(z.string().min(1)),
  officialLanguageIds: z.array(z.string().min(1)),
  flag: FlagAssetsSchema,
  isSovereign: z.boolean(),
  difficulty: CountryDifficultySchema.default('standard'),
  tags: z.array(z.string()).default([]),
  disputed: DisputedFlagsSchema.optional(),
  status: ContentLifecycleStatusSchema,
  verification: VerificationSchema
});
export type CountryEntity = z.infer<typeof CountryEntitySchema>;

export const CountryQuizRuleSchema = z.object({
  schemaVersion: z.literal(1),
  factTypes: z.array(z.enum(['capital', 'currency', 'language'])),
  minimumDistractorsRequired: z.number().int().min(3),
  distractorPriority: z.array(z.enum(['sameRegion', 'sameContinent', 'global'])),
  requireVerifiedCountryForQuiz: z.boolean(),
  excludeDisputedFacts: z.boolean(),
  normalization: z.object({
    unicodeForm: z.literal('NFD'),
    stripCombiningDiacritics: z.boolean(),
    caseInsensitive: z.boolean()
  })
});
export type CountryQuizRule = z.infer<typeof CountryQuizRuleSchema>;

