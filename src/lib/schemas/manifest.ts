import { z } from 'zod';

export const ManifestFileEntrySchema = z.object({
  bytes: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/)
});

export const DatasetManifestSchema = z.object({
  datasetVersion: z.string().min(1),
  schemaVersion: z.literal(1),
  generatedAt: z.string().min(1),
  counts: z.object({
    sources: z.number().int().nonnegative(),
    continents: z.number().int().nonnegative(),
    regions: z.number().int().nonnegative(),
    currencies: z.number().int().nonnegative(),
    languages: z.number().int().nonnegative(),
    countriesTotal: z.number().int().nonnegative(),
    countriesPublished: z.number().int().nonnegative(),
    exams: z.number().int().nonnegative(),
    recruitmentPosts: z.number().int().nonnegative(),
    blueprints: z.number().int().nonnegative(),
    questions: z.number().int().nonnegative(),
    pdfResources: z.number().int().nonnegative()
  }),
  files: z.record(z.string(), ManifestFileEntrySchema)
});
export type DatasetManifest = z.infer<typeof DatasetManifestSchema>;

