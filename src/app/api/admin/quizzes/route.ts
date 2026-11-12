import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizRow } from '@/lib/supabase/database.types';
import { handleRouteError, parseJsonWithSchema, validationErrorResponse } from '@/lib/v3/http';
import { CreateQuizSchema, PaginationParamsSchema } from '@/lib/v3/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsedQuery = PaginationParamsSchema.safeParse({
    page: request.nextUrl.searchParams.get('page') ?? undefined,
    pageSize: request.nextUrl.searchParams.get('pageSize') ?? undefined
  });
  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error);
  }

  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { page, pageSize } = parsedQuery.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await admin
      .from('quizzes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = (data ?? []) as QuizRow[];
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
    return handleRouteError(error, 'GET /api/admin/quizzes');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, CreateQuizSchema);
    if ('response' in parsed) return parsed.response;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('quizzes')
      .insert({
        slug: parsed.data.slug,
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        subject: parsed.data.subject,
        exam_tag: parsed.data.examTag,
        time_limit_seconds: parsed.data.timeLimitSeconds ?? null,
        negative_marking: parsed.data.negativeMarking,
        negative_marking_value: parsed.data.negativeMarkingValue,
        pass_percentage: parsed.data.passPercentage,
        language: parsed.data.language,
        is_published: parsed.data.isPublished,
        created_by: auth.user.id
      })
      .select('*')
      .single<QuizRow>();

    if (error) throw error;

    return auth.applyAuthCookies(
      NextResponse.json(
        { item: data },
        { status: 201, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/quizzes');
  }
}

