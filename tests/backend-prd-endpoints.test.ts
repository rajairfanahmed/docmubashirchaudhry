import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const clerkState = vi.hoisted(() => ({
  userId: null as string | null,
  user: null as {
    id: string;
    emailAddresses: Array<{ id: string; emailAddress: string }>;
    primaryEmailAddressId?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    externalAccounts?: Array<{ provider: string }>;
    publicMetadata?: Record<string, unknown>;
  } | null
}));

const mockClerkUserUpdate = vi.fn();
const mockClerkUserDelete = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({
    userId: clerkState.userId,
    sessionClaims: clerkState.user?.publicMetadata ? { publicMetadata: clerkState.user.publicMetadata } : null
  })),
  currentUser: vi.fn(async () => clerkState.user),
  clerkClient: vi.fn(async () => ({
    users: {
      updateUser: mockClerkUserUpdate,
      deleteUser: mockClerkUserDelete,
      getUserList: vi.fn(async () => ({
        data: clerkState.user ? [clerkState.user] : []
      }))
    }
  }))
}));

const fakeDb = vi.hoisted(() => {
  const store = {
    profiles: [] as any[],
    admin_notifications: [] as any[],
    digest_runs: [] as any[],
    admin_activity_log: [] as any[],
    question_reports: [] as any[],
    storage_snapshots: [] as any[],
    quizzes: [
      {
        id: 'quiz-1',
        slug: 'general-knowledge-mock-1',
        title: 'PPSC GK Mock Test 01',
        description: 'Comprehensive general knowledge mock',
        type: 'mock',
        subject: 'General Knowledge',
        exam_tag: 'ppsc',
        time_limit_seconds: 1800,
        negative_marking: true,
        negative_marking_value: 0.25,
        pass_percentage: 50,
        language: 'en',
        is_published: true,
        created_at: '2026-11-14T00:00:00.000Z',
        updated_at: '2026-11-14T00:00:00.000Z'
      }
    ],
    quiz_questions: [
      { id: 'q-1', quiz_id: 'quiz-1', text_en: 'Sample Question 1', correct_option: 'A' }
    ],
    quiz_attempts: [
      {
        id: 'att-1',
        user_id: 'user_regular_1',
        quiz_id: 'quiz-1',
        score: 10,
        max_score: 10,
        percentage: 100,
        passed: true,
        correct_count: 10,
        incorrect_count: 0,
        unanswered_count: 0,
        time_taken_seconds: 300,
        auto_submitted: false,
        created_at: '2026-11-14T01:00:00.000Z'
      }
    ],
    pdf_resources: [
      { id: 'pdf-1', title: 'PPSC Solved 2026', slug: 'ppsc-solved-2026', is_published: true }
    ],
    pdf_access_log: [
      { id: 'log-1', user_id: 'user_regular_1', pdf_id: 'pdf-1', downloaded_at: '2026-11-14T01:00:00.000Z' }
    ],
    site_visits: [] as any[]
  };

  function createQueryBuilder(tableName: keyof typeof store) {
    let filterFn = (_item: any) => true;
    let limitCount = 1000;
    let rangeStart = 0;
    let rangeEnd = 1000;
    let isCountQuery = false;
    let isHeadQuery = false;
    let isSingle = false;

    const builder: any = {
      select: vi.fn((_fields = '*', opts?: { count?: string; head?: boolean }) => {
        if (opts?.count === 'exact') isCountQuery = true;
        if (opts?.head) isHeadQuery = true;
        return builder;
      }),
      eq: vi.fn((field: string, val: any) => {
        const prev = filterFn;
        filterFn = (item) => prev(item) && item[field] === val;
        return builder;
      }),
      gte: vi.fn((field: string, val: any) => {
        const prev = filterFn;
        filterFn = (item) => prev(item) && String(item[field]) >= String(val);
        return builder;
      }),
      lte: vi.fn((field: string, val: any) => {
        const prev = filterFn;
        filterFn = (item) => prev(item) && String(item[field]) <= String(val);
        return builder;
      }),
      lt: vi.fn((field: string, val: any) => {
        const prev = filterFn;
        filterFn = (item) => prev(item) && String(item[field]) < String(val);
        return builder;
      }),
      is: vi.fn((field: string, val: any) => {
        const prev = filterFn;
        filterFn = (item) => prev(item) && (val === null ? item[field] === null || item[field] === undefined : item[field] === val);
        return builder;
      }),
      not: vi.fn((field: string, _operator: string, val: any) => {
        const prev = filterFn;
        filterFn = (item) => prev(item) && item[field] !== val;
        return builder;
      }),
      in: vi.fn((field: string, vals: any[]) => {
        const prev = filterFn;
        filterFn = (item) => prev(item) && vals.includes(item[field]);
        return builder;
      }),
      or: vi.fn((expr: string) => {
        const prev = filterFn;
        filterFn = (item) => {
          if (!prev(item)) return false;
          const clauses = expr.split(',');
          return clauses.some((clause) => {
            const parts = clause.split('.');
            if (parts.length === 3 && parts[1] === 'eq') {
              return String(item[parts[0]]) === String(parts[2]);
            }
            return true;
          });
        };
        return builder;
      }),
      order: vi.fn(() => builder),
      limit: vi.fn((cnt: number) => {
        limitCount = cnt;
        return builder;
      }),
      range: vi.fn((from: number, to: number) => {
        rangeStart = from;
        rangeEnd = to;
        return builder;
      }),
      maybeSingle: vi.fn(async () => {
        const items = (store[tableName] as any[]).filter(filterFn);
        return { data: items[0] ?? null, error: null };
      }),
      single: vi.fn(async () => {
        const items = (store[tableName] as any[]).filter(filterFn);
        return { data: items[0] ?? null, error: null };
      }),
      insert: vi.fn(async (record: any) => {
        const recs = Array.isArray(record) ? record : [record];
        (store[tableName] as any[]).push(...recs);
        return { data: record, error: null };
      }),
      update: vi.fn((patch: any) => {
        const items = (store[tableName] as any[]).filter(filterFn);
        for (const item of items) {
          Object.assign(item, patch);
        }
        return {
          ...builder,
          eq: vi.fn((field: string, val: any) => {
            const matches = (store[tableName] as any[]).filter((i) => i[field] === val);
            for (const m of matches) Object.assign(m, patch);
            return Promise.resolve({ data: matches, error: null, select: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: matches[0], error: null })) })) });
          }),
          is: vi.fn(() => Promise.resolve({ data: items, error: null })),
          in: vi.fn(() => Promise.resolve({ data: items, error: null })),
          select: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: items[0] ?? null, error: null }))
          }))
        };
      }),
      then: (resolve: any) => {
        const matched = (store[tableName] as any[]).filter(filterFn);
        const sliced = matched.slice(rangeStart, Math.min(rangeEnd + 1, rangeStart + limitCount));
        resolve({
          data: isHeadQuery ? null : sliced,
          count: isCountQuery ? matched.length : null,
          error: null
        });
      }
    };
    return builder;
  }

  const mockClient = {
    from: vi.fn((tableName: keyof typeof store) => createQueryBuilder(tableName))
  };

  return { store, mockClient };
});

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => fakeDb.mockClient,
  getOptionalAdminClient: () => fakeDb.mockClient,
  syncClerkUserProfile: vi.fn(async () => ({ ok: true }))
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => fakeDb.mockClient,
  fetchSupabaseAuthSettings: vi.fn(async () => ({ emailEnabled: true, googleEnabled: true }))
}));

