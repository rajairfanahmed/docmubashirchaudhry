import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizAttemptRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { gradeQuizAttempt } from '@/lib/v3/quiz-grading';
import { findQuizByIdOrSlug, loadQuizQuestions } from '@/lib/v3/quiz-loader';
import { SubmitQuizAttemptSchema } from '@/lib/v3/schemas';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ syncProfile: true });
    const parsed = await parseJsonWithSchema(request, SubmitQuizAttemptSchema);
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

    const questions = await loadQuizQuestions(quiz.id);
    if (questions.length === 0) {
      return apiErrorResponse({
        status: 409,
        code: 'QUIZ_EMPTY',
        message: 'Quiz has no questions to grade.'
      });
    }

    const graded = gradeQuizAttempt({
      quiz,
      questions,
      submittedAnswers: parsed.data.answers,
      timeTakenSeconds: parsed.data.timeTakenSeconds,
      autoSubmitted: parsed.data.autoSubmitted,
      startedAtIso: parsed.data.startedAt
    });

    const admin = createSupabaseAdminClient();
    const { data: inserted, error: insertError } = await admin
      .from('quiz_attempts')
      .insert({
        user_id: auth.user.id,
        quiz_id: quiz.id,
        score: graded.score,
        max_score: graded.maxScore,
        percentage: graded.percentage,
        passed: graded.passed,
        correct_count: graded.correctCount,
        incorrect_count: graded.incorrectCount,
        unanswered_count: graded.unansweredCount,
        time_taken_seconds: graded.timeTakenSeconds,
        auto_submitted: graded.autoSubmitted,
        answers: graded.answerRecords,
        started_at: parsed.data.startedAt ?? null
      })
      .select('id, created_at')
      .single<Pick<QuizAttemptRow, 'id' | 'created_at'>>();

    if (insertError) throw insertError;

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          attemptId: inserted.id,
          quizId: quiz.id,
          quizTitle: quiz.title,
          quizType: quiz.type,
          score: graded.score,
          maxScore: graded.maxScore,
          percentage: graded.percentage,
          passed: graded.passed,
          correctCount: graded.correctCount,
          incorrectCount: graded.incorrectCount,
          unansweredCount: graded.unansweredCount,
          timeTakenSeconds: graded.timeTakenSeconds,
          autoSubmitted: graded.autoSubmitted,
          createdAt: inserted.created_at,
          review: graded.review
        },
        {
          status: 201,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/quizzes/[id]/submit');
  }
}

