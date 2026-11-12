import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { parseSecretSupabaseConfig } from '@/lib/env';
import type { QuizRow } from '@/lib/supabase/database.types';
import { handleRouteError, validationErrorResponse } from '@/lib/v3/http';
import { PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

const QuizListQuerySchema = PaginationParamsSchema.extend({
  type: z.enum(['practice', 'mock']).optional(),
  subject: z.string().trim().min(1).max(120).optional(),
  examTag: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().min(1).max(120).optional()
});

function nonEmpty(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key);
  return value && value.trim() ? value.trim() : undefined;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = QuizListQuerySchema.safeParse({
    page: nonEmpty(request, 'page'),
    pageSize: nonEmpty(request, 'pageSize'),
    type: nonEmpty(request, 'type'),
    subject: nonEmpty(request, 'subject'),
    examTag: nonEmpty(request, 'examTag'),
    search: nonEmpty(request, 'search')
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  if (!parseSecretSupabaseConfig()) {
    return NextResponse.json(
      {
        items: [],
        pagination: {
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        configured: false
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const { page, pageSize, type, subject, examTag, search } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin
      .from('quizzes')
      .select('*', { count: 'exact' })
      .eq('is_published', true);

    if (type) query = query.eq('type', type);
    if (subject) query = query.eq('subject', subject);
    if (examTag) query = query.eq('exam_tag', examTag);
    if (search) {
      const sanitized = search.replace(/[%_,()]/g, ' ').trim();
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = (data ?? []) as QuizRow[];
    const quizIds = rows.map((q) => q.id);

    const questionCounts = new Map<string, number>();
    if (quizIds.length > 0) {
      const { data: qRows, error: qError } = await admin
        .from('quiz_questions')
        .select('quiz_id')
        .in('quiz_id', quizIds);
      if (qError) throw qError;
      for (const item of (qRows ?? []) as Array<{ quiz_id: string | null }>) {
        if (item.quiz_id) {
          questionCounts.set(item.quiz_id, (questionCounts.get(item.quiz_id) ?? 0) + 1);
        }
      }
    }

    const totalItems = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json(
      {
        items: rows.map((q) => ({
          id: q.id,
          slug: q.slug,
          title: q.title,
          description: q.description,
          type: q.type,
          subject: q.subject,
          examTag: q.exam_tag,
          timeLimitSeconds: q.time_limit_seconds,
          negativeMarking: q.negative_marking,
          negativeMarkingValue: Number(q.negative_marking_value),
          passPercentage: Number(q.pass_percentage),
          language: q.language,
          questionCount: questionCounts.get(q.id) ?? 0,
          createdAt: q.created_at,
          requiresAuth: true
        })),
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      }
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/quizzes');
  }
}

