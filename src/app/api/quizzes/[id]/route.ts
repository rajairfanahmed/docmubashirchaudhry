import { NextRequest, NextResponse } from 'next/server';
import { getOptionalSessionUser } from '@/lib/auth/guards';
import { apiErrorResponse, handleRouteError } from '@/lib/v3/http';
import { findQuizByIdOrSlug, loadQuizQuestions } from '@/lib/v3/quiz-loader';

export const dynamic = 'force-dynamic';

/**
 * GET /api/quizzes/{id} (API-06)
 * Returns a single published quiz summary and details.
 * Published only for general public; unpublished visible to admins.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getOptionalSessionUser();
    const isAdmin = Boolean(session?.isAdmin);
    const { id } = await context.params;
    const idOrSlug = decodeURIComponent(id).trim();

    const quiz = await findQuizByIdOrSlug(idOrSlug, {
      includeUnpublished: isAdmin
    });

    if (!quiz) {
      return apiErrorResponse({
        status: 404,
        code: 'QUIZ_NOT_FOUND',
        message: 'The requested quiz was not found or is no longer published.'
      });
    }

    const questions = await loadQuizQuestions(quiz.id);

    return NextResponse.json(
      {
        data: {
          id: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          description: quiz.description || null,
          exam: quiz.exam_tag,
          type: quiz.type,
          subject: quiz.subject,
          languageLabel: quiz.language,
          durationMinutes: quiz.time_limit_seconds ? Math.round(quiz.time_limit_seconds / 60) : null,
          timeLimitSeconds: quiz.time_limit_seconds,
          questionCount: questions.length,
          marksPerQuestion: 1,
          totalMarks: questions.length,
          negativeMarking: {
            enabled: quiz.negative_marking,
            value: Number(quiz.negative_marking_value)
          },
          passPercentage: Number(quiz.pass_percentage),
          isPublished: quiz.is_published,
          createdAt: quiz.created_at,
          updatedAt: quiz.updated_at
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/quizzes/[id]');
  }
}
