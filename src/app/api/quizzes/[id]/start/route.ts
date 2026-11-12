import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { apiErrorResponse, handleRouteError } from '@/lib/v3/http';
import { stripQuestionSecrets } from '@/lib/v3/quiz-grading';
import { findQuizByIdOrSlug, loadQuizQuestions } from '@/lib/v3/quiz-loader';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ syncProfile: true });
    const { id } = await context.params;
    const idOrSlug = decodeURIComponent(id).trim();
    const quiz = await findQuizByIdOrSlug(idOrSlug, {
      includeUnpublished: auth.isAdmin
    });

    if (!quiz) {
      return apiErrorResponse({
        status: 404,
        code: 'QUIZ_NOT_FOUND',
        message: 'Requested quiz was not found.'
      });
    }

    const questions = await loadQuizQuestions(quiz.id);
    if (questions.length === 0) {
      return apiErrorResponse({
        status: 409,
        code: 'QUIZ_EMPTY',
        message: 'This quiz currently has no published questions.'
      });
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          quiz: {
            id: quiz.id,
            slug: quiz.slug,
            title: quiz.title,
            description: quiz.description,
            type: quiz.type,
            subject: quiz.subject,
            examTag: quiz.exam_tag,
            timeLimitSeconds: quiz.time_limit_seconds,
            negativeMarking: quiz.negative_marking,
            negativeMarkingValue: Number(quiz.negative_marking_value),
            passPercentage: Number(quiz.pass_percentage),
            language: quiz.language,
            questionCount: questions.length
          },
          questions: stripQuestionSecrets(questions),
          startedAt: new Date().toISOString()
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/quizzes/[id]/start');
  }
}

