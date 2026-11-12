import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { clearRateLimitBuckets } from '@/lib/v3/rate-limit';

const mockState = vi.hoisted(() => ({
  authenticated: false,
  isAdmin: false,
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'student@example.com',
  pdfRow: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    slug: 'intelligence-officer-set-01',
    title: 'Set 01 Intelligence Officer',
    file_key: 'pdfs/2026/11/set-01.pdf',
    file_size: 2630400,
    description: 'Watermarked Intelligence Officer PDF notes',
    subject: 'General Knowledge',
    exam_tag: 'PPSC',
    tags: ['ppsc', 'gk'],
    download_count: 14,
    created_at: '2026-11-12T00:00:00Z',
    is_published: true
  },
  quizRow: {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    slug: 'ppsc-mock-exam-1',
    title: 'PPSC Full Mock Paper 01',
    description: 'Timed simulation',
    type: 'mock' as 'mock' | 'practice',
    subject: 'General Knowledge',
    exam_tag: 'PPSC',
    time_limit_seconds: 5400,
    negative_marking: true,
    negative_marking_value: 0.25,
    pass_percentage: 40,
    language: 'en' as const,
    is_published: true,
    created_by: null,
    created_at: '2026-11-12T00:00:00Z',
    updated_at: '2026-11-12T00:00:00Z'
  },
  questions: [
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      quiz_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      subject: 'General Knowledge',
      exam_tag: 'PPSC',
      difficulty: 'medium' as const,
      language: 'en' as const,
      text_en: 'Capital of Pakistan?',
      text_ur: null,
      options: [
        { key: 'A', textEn: 'Lahore' },
        { key: 'B', textEn: 'Islamabad' }
      ],
      correct_option: 'B',
      explanation: 'Islamabad is the federal capital.',
      sort_order: 1,
      created_at: '2026-11-12T00:00:00Z',
      updated_at: '2026-11-12T00:00:00Z'
    }
  ],
  pdfLogsInserted: [] as Array<Record<string, unknown>>,
  attemptsInserted: [] as Array<Record<string, unknown>>,
  siteVisitsInserted: [] as Array<Record<string, unknown>>,
  rpcCalls: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  r2ObjectExists: true,
  r2ContentType: 'application/pdf'
}));

vi.mock('@/lib/auth/guards', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/guards')>('@/lib/auth/guards');
  const makeContext = () => ({
    supabase: {} as never,
    applyAuthCookies: <T extends NextResponse>(response: T) => response,
    user: { id: mockState.userId, email: mockState.email } as never,
    email: mockState.email,
    isAdmin: mockState.isAdmin,
    profile: null
  });

  return {
    ...actual,
    requireAuthenticatedUser: vi.fn(async () => {
      if (!mockState.authenticated) {
        throw new actual.ApiError(401, 'UNAUTHORIZED', 'Sign in required.');
      }
      return makeContext();
    }),
    requireAdminUser: vi.fn(async () => {
      if (!mockState.authenticated) {
        throw new actual.ApiError(401, 'UNAUTHORIZED', 'Sign in required.');
      }
      if (!mockState.isAdmin) {
        throw new actual.ApiError(403, 'FORBIDDEN', 'Owner admin allow-list required.');
      }
      return makeContext();
    }),
    getOptionalSessionUser: vi.fn(async () => ({
      user: mockState.authenticated ? ({ id: mockState.userId } as never) : null,
      email: mockState.authenticated ? mockState.email : null,
      displayName: mockState.authenticated ? 'Student' : null,
      authProvider: mockState.authenticated ? 'google' : null,
      isAdmin: mockState.authenticated && mockState.isAdmin,
      applyAuthCookies: <T extends NextResponse>(response: T) => response
    }))
  };
});

