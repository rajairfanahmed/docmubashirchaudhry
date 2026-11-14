import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth/guards';
import { getOptionalAdminClient } from '@/lib/supabase/admin';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

const QuestionReportInputSchema = z.object({
  questionId: z.string().trim().min(1, 'Question ID is required'),
  message: z
    .string()
    .trim()
    .min(5, 'Report explanation must be at least 5 characters')
    .max(500, 'Report explanation cannot exceed 500 characters')
});

// In-memory rate limiting tracker: 5 reports per hour per user
const reportRateLimitMap = new Map<string, number[]>();

function checkReportRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const timestamps = (reportRateLimitMap.get(userId) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= 5) {
    return false;
  }

  timestamps.push(now);
  reportRateLimitMap.set(userId, timestamps);
  return true;
}

/**
 * POST /api/question-reports (API-17)
 * Allows authenticated active users to report errors or ambiguities in questions.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAuthenticatedUser({ allowBlocked: false, syncProfile: false });
    const parsed = await parseJsonWithSchema(request, QuestionReportInputSchema);
    if ('response' in parsed) return parsed.response;

    if (!checkReportRateLimit(auth.user.id)) {
      return apiErrorResponse({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'You have submitted too many question reports recently. Please wait an hour before submitting again.'
      });
    }

    const admin = getOptionalAdminClient();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    if (admin) {
      const { error } = await admin.from('question_reports').insert({
        id,
        question_id: parsed.data.questionId,
        reported_by: auth.user.id,
        reporter_email: auth.email,
        message: parsed.data.message,
        status: 'new',
        created_at: createdAt
      });

      if (error) {
        console.warn('Database insert warning for question_reports:', error.message);
      }
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            id,
            questionId: parsed.data.questionId,
            status: 'new',
            createdAt
          }
        },
        {
          status: 201,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/question-reports');
  }
}
