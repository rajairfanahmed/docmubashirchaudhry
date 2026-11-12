import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizQuestionRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, isUuid, parseJsonWithSchema } from '@/lib/v3/http';
import { UpdateQuestionSchema } from '@/lib/v3/schemas';

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
        code: 'INVALID_QUESTION_ID',
        message: 'Question id must be a valid UUID.'
      });
    }

    const parsed = await parseJsonWithSchema(request, UpdateQuestionSchema);
    if ('response' in parsed) return parsed.response;

    const admin = createSupabaseAdminClient();
    const { data: existing, error: fetchError } = await admin
      .from('quiz_questions')
      .select('*')
      .eq('id', id)
      .maybeSingle<QuizQuestionRow>();
    if (fetchError) throw fetchError;
    if (!existing) {
      return apiErrorResponse({
        status: 404,
        code: 'QUESTION_NOT_FOUND',
        message: 'Question not found.'
      });
    }

    const nextOptions = parsed.data.options
      ? parsed.data.options.map((o) => ({
          key: o.key.toUpperCase(),
          textEn: o.textEn ?? null,
          ...(o.textUr ? { textUr: o.textUr } : {})
        }))
      : existing.options;
    const nextCorrect = (parsed.data.correctOption ?? existing.correct_option)
      .trim()
      .toUpperCase();
    const nextTextEn =
      parsed.data.textEn !== undefined ? parsed.data.textEn : existing.text_en;
    const nextTextUr =
      parsed.data.textUr !== undefined ? parsed.data.textUr : existing.text_ur;

    const optionKeys = nextOptions.map((o) => o.key.toUpperCase());
    if (new Set(optionKeys).size !== optionKeys.length) {
      return apiErrorResponse({
        status: 400,
        code: 'DUPLICATE_OPTION_KEYS',
        message: 'Question option keys must be unique.'
      });
    }
    if (!optionKeys.includes(nextCorrect)) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_CORRECT_OPTION',
        message: 'correctOption must match one of the question options.'
      });
    }
    if (
      !(nextTextEn && nextTextEn.trim().length > 0) &&
      !(nextTextUr && nextTextUr.trim().length > 0)
    ) {
      return apiErrorResponse({
        status: 400,
        code: 'EMPTY_PROMPT',
        message: 'Question must keep at least one non-empty English or Urdu prompt.'
      });
    }

    const patch: Record<string, unknown> = {};
    if (parsed.data.quizId !== undefined) patch.quiz_id = parsed.data.quizId;
    if (parsed.data.subject !== undefined) patch.subject = parsed.data.subject;
    if (parsed.data.examTag !== undefined) patch.exam_tag = parsed.data.examTag;
    if (parsed.data.difficulty !== undefined) patch.difficulty = parsed.data.difficulty;
    if (parsed.data.language !== undefined) patch.language = parsed.data.language;
    if (parsed.data.textEn !== undefined) patch.text_en = parsed.data.textEn;
    if (parsed.data.textUr !== undefined) patch.text_ur = parsed.data.textUr;
    if (parsed.data.options !== undefined) patch.options = nextOptions;
    if (parsed.data.correctOption !== undefined) patch.correct_option = nextCorrect;
    if (parsed.data.explanation !== undefined) patch.explanation = parsed.data.explanation;
    if (parsed.data.sortOrder !== undefined) patch.sort_order = parsed.data.sortOrder;

    const { data: updated, error: updateError } = await admin
      .from('quiz_questions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single<QuizQuestionRow>();

    if (updateError) throw updateError;

    return auth.applyAuthCookies(
      NextResponse.json(
        { item: updated },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'PATCH /api/admin/questions/[id]');
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
        code: 'INVALID_QUESTION_ID',
        message: 'Question id must be a valid UUID.'
      });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('quiz_questions')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) {
      return apiErrorResponse({
        status: 404,
        code: 'QUESTION_NOT_FOUND',
        message: 'Question not found.'
      });
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        { deleted: true, id: data.id },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/admin/questions/[id]');
  }
}

