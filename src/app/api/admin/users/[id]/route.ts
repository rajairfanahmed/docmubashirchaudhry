import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { ProfileRow, QuizAttemptRow, PdfAccessLogRow, QuizRow, PdfResourceRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/{id} (API-23)
 * Returns complete user dossier including profile, quiz history, and download activity.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { id } = await context.params;
    const userId = decodeURIComponent(id).trim();

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .or(`clerk_user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle<ProfileRow>();

    if (profileError) throw profileError;
    if (!profile) {
      return apiErrorResponse({
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'The requested user account was not found.'
      });
    }

    // 2. Fetch Attempts
    const { data: attempts, error: attemptsError } = await admin
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (attemptsError) throw attemptsError;

    // Resolve quiz titles
    const attemptRows = (attempts ?? []) as QuizAttemptRow[];
    const quizIds = Array.from(new Set(attemptRows.map((a) => a.quiz_id)));
    const quizMap = new Map<string, string>();
    if (quizIds.length > 0) {
      const { data: quizzes } = await admin.from('quizzes').select('id, title').in('id', quizIds);
      if (quizzes) {
        for (const q of quizzes as Array<Pick<QuizRow, 'id' | 'title'>>) {
          quizMap.set(q.id, q.title);
        }
      }
    }

    // 3. Fetch Downloads
    const { data: downloads, error: downloadsError } = await admin
      .from('pdf_access_log')
      .select('*')
      .eq('user_id', profile.id)
      .order('downloaded_at', { ascending: false })
      .limit(50);

    if (downloadsError) throw downloadsError;

    // Resolve PDF titles
    const downloadRows = (downloads ?? []) as PdfAccessLogRow[];
    const pdfIds = Array.from(new Set(downloadRows.map((d) => d.pdf_id)));
    const pdfMap = new Map<string, string>();
    if (pdfIds.length > 0) {
      const { data: pdfs } = await admin.from('pdf_resources').select('id, title').in('id', pdfIds);
      if (pdfs) {
        for (const p of pdfs as Array<Pick<PdfResourceRow, 'id' | 'title'>>) {
          pdfMap.set(p.id, p.title);
        }
      }
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            profile: {
              id: profile.id,
              clerkUserId: profile.clerk_user_id ?? profile.id,
              email: profile.email,
              displayName: profile.display_name,
              authProvider: profile.auth_provider,
              status: profile.status ?? 'active',
              blockedReason: profile.blocked_reason ?? null,
              role: profile.role ?? (profile.is_admin ? 'admin' : 'user'),
              isAdmin: Boolean(profile.is_admin),
              createdAt: profile.created_at,
              lastActiveAt: profile.last_active_at ?? profile.created_at
            },
            attempts: attemptRows.map((a) => ({
              id: a.id,
              quizId: a.quiz_id,
              quizTitle: quizMap.get(a.quiz_id) ?? 'Quiz',
              score: Number(a.score),
              maxScore: Number(a.max_score),
              percentage: Number(a.percentage),
              passed: a.passed,
              correctCount: a.correct_count,
              incorrectCount: a.incorrect_count,
              unansweredCount: a.unanswered_count,
              timeTakenSeconds: a.time_taken_seconds,
              autoSubmitted: a.auto_submitted,
              createdAt: a.created_at
            })),
            downloads: downloadRows.map((d) => ({
              id: d.id,
              pdfId: d.pdf_id,
              pdfTitle: pdfMap.get(d.pdf_id) ?? 'Study Document',
              downloadedAt: d.downloaded_at
            }))
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/users/[id]');
  }
}
