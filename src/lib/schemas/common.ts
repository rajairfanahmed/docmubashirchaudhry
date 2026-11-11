import { z } from 'zod';

/**
 * ISO calendar date string (YYYY-MM-DD).
 */
export const IsoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected ISO date formatted as YYYY-MM-DD');

/**
 * Lowercase hyphenated URL slug.
 */
export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected lowercase hyphenated slug');

/**
 * Publication lifecycle status for every content entity.
 */
export const ContentLifecycleStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ContentLifecycleStatus = z.infer<typeof ContentLifecycleStatusSchema>;

/**
 * Data verification state enforced across public artifacts.
 */
export const VerificationStatusSchema = z.enum([
  'verified',
  'unverified',
  'disputed',
  'outdated'
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/**
 * Provenance and review metadata attached to canonical records.
 */
export const VerificationSchema = z.object({
  status: VerificationStatusSchema,
  sourceIds: z.array(z.string().min(1)),
  verifiedAt: IsoDateStringSchema.optional(),
  lastCheckedAt: IsoDateStringSchema,
  reviewIntervalDays: z.number().int().positive(),
  notes: z.string().optional()
});
export type Verification = z.infer<typeof VerificationSchema>;

