import { z } from 'zod';
import { ContentLifecycleStatusSchema, SlugSchema, VerificationSchema } from './common';

export const OptionIdSchema = z.enum(['a', 'b', 'c', 'd', 'e']);
export type OptionId = z.infer<typeof OptionIdSchema>;

export const McqOptionSchema = z.object({
  id: OptionIdSchema,
  text: z.string().min(1)
});
export type McqOption = z.infer<typeof McqOptionSchema>;

export const QuestionAttributionSchema = z.enum([
  'self_written',
  'past_paper_memory',
  'public_domain',
  'licensed'
]);
export type QuestionAttribution = z.infer<typeof QuestionAttributionSchema>;

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    slug: SlugSchema.optional(),
    stem: z.string().min(5),
    options: z.array(McqOptionSchema).min(4).max(5),
    correctOptionId: OptionIdSchema,
    explanation: z.string().min(1),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    topicIds: z.array(z.string().min(1)).min(1),
    postIds: z.array(z.string().min(1)).default([]),
    examYear: z.number().int().min(1947).max(2100).optional(),
    attribution: QuestionAttributionSchema,
    status: ContentLifecycleStatusSchema,
    verification: VerificationSchema
  })
  .superRefine((q, ctx) => {
    const ids = new Set<string>();
    for (const opt of q.options) {
      if (ids.has(opt.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate option id "${opt.id}" in question "${q.id}"`,
          path: ['options']
        });
      }
      ids.add(opt.id);
    }
    if (!ids.has(q.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `correctOptionId "${q.correctOptionId}" does not match any option id in question "${q.id}"`,
        path: ['correctOptionId']
      });
    }
  });
export type Question = z.infer<typeof QuestionSchema>;

