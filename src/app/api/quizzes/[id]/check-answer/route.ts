import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizQuestionRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { checkSingleQuestionAnswer } from '@/lib/v3/quiz-grading';
import { findQuizByIdOrSlug } from '@/lib/v3/quiz-loader';
import { CheckPracticeAnswerSchema } from '@/lib/v3/schemas';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ syncProfile: true });
    const parsed = await parseJsonWithSchema(request, CheckPracticeAnswerSchema);
    if ('response' in parsed) return parsed.response;

    const { id } = await context.params;
    const quiz = await findQuizByIdOrSlug(decodeURIComponent(id).trim(), {
      includeUnpublished: auth.isAdmin
    });

    if (!quiz) {
      return apiErrorResponse({
        status: 404,
        code: 'QUIZ_NOT_FOUND',
        message: 'Requested quiz was not found.'
      });
    }

    if (quiz.type !== 'practice') {
      return apiErrorResponse({
        status: 403,
        code: 'MOCK_ANSWERS_SEALED',
        message: 'Full-Length Mock Exam answers are graded only upon submission.'
      });
    }

    const admin = createSupabaseAdminClient();
    const { data: question, error } = await admin
      .from('quiz_questions')
      .select('*')
      .eq('id', parsed.data.questionId)
      .eq('quiz_id', quiz.id)
      .maybeSingle<QuizQuestionRow>();

    if (error) throw error;
    if (!question) {
      return apiErrorResponse({
        status: 404,
        code: 'QUESTION_NOT_FOUND',
        message: 'Question does not belong to this quiz.'
      });
    }

    const result = checkSingleQuestionAnswer({
      question,
      selectedOption: parsed.data.selectedOption
    });

    return auth.applyAuthCookies(
      NextResponse.json(result, {
        status: 200,
        headers: { 'Cache-Control': 'private, no-store' }
      })
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/quizzes/[id]/check-answer');
  }
}

