import { z } from 'zod';
import { SlugSchema } from './common';

export const SubjectSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  accentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  iconName: z.string().min(1).optional(),
  iconUrl: z.string().min(1).optional(),
  badgeLabel: z.string().min(1).max(20).optional()
});
export type Subject = z.infer<typeof SubjectSchema>;

export const TopicSchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  subjectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  parentTopicId: z.string().optional()
});
export type Topic = z.infer<typeof TopicSchema>;