vi.mock('@/lib/r2/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/r2/client')>('@/lib/r2/client');
  return {
    ...actual,
    createPresignedPdfDownloadUrl: vi.fn(async ({ fileKey }: { fileKey: string }) => ({
      downloadUrl: `https://account.r2.cloudflarestorage.com/${encodeURIComponent(fileKey)}?X-Amz-Expires=180`,
      expiresInSeconds: 180,
      expiresAt: '2026-11-12T12:00:00Z'
    })),
    createPresignedPdfUploadUrl: vi.fn(async ({ filename }: { filename: string }) => ({
      uploadUrl: `https://account.r2.cloudflarestorage.com/pdfs/2026/11/${filename}?X-Amz-Signature=abc`,
      fileKey: `pdfs/2026/11/11111111-1111-4111-8111-111111111111-${filename}`,
      expiresInSeconds: 120,
      requiredHeaders: { 'Content-Type': 'application/pdf' }
    })),
    headPdfObject: vi.fn(async () => ({
      exists: mockState.r2ObjectExists,
      contentLength: 2630400,
      contentType: mockState.r2ContentType
    })),
    deletePdfObject: vi.fn(async () => undefined)
  };
});

vi.mock('@/lib/supabase/server', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/server')>(
    '@/lib/supabase/server'
  );
  const thenableEmpty = {
    then: (resolve: (value: { count: number; data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ count: 0, data: [], error: null }).then(resolve),
    gte: () => thenableEmpty,
    limit: async () => ({ count: 0, data: [], error: null })
  };

  return {
    ...actual,
    createSupabaseAdminClient: vi.fn(() => ({
      from: (table: string) => {
        if (table === 'pdf_resources') {
          const pdfQuery: Record<string, unknown> = {
            eq: () => pdfQuery,
            or: () => pdfQuery,
            order: () => pdfQuery,
            range: async () => ({ data: [mockState.pdfRow], count: 1, error: null }),
            maybeSingle: async () => ({ data: mockState.pdfRow, error: null })
          };
          return {
            select: () => pdfQuery,
            insert: (row: Record<string, unknown>) => ({
              select: () => ({
                single: async () => ({
                  data: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', ...row },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'pdf_access_log') {
          return {
            insert: async (row: Record<string, unknown>) => {
              mockState.pdfLogsInserted.push(row);
              return { error: null };
            },
            select: () => ({
              ...thenableEmpty,
              eq: () => ({
                order: () => ({
                  range: async () => ({ data: [], count: 0, error: null })
                })
              })
            })
          };
        }
        if (table === 'quizzes') {
          return {
            select: () => ({
              eq: (_col: string, _val: unknown) => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: mockState.quizRow, error: null })
                }),
                maybeSingle: async () => ({ data: mockState.quizRow, error: null })
              })
            })
          };
        }
        if (table === 'quiz_questions') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: async () => ({ data: mockState.questions, error: null })
                }),
                eq: () => ({
                  maybeSingle: async () => ({ data: mockState.questions[0], error: null })
                })
              })
            }),
            insert: (rows: Array<Record<string, unknown>>) => ({
              select: async () => ({
                data: rows.map((_r, idx) => ({ id: `q-id-${idx}` })),
                error: null
              })
            })
          };
        }
        if (table === 'quiz_attempts') {
          return {
            insert: (row: Record<string, unknown>) => {
              mockState.attemptsInserted.push(row);
              return {
                select: () => ({
                  single: async () => ({
                    data: {
                      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
                      created_at: '2026-11-12T10:00:00Z'
                    },
                    error: null
                  })
                })
              };
            },
            select: () => ({
              ...thenableEmpty,
              eq: () => ({
                order: () => ({
                  range: async () => ({ data: [], count: 0, error: null })
                })
              })
            })
          };
        }
        if (table === 'site_visits') {
          return {
            insert: async (row: Record<string, unknown>) => {
              mockState.siteVisitsInserted.push(row);
              return { error: null };
            },
            select: () => thenableEmpty
          };
        }
        return {
          select: () => thenableEmpty
        };
      },
      rpc: async (fn: string, args: Record<string, unknown>) => {
        mockState.rpcCalls.push({ fn, args });
        return { data: [{ deleted_visits: 4, deleted_pdf_logs: 1 }], error: null };
      }
    }))
  };
});

