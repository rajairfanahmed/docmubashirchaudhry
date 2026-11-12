import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizQuestionRow } from '@/lib/supabase/database.types';
import { handleRouteError, parseJsonWithSchema, validationErrorResponse } from '@/lib/v3/http';
import { CreateQuestionSchema, PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const QuestionFilterQuerySchema = PaginationParamsSchema.extend({
  quizId: z.string().uuid().optional(),
  subject: z.string().trim().min(1).max(120).optional(),
  examTag: z.string().trim().min(1).max(80).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional()
});

function nonEmpty(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key);
  return value && value.trim() ? value.trim() : undefined;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = QuestionFilterQuerySchema.safeParse({
    page: nonEmpty(request, 'page'),
    pageSize: nonEmpty(request, 'pageSize'),
    quizId: nonEmpty(request, 'quizId'),
    subject: nonEmpty(request, 'subject'),
    examTag: nonEmpty(request, 'examTag'),
    difficulty: nonEmpty(request, 'difficulty')
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize, quizId, subject, examTag, difficulty } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin.from('quiz_questions').select('*', { count: 'exact' });
    if (quizId) query = query.eq('quiz_id', quizId);
    if (subject) query = query.eq('subject', subject);
    if (examTag) query = query.eq('exam_tag', examTag);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data, count, error } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = (data ?? []) as QuizQuestionRow[];
    const totalItems = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          items: rows,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/questions');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, CreateQuestionSchema);
    if ('response' in parsed) return parsed.response;

    const admin = createSupabaseAdminClient();
    const q = parsed.data;

    const { data, error } = await admin
      .from('quiz_questions')
      .insert({
        quiz_id: q.quizId ?? null,
        subject: q.subject,
        exam_tag: q.examTag,
        difficulty: q.difficulty,
        language: q.language,
        text_en: q.textEn ?? null,
        text_ur: q.textUr ?? null,
        options: q.options.map((o) => ({
          key: o.key.toUpperCase(),
          textEn: o.textEn ?? null,
          ...(o.textUr ? { textUr: o.textUr } : {})
        })),
        correct_option: q.correctOption.toUpperCase(),
        explanation: q.explanation,
        sort_order: q.sortOrder
      })
      .select('*')
      .single<QuizQuestionRow>();

    if (error) throw error;

    return auth.applyAuthCookies(
      NextResponse.json(
        { item: data },
        { status: 201, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/questions');
  }
}

