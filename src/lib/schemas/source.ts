import { z } from 'zod';
import { IsoDateStringSchema } from './common';

export const AuthorityTypeSchema = z.enum([
  'official_commission',
  'official_gazette',
  'un_geodata',
  'editorial',
  'secondary_portal'
]);
export type AuthorityType = z.infer<typeof AuthorityTypeSchema>;

export const SourceReliabilitySchema = z.enum(['primary', 'secondary']);
export type SourceReliability = z.infer<typeof SourceReliabilitySchema>;

/**
 * Citation registry entry referenced by entity verification metadata.
 */
export const SourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  authorityType: AuthorityTypeSchema,
  url: z
    .string()
    .refine(
      (val) => val.startsWith('https://') || val.startsWith('http://') || val.startsWith('/'),
      'Expected an http(s) URL or site-relative document path'
    ),
  accessedAt: IsoDateStringSchema,
  reliability: SourceReliabilitySchema,
  publisher: z.string().min(1),
  notes: z.string().optional()
});
export type Source = z.infer<typeof SourceSchema>;

export const SourcesFileSchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(SourceSchema)
});

