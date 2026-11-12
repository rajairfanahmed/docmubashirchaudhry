import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, isUuid, parseJsonWithSchema } from '@/lib/v3/http';
import { UpdateQuizSchema } from '@/lib/v3/schemas';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const { id } = await context.params;
    if (!isUuid(id)) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_QUIZ_ID',
        message: 'Quiz id must be a valid UUID.'
      });
    }

    const admin = createSupabaseAdminClient();
    const { data: quiz, error } = await admin
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .maybeSingle<QuizRow>();
    if (error) throw error;
    if (!quiz) {
      return apiErrorResponse({
        status: 404,
        code: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found.'
      });
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        { item: quiz },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/quizzes/[id]');
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const { id } = await context.params;
    if (!isUuid(id)) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_QUIZ_ID',
        message: 'Quiz id must be a valid UUID.'
      });
    }

    const parsed = await parseJsonWithSchema(request, UpdateQuizSchema);
    if ('response' in parsed) return parsed.response;

    const patch: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.description !== undefined) patch.description = parsed.data.description;
    if (parsed.data.type !== undefined) patch.type = parsed.data.type;
    if (parsed.data.subject !== undefined) patch.subject = parsed.data.subject;
    if (parsed.data.examTag !== undefined) patch.exam_tag = parsed.data.examTag;
    if (parsed.data.timeLimitSeconds !== undefined) {
      patch.time_limit_seconds = parsed.data.timeLimitSeconds;
    }
    if (parsed.data.negativeMarking !== undefined) {
      patch.negative_marking = parsed.data.negativeMarking;
    }
    if (parsed.data.negativeMarkingValue !== undefined) {
      patch.negative_marking_value = parsed.data.negativeMarkingValue;
    }
    if (parsed.data.passPercentage !== undefined) {
      patch.pass_percentage = parsed.data.passPercentage;
    }
    if (parsed.data.language !== undefined) patch.language = parsed.data.language;
    if (parsed.data.isPublished !== undefined) patch.is_published = parsed.data.isPublished;

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('quizzes')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle<QuizRow>();

    if (error) throw error;
    if (!data) {
      return apiErrorResponse({
        status: 404,
        code: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found.'
      });
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        { item: data },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/admin/quizzes/[id]');
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const { id } = await context.params;
    if (!isUuid(id)) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_QUIZ_ID',
        message: 'Quiz id must be a valid UUID.'
      });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('quizzes')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle<{ id: string }>();
    if (error) throw error;
    if (!data) {
      return apiErrorResponse({
        status: 404,
        code: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found.'
      });
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        { deleted: true, id: data.id },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/admin/quizzes/[id]');
  }
}

