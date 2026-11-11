import { z } from 'zod';
import { ContentLifecycleStatusSchema, IsoDateStringSchema, SlugSchema, VerificationSchema } from './common';

export const ExamBodyCodeSchema = z.enum([
  'PPSC',
  'FPSC',
  'KPPSC',
  'SPSC',
  'BPSC',
  'NTS',
  'CSS',
  'PMS',
  'OTHER'
]);
export type ExamBodyCode = z.infer<typeof ExamBodyCodeSchema>;

export const ExamSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  bodyCode: ExamBodyCodeSchema,
  title: z.string().min(1),
  fullName: z.string().min(1),
  jurisdiction: z.string().min(1),
  officialPortalUrl: z.string().url(),
  logoDomain: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  fallbackMonogram: z.string().min(1).max(10).optional(),
  summary: z.string().min(1),
  status: ContentLifecycleStatusSchema,
  verification: VerificationSchema
});
export type Exam = z.infer<typeof ExamSchema>;

export const RecruitmentPostStateSchema = z.enum(['open', 'closed', 'upcoming', 'archived']);
export type RecruitmentPostState = z.infer<typeof RecruitmentPostStateSchema>;

/**
 * Recruitment Post metadata (Finding F1: basicScale is strictly data-driven per post/ad).
 */
export const RecruitmentPostSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  examId: z.string().min(1),
  title: z.string().min(1),
  department: z.string().min(1),
  basicScale: z.string().regex(/^BS-\d{1,2}(?:\/BS-\d{1,2})?$/, 'Expected format like BS-14'),
  advertisementNo: z.string().optional(),
  caseNo: z.string().optional(),
  totalPosts: z.number().int().positive().optional(),
  heldConditional: z.boolean().default(false),
  postStatus: RecruitmentPostStateSchema,
  applicationDeadline: IsoDateStringSchema.optional(),
  syllabusSummary: z.string().min(1),
  topicIds: z.array(z.string().min(1)),
  blueprintId: z.string().optional(),
  pdfResourceIds: z.array(z.string()),
  status: ContentLifecycleStatusSchema,
  verification: VerificationSchema
});
export type RecruitmentPost = z.infer<typeof RecruitmentPostSchema>;

/**
 * Official commission syllabus section: officialMarksPct must be null when the commission
 * has not published an exact numeric sub-breakdown.
 */
export const BlueprintOfficialSectionSchema = z.object({
  name: z.string().min(1),
  topicIds: z.array(z.string()).default([]),
  officialMarksPct: z.number().min(0).max(100).nullable(),
  approximateNote: z.string().optional()
});
export type BlueprintOfficialSection = z.infer<typeof BlueprintOfficialSectionSchema>;

/**
 * Editorial study weight recommendation: explicitly isolated from official commission sections.
 */
export const BlueprintEditorialWeightSchema = z.object({
  topicId: z.string().min(1),
  name: z.string().min(1),
  estimatedWeightPct: z.number().min(0).max(100),
  studyHoursGuide: z.string().optional(),
  rationale: z.string().min(1)
});
export type BlueprintEditorialWeight = z.infer<typeof BlueprintEditorialWeightSchema>;

export const BlueprintSchema = z.object({
  id: z.string().min(1),
  postId: z.string().min(1),
  version: z.number().int().positive(),
  title: z.string().min(1),
  totalQuestions: z.number().int().positive(),
  totalMarks: z.number().int().positive(),
  durationMinutes: z.number().int().positive(),
  negativeMarkingPerWrong: z.number().min(0),
  qualifyingMarksPct: z.number().min(0).max(100).nullable(),
  officialSections: z.array(BlueprintOfficialSectionSchema).min(1),
  editorialDisclaimer: z.string().min(1),
  editorialTopicWeights: z.array(BlueprintEditorialWeightSchema),
  status: ContentLifecycleStatusSchema,
  verification: VerificationSchema
});
export type Blueprint = z.infer<typeof BlueprintSchema>;

