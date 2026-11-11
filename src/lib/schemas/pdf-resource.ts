import { z } from 'zod';
import { ContentLifecycleStatusSchema, SlugSchema, VerificationSchema } from './common';

export const PdfRightsSchema = z.enum([
  'author_original',
  'public_domain_official',
  'cc_by_4',
  'permission_granted'
]);
export type PdfRights = z.infer<typeof PdfRightsSchema>;

export const PdfResourceSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  title: z.string().min(1),
  author: z.string().min(1),
  edition: z.string().min(1),
  gradeLabel: z.string().min(1),
  filePath: z.string().startsWith('/'),
  fileSizeBytes: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/, 'Expected 64-character lowercase SHA-256 hex digest'),
  pageCount: z.number().int().positive().optional(),
  questionCount: z.number().int().nonnegative().optional(),
  summary: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  postIds: z.array(z.string().min(1)).default([]),
  topicIds: z.array(z.string().min(1)).default([]),
  thumbnailPath: z.string().startsWith('/').optional(),
  rights: PdfRightsSchema,
  licenseNote: z.string().optional(),
  status: ContentLifecycleStatusSchema,
  verification: VerificationSchema
});
export type PdfResource = z.infer<typeof PdfResourceSchema>;