import { GET as getHealth } from '@/app/api/health/route';
import { GET as listPdfs } from '@/app/api/pdfs/route';
import { GET as downloadPdf } from '@/app/api/pdfs/[id]/download/route';
import { GET as startQuiz } from '@/app/api/quizzes/[id]/start/route';
import { POST as checkPracticeAnswer } from '@/app/api/quizzes/[id]/check-answer/route';
import { POST as submitQuiz } from '@/app/api/quizzes/[id]/submit/route';
import { GET as getMyAttempts } from '@/app/api/me/attempts/route';
import { POST as recordVisit } from '@/app/api/analytics/visit/route';
import { POST as createUploadUrl } from '@/app/api/admin/pdfs/upload-url/route';
import { POST as createPdf } from '@/app/api/admin/pdfs/route';
import { POST as importQuestions } from '@/app/api/admin/questions/import/route';
import { GET as getAnalyticsOverview } from '@/app/api/admin/analytics/overview/route';
import { POST as pruneAnalytics } from '@/app/api/admin/analytics/prune/route';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

describe('v3.0 API Authorization, Gating & Private Signed Download Contracts (Mocked Supabase/R2)', () => {
  beforeEach(() => {
    clearRateLimitBuckets();
    mockState.authenticated = false;
    mockState.isAdmin = false;
    mockState.quizRow.type = 'mock';
    mockState.pdfLogsInserted = [];
    mockState.attemptsInserted = [];
    mockState.siteVisitsInserted = [];
    mockState.rpcCalls = [];
    mockState.r2ObjectExists = true;
    mockState.r2ContentType = 'application/pdf';
  });

  it('preserves v2.0 /api/health output while reporting non-secret v3 readiness flags', async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.counts.countries).toBe(250);
    expect(typeof body.v3.r2Configured).toBe('boolean');
    expect(JSON.stringify(body)).not.toContain('sb_secret_');
  });

  it('blocks anonymous access (401) to gated PDF downloads, quiz start/submit, user history, and admin routes', async () => {
    const pdfRes = await downloadPdf(
      new NextRequest('http://localhost:3000/api/pdfs/intelligence-officer-set-01/download'),
      { params: Promise.resolve({ id: 'intelligence-officer-set-01' }) }
    );
    expect(pdfRes.status).toBe(401);

    const startRes = await startQuiz(
      new NextRequest('http://localhost:3000/api/quizzes/ppsc-mock-exam-1/start'),
      { params: Promise.resolve({ id: 'ppsc-mock-exam-1' }) }
    );
    expect(startRes.status).toBe(401);

    const submitRes = await submitQuiz(
      new NextRequest('http://localhost:3000/api/quizzes/ppsc-mock-exam-1/submit', {
        method: 'POST',
        body: JSON.stringify({ answers: [], timeTakenSeconds: 10 })
      }),
      { params: Promise.resolve({ id: 'ppsc-mock-exam-1' }) }
    );
    expect(submitRes.status).toBe(401);

    const historyRes = await getMyAttempts(
      new NextRequest('http://localhost:3000/api/me/attempts')
    );
    expect(historyRes.status).toBe(401);

    const adminRes = await createUploadUrl(
      new NextRequest('http://localhost:3000/api/admin/pdfs/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'booklet.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 1024
        })
      })
    );
    expect(adminRes.status).toBe(401);
  });

  it('blocks ordinary logged-in students (403) from admin endpoints and seals mock exam answers until submission', async () => {
    mockState.authenticated = true;
    mockState.isAdmin = false;

    const uploadUrlRes = await createUploadUrl(
      new NextRequest('http://localhost:3000/api/admin/pdfs/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'booklet.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 1024
        })
      })
    );
    expect(uploadUrlRes.status).toBe(403);

    const startRes = await startQuiz(
      new NextRequest('http://localhost:3000/api/quizzes/ppsc-mock-exam-1/start'),
      { params: Promise.resolve({ id: 'ppsc-mock-exam-1' }) }
    );
    expect(startRes.status).toBe(200);
    const startBody = await startRes.json();
    expect(startBody.questions[0].correct_option).toBeUndefined();
    expect(startBody.questions[0].explanation).toBeUndefined();

    const checkMockRes = await checkPracticeAnswer(
      new NextRequest('http://localhost:3000/api/quizzes/ppsc-mock-exam-1/check-answer', {
        method: 'POST',
        body: JSON.stringify({
          questionId: mockState.questions[0].id,
          selectedOption: 'B'
        })
      }),
      { params: Promise.resolve({ id: 'ppsc-mock-exam-1' }) }
    );
    expect(checkMockRes.status).toBe(403);

    const submitRes = await submitQuiz(
      new NextRequest('http://localhost:3000/api/quizzes/ppsc-mock-exam-1/submit', {
        method: 'POST',
        body: JSON.stringify({
          answers: [{ questionId: mockState.questions[0].id, selectedOption: 'A' }],
          timeTakenSeconds: 45
        })
      }),
      { params: Promise.resolve({ id: 'ppsc-mock-exam-1' }) }
    );
    expect(submitRes.status).toBe(201);
    const submitBody = await submitRes.json();
    expect(submitBody.score).toBe(-0.25);
    expect(submitBody.incorrectCount).toBe(1);
    expect(mockState.attemptsInserted).toHaveLength(1);
    expect(mockState.attemptsInserted[0].user_id).toBe(mockState.userId);
  });

  it('issues 2-5 min private signed R2 download URL, logs pdf_access_log, and enforces rate limit on burst abuse', async () => {
    mockState.authenticated = true;
    const res = await downloadPdf(
      new NextRequest('http://localhost:3000/api/pdfs/intelligence-officer-set-01/download?mode=json'),
      { params: Promise.resolve({ id: 'intelligence-officer-set-01' }) }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    const data = await res.json();
    expect(data.downloadUrl).toContain('X-Amz-Expires=180');
    expect(mockState.pdfLogsInserted).toEqual([
      { user_id: mockState.userId, pdf_id: mockState.pdfRow.id }
    ]);

    // Trigger 31st burst request -> 429 Too Many Requests
    let lastStatus = 200;
    for (let i = 0; i < 31; i += 1) {
      const nextRes = await downloadPdf(
        new NextRequest('http://localhost:3000/api/pdfs/intelligence-officer-set-01/download?mode=json', {
          headers: { 'x-forwarded-for': '203.0.113.9' }
        }),
        { params: Promise.resolve({ id: 'intelligence-officer-set-01' }) }
      );
      lastStatus = nextRes.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('allows verified owner admins to upload, verify R2 object existence, bulk import CSV, and prune analytics logs', async () => {
    mockState.authenticated = true;
    mockState.isAdmin = true;

    mockState.r2ObjectExists = false;
    const missingObjRes = await createPdf(
      new NextRequest('http://localhost:3000/api/admin/pdfs', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'set-02-ppsc',
          title: 'Set 02 Booklet',
          subject: 'General Knowledge',
          examTag: 'PPSC',
          fileKey: 'pdfs/2026/11/set-02.pdf',
          fileSize: 102400,
          watermarkConfirmed: true
        })
      })
    );
    expect(missingObjRes.status).toBe(400);

    mockState.r2ObjectExists = true;
    mockState.r2ContentType = 'image/png';
    const badMimeRes = await createPdf(
      new NextRequest('http://localhost:3000/api/admin/pdfs', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'set-02-ppsc',
          title: 'Set 02 Booklet',
          subject: 'General Knowledge',
          examTag: 'PPSC',
          fileKey: 'pdfs/2026/11/set-02.pdf',
          fileSize: 102400,
          watermarkConfirmed: true
        })
      })
    );
    expect(badMimeRes.status).toBe(400);
    const badMimeBody = await badMimeRes.json();
    expect(badMimeBody.error.code).toBe('INVALID_FILE_TYPE');

    mockState.r2ContentType = 'application/pdf';
    const okPdfRes = await createPdf(
      new NextRequest('http://localhost:3000/api/admin/pdfs', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'set-02-ppsc',
          title: 'Set 02 Booklet',
          subject: 'General Knowledge',
          examTag: 'PPSC',
          fileKey: 'pdfs/2026/11/set-02.pdf',
          fileSize: 102400,
          watermarkConfirmed: true
        })
      })
    );
    expect(okPdfRes.status).toBe(201);

    const importRes = await importQuestions(
      new NextRequest('http://localhost:3000/api/admin/questions/import', {
        method: 'POST',
        body: JSON.stringify({
          quizId: mockState.quizRow.id,
          format: 'csv',
          csv: 'text_en,option_a,option_b,correct_option,explanation\n"Largest ocean?","Pacific","Atlantic",A,"Pacific Ocean."'
        })
      })
    );
    expect(importRes.status).toBe(201);
    const importBody = await importRes.json();
    expect(importBody.importedCount).toBe(1);

    const pruneRes = await pruneAnalytics(
      new NextRequest('http://localhost:3000/api/admin/analytics/prune', {
        method: 'POST',
        body: JSON.stringify({ visitRetentionDays: 90, pdfLogRetentionDays: 180 })
      })
    );
    expect(pruneRes.status).toBe(200);
    expect(mockState.rpcCalls).toEqual([
      {
        fn: 'prune_v3_analytics_logs',
        args: { visit_retention_days: 90, pdf_log_retention_days: 180 }
      }
    ]);
  });

  it('fails closed in middleware for unconfigured /api/admin while keeping public v2 routes responsive', async () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      const publicRes = await updateSupabaseSession(
        new NextRequest('http://localhost:3000/geography')
      );
      expect(publicRes.status).toBe(200);

      const adminApiRes = await updateSupabaseSession(
        new NextRequest('http://localhost:3000/api/admin/analytics/overview')
      );
      expect(adminApiRes.status).toBe(503);
    } finally {
      if (prevUrl !== undefined) {
        process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      }
    }
  });

  it('serves /api/pdfs metadata without leaking file_key, validates /api/analytics/visit, and gates /api/admin/analytics/overview', async () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevSecret = process.env.SUPABASE_SECRET_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_synthetic_test_value';

    try {
      // Public PDF catalog returns sanitized metadata (never exposing R2 object key)
      const pdfListRes = await listPdfs(
        new NextRequest('http://localhost:3000/api/pdfs?examTag=PPSC&sort=popular')
      );
      expect(pdfListRes.status).toBe(200);
      const pdfListBody = await pdfListRes.json();
      expect(pdfListBody.items).toHaveLength(1);
      expect(pdfListBody.items[0].requiresAuth).toBe(true);
      expect(pdfListBody.items[0].file_key).toBeUndefined();

      // Invalid visit path -> 400 validation error
      const invalidVisitRes = await recordVisit(
        new NextRequest('http://localhost:3000/api/analytics/visit', {
          method: 'POST',
          body: JSON.stringify({ path: 'geography-no-slash' })
        })
      );
      expect(invalidVisitRes.status).toBe(400);

      // Skipped /api/* path -> 202 { recorded: false }
      const skippedVisitRes = await recordVisit(
        new NextRequest('http://localhost:3000/api/analytics/visit', {
          method: 'POST',
          body: JSON.stringify({ path: '/api/health' })
        })
      );
      expect(skippedVisitRes.status).toBe(202);

      // Valid public visit -> 201 { recorded: true }
      const okVisitRes = await recordVisit(
        new NextRequest('http://localhost:3000/api/analytics/visit', {
          method: 'POST',
          body: JSON.stringify({ path: '/geography' })
        })
      );
      expect(okVisitRes.status).toBe(201);
      expect(mockState.siteVisitsInserted).toEqual([{ path: '/geography', user_id: null }]);

      // Admin analytics overview gating: 401 anon, 403 student, 200 owner admin
      const anonOverviewRes = await getAnalyticsOverview();
      expect(anonOverviewRes.status).toBe(401);

      mockState.authenticated = true;
      mockState.isAdmin = false;
      const studentOverviewRes = await getAnalyticsOverview();
      expect(studentOverviewRes.status).toBe(403);

      mockState.isAdmin = true;
      const adminOverviewRes = await getAnalyticsOverview();
      expect(adminOverviewRes.status).toBe(200);
      const overviewBody = await adminOverviewRes.json();
      expect(overviewBody.siteVisits).toEqual({
        today: 0,
        last7Days: 0,
        last30Days: 0,
        total: 0
      });
      expect(overviewBody.dailyVisitSeries).toHaveLength(30);
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      if (prevSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
      else process.env.SUPABASE_SECRET_KEY = prevSecret;
    }
  });
});