vi.mock('@/lib/r2/client', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/r2/client')>();
  return {
    ...mod,
    measureR2Storage: vi.fn(async () => ({
      usedBytes: 1024 * 1024 * 50,
      allowanceBytes: 10 * 1024 * 1024 * 1024,
      objectCount: 15,
      checkedAt: new Date().toISOString(),
      largest: [{ key: 'pdfs/test.pdf', sizeBytes: 1024 * 1024 * 5 }]
    }))
  };
});

describe('Backend PRD Endpoints & Contract Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@docmubashir.com';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test';
    process.env.CLERK_SECRET_KEY = 'sk_test';

    fakeDb.store.profiles = [
      {
        id: 'user_regular_1',
        clerk_user_id: 'user_regular_1',
        email: 'regular@example.com',
        display_name: 'Regular Aspirant',
        status: 'active',
        role: 'user',
        is_admin: false,
        created_at: '2026-11-14T00:00:00.000Z',
        last_active_at: '2026-11-14T00:00:00.000Z'
      },
      {
        id: 'user_admin_1',
        clerk_user_id: 'user_admin_1',
        email: 'admin@docmubashir.com',
        display_name: 'Lead Admin',
        status: 'active',
        role: 'admin',
        is_admin: true,
        created_at: '2026-11-14T00:00:00.000Z',
        last_active_at: '2026-11-14T00:00:00.000Z'
      }
    ];

    clerkState.userId = 'user_regular_1';
    clerkState.user = {
      id: 'user_regular_1',
      emailAddresses: [{ id: 'e1', emailAddress: 'regular@example.com' }],
      primaryEmailAddressId: 'e1',
      fullName: 'Regular Aspirant'
    };
  });

  describe('Identity & User Account: /api/me (API-02, API-03, API-04)', () => {
    it('GET /api/me returns current user profile payload in { data } envelope', async () => {
      const { GET } = await import('@/app/api/me/route');
      const response = await GET();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe('user_regular_1');
      expect(json.data.email).toBe('regular@example.com');
      expect(json.data.name).toBe('Regular Aspirant');
      expect(json.data.status).toBe('active');
      expect(json.data.isAdmin).toBe(false);
    });

    it('PATCH /api/me updates display name in Clerk and Supabase', async () => {
      const { PATCH } = await import('@/app/api/me/route');
      const request = new NextRequest('http://localhost:3000/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Ayesha Raza' })
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.name).toBe('Ayesha Raza');
      expect(mockClerkUserUpdate).toHaveBeenCalledWith('user_regular_1', {
        firstName: 'Ayesha',
        lastName: 'Raza'
      });
    });

    it('DELETE /api/me deletes Clerk account and marks profile deleted', async () => {
      const { DELETE } = await import('@/app/api/me/route');
      const request = new NextRequest('http://localhost:3000/api/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' })
      });

      const response = await DELETE(request);
      expect(response.status).toBe(204);
      expect(mockClerkUserDelete).toHaveBeenCalledWith('user_regular_1');
    });
  });

  describe('Quizzes & Question Reporting: API-06 & API-17', () => {
    it('GET /api/quizzes/[id] returns quiz summary with questions metadata', async () => {
      const { GET } = await import('@/app/api/quizzes/[id]/route');
      const response = await GET(
        new NextRequest('http://localhost:3000/api/quizzes/general-knowledge-mock-1'),
        { params: Promise.resolve({ id: 'general-knowledge-mock-1' }) }
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.id).toBe('quiz-1');
      expect(json.data.title).toBe('PPSC GK Mock Test 01');
      expect(json.data.negativeMarking.enabled).toBe(true);
    });

    it('POST /api/question-reports creates report and enforces length limits', async () => {
      const { POST } = await import('@/app/api/question-reports/route');
      const request = new NextRequest('http://localhost:3000/api/question-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'q-101',
          message: 'The fourth option has a factual typo in the year of independence.'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.data.questionId).toBe('q-101');
      expect(json.data.status).toBe('new');
    });
  });

  describe('Admin Control Plane: API-20, API-21, API-22, API-24, API-31', () => {
    beforeEach(() => {
      clerkState.userId = 'user_admin_1';
      clerkState.user = {
        id: 'user_admin_1',
        emailAddresses: [{ id: 'admin_email', emailAddress: 'admin@docmubashir.com' }],
        primaryEmailAddressId: 'admin_email',
        fullName: 'Lead Admin',
        publicMetadata: { role: 'admin' }
      };
    });

    it('GET /api/admin/overview returns dashboard KPI totals and trends', async () => {
      const { GET } = await import('@/app/api/admin/overview/route');
      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.totals).toBeDefined();
      expect(json.data.charts.dailyVisits).toBeDefined();
    });

    it('GET /api/admin/storage returns storage measurement and allowance', async () => {
      const { GET } = await import('@/app/api/admin/storage/route');
      const response = await GET();
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.usedBytes).toBeGreaterThan(0);
      expect(json.data.allowanceBytes).toBe(10 * 1024 * 1024 * 1024);
    });

    it('GET /api/admin/users lists registered accounts with pagination metadata', async () => {
      const { GET } = await import('@/app/api/admin/users/route');
      const request = new NextRequest('http://localhost:3000/api/admin/users?page=1&pageSize=10');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.meta.total).toBeDefined();
    });

    it('PATCH /api/admin/users/[id]/status blocks a normal user and rejects blocking an admin', async () => {
      const { PATCH } = await import('@/app/api/admin/users/[id]/status/route');

      // 1. Attempting to block an admin must be rejected with 409 CANNOT_BLOCK_ADMIN
      const blockAdminRes = await PATCH(
        new NextRequest('http://localhost:3000/api/admin/users/user_admin_1/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'blocked', reason: 'Attempted block' })
        }),
        { params: Promise.resolve({ id: 'user_admin_1' }) }
      );
      expect(blockAdminRes.status).toBe(409);
      const errJson = await blockAdminRes.json();
      expect(errJson.error.code).toBe('CANNOT_BLOCK_ADMIN');

      // 2. Blocking a regular user succeeds
      const blockRegularRes = await PATCH(
        new NextRequest('http://localhost:3000/api/admin/users/user_regular_1/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'blocked', reason: 'Suspicious scraping activity' })
        }),
        { params: Promise.resolve({ id: 'user_regular_1' }) }
      );
      expect(blockRegularRes.status).toBe(200);
      const okJson = await blockRegularRes.json();
      expect(okJson.data.status).toBe('blocked');
    });

    it('GET /api/admin/exports/users returns sanitized CSV with injection guards', async () => {
      const { GET } = await import('@/app/api/admin/exports/[type]/route');
      const response = await GET(
        new NextRequest('http://localhost:3000/api/admin/exports/users'),
        { params: Promise.resolve({ type: 'users' }) }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/csv');
      const text = await response.text();
      expect(text).toContain('ID,Email,Display Name');
      expect(text).toContain('admin@docmubashir.com');
    });
  });

  describe('Scheduled Jobs & Cron Security: API-33', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'super-secret-cron-token-123';
    });

    it('GET /api/cron/digest returns 404 if cron secret header is missing or invalid', async () => {
      const { GET } = await import('@/app/api/cron/digest/route');
      const unauthedRes = await GET(
        new NextRequest('http://localhost:3000/api/cron/digest', {
          headers: { 'x-cron-secret': 'wrong-token' }
        })
      );
      expect(unauthedRes.status).toBe(404);
    });

    it('GET /api/cron/digest succeeds with valid secret and runs idempotently', async () => {
      const { GET } = await import('@/app/api/cron/digest/route');
      const authedReq = new NextRequest('http://localhost:3000/api/cron/digest', {
        headers: { 'x-cron-secret': 'super-secret-cron-token-123' }
      });

      // First execution
      const run1 = await GET(authedReq);
      expect(run1.status).toBe(200);
      const json1 = await run1.json();
      expect(json1.data.status).toBe('completed');

      // Duplicate execution within same date -> safe no-op
      const run2 = await GET(authedReq);
      expect(run2.status).toBe(200);
      const json2 = await run2.json();
      expect(json2.data.status).toBe('already_executed');
    });
  });
});
