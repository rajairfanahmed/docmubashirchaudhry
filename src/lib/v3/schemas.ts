import { z } from 'zod';
import { MAX_PDF_UPLOAD_BYTES } from '@/lib/r2/client';

const SlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric hyphens');

export const SignupBodySchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
    displayName: z.string().trim().min(2).max(120).optional(),
    next: z.string().trim().max(256).optional()
  })
  .strict();

export const LoginBodySchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128)
  })
  .strict();

export const PdfUploadUrlRequestSchema = z
  .object({
    filename: z.string().trim().min(5).max(180),
    contentType: z.literal('application/pdf'),
    fileSizeBytes: z.number().int().min(1).max(MAX_PDF_UPLOAD_BYTES)
  })
  .strict();

export const CreatePdfResourceSchema = z
  .object({
    slug: SlugSchema,
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).default(''),
    subject: z.string().trim().min(2).max(120),
    examTag: z.string().trim().min(2).max(80),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    fileKey: z
      .string()
      .trim()
      .regex(/^pdfs\/[a-z0-9/_-]+\.pdf$/i, 'Invalid R2 PDF file key'),
    fileSize: z.number().int().min(1).max(MAX_PDF_UPLOAD_BYTES),
    sha256: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/i, 'SHA-256 must be 64 lowercase hex characters')
      .transform((v) => v.toLowerCase())
      .nullable()
      .optional(),
    watermarkConfirmed: z.literal(true, {
      message: 'Confirm the PDF carries the owner watermark before publishing.'
    }),
    isPublished: z.boolean().default(true)
  })
  .strict();

export const UpdatePdfResourceSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    subject: z.string().trim().min(2).max(120).optional(),
    examTag: z.string().trim().min(2).max(80).optional(),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    watermarkConfirmed: z.boolean().optional(),
    isPublished: z.boolean().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update a PDF resource.'
  });

export const CreateQuizSchema = z
  .object({
    slug: SlugSchema,
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).default(''),
    type: z.enum(['practice', 'mock']),
    subject: z.string().trim().min(2).max(120),
    examTag: z.string().trim().min(2).max(80),
    timeLimitSeconds: z.number().int().min(30).max(21600).nullable().optional(),
    negativeMarking: z.boolean().default(false),
    negativeMarkingValue: z.number().min(0).max(5).default(0.25),
    passPercentage: z.number().min(0).max(100).default(40),
    language: z.enum(['en', 'ur', 'bilingual']).default('en'),
    isPublished: z.boolean().default(true)
  })
  .strict()
  .superRefine((quiz, ctx) => {
    if (quiz.type === 'mock' && (!quiz.timeLimitSeconds || quiz.timeLimitSeconds <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['timeLimitSeconds'],
        message: 'Full-Length Mock Exams require a positive timeLimitSeconds duration.'
      });
    }
  });

export const UpdateQuizSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(['practice', 'mock']).optional(),
    subject: z.string().trim().min(2).max(120).optional(),
    examTag: z.string().trim().min(2).max(80).optional(),
    timeLimitSeconds: z.number().int().min(30).max(21600).nullable().optional(),
    negativeMarking: z.boolean().optional(),
    negativeMarkingValue: z.number().min(0).max(5).optional(),
    passPercentage: z.number().min(0).max(100).optional(),
    language: z.enum(['en', 'ur', 'bilingual']).optional(),
    isPublished: z.boolean().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update a quiz.'
  });

export const QuizOptionInputSchema = z
  .object({
    key: z.string().trim().min(1).max(8),
    textEn: z.string().trim().max(1000).nullable().optional(),
    textUr: z.string().trim().max(1000).nullable().optional()
  })
  .strict()
  .refine(
    (opt) =>
      Boolean(opt.textEn && opt.textEn.trim().length > 0) ||
      Boolean(opt.textUr && opt.textUr.trim().length > 0),
    {
      message: 'Each option must provide non-empty English or Urdu text.'
    }
  );

export const CreateQuestionSchema = z
  .object({
    quizId: z.string().uuid().nullable().optional(),
    subject: z.string().trim().min(2).max(120),
    examTag: z.string().trim().min(2).max(80),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    language: z.enum(['en', 'ur', 'bilingual']).default('en'),
    textEn: z.string().trim().max(3000).nullable().optional(),
    textUr: z.string().trim().max(3000).nullable().optional(),
    options: z.array(QuizOptionInputSchema).min(2).max(6),
    correctOption: z.string().trim().min(1).max(8),
    explanation: z.string().trim().max(4000).default(''),
    sortOrder: z.number().int().min(0).max(10000).default(0)
  })
  .strict()
  .superRefine((q, ctx) => {
    const hasEn = Boolean(q.textEn && q.textEn.trim().length > 0);
    const hasUr = Boolean(q.textUr && q.textUr.trim().length > 0);
    if (!hasEn && !hasUr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['textEn'],
        message: 'Question must include either textEn or textUr.'
      });
    }

    const keys = q.options.map((o) => o.key.trim().toUpperCase());
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Question option keys must be unique.'
      });
    }
    if (!keys.includes(q.correctOption.trim().toUpperCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correctOption'],
        message: 'correctOption must match one of the provided option keys.'
      });
    }
  });

export const UpdateQuestionSchema = z
  .object({
    quizId: z.string().uuid().nullable().optional(),
    subject: z.string().trim().min(2).max(120).optional(),
    examTag: z.string().trim().min(2).max(80).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    language: z.enum(['en', 'ur', 'bilingual']).optional(),
    textEn: z.string().trim().max(3000).nullable().optional(),
    textUr: z.string().trim().max(3000).nullable().optional(),
    options: z.array(QuizOptionInputSchema).min(2).max(6).optional(),
    correctOption: z.string().trim().min(1).max(8).optional(),
    explanation: z.string().trim().max(4000).optional(),
    sortOrder: z.number().int().min(0).max(10000).optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update a question.'
  });

export const BulkImportQuestionsSchema = z
  .object({
    quizId: z.string().uuid().nullable().optional(),
    format: z.enum(['json', 'csv']),
    questions: z.array(CreateQuestionSchema).min(1).max(500).optional(),
    csv: z.string().trim().min(10).max(2_000_000).optional(),
    defaultSubject: z.string().trim().min(2).max(120).optional(),
    defaultExamTag: z.string().trim().min(2).max(80).optional()
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (payload.format === 'json' && (!payload.questions || payload.questions.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['questions'],
        message: 'questions array is required when format is json.'
      });
    }
    if (payload.format === 'csv' && !payload.csv) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['csv'],
        message: 'csv text is required when format is csv.'
      });
    }
  });

export const CheckPracticeAnswerSchema = z
  .object({
    questionId: z.string().uuid(),
    selectedOption: z.string().trim().min(1).max(8)
  })
  .strict();

export const SubmitQuizAttemptSchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            questionId: z.string().uuid(),
            selectedOption: z.string().trim().max(8).nullable()
          })
          .strict()
      )
      .max(500),
    timeTakenSeconds: z.number().int().min(0).max(86400),
    autoSubmitted: z.boolean().default(false),
    startedAt: z.string().datetime().optional()
  })
  .strict();

export const VisitLogSchema = z
  .object({
    path: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .regex(/^\/[^\r\n\0]*$/, 'path must be a relative route starting with /')
  })
  .strict();

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

