import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  parseClerkConfig,
  requireClerkConfig,
  getV3RuntimeReadiness,
  BackendConfigError
} from '@/lib/env';
import { clearRateLimitBuckets } from '@/lib/v3/rate-limit';

const clerkMockState = vi.hoisted(() => ({
  userId: null as string | null,
  sessionClaims: null as { publicMetadata?: Record<string, unknown> } | null,
  user: null as {
    id: string;
    emailAddresses: Array<{ id: string; emailAddress: string }>;
    primaryEmailAddressId?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    externalAccounts?: Array<{ provider: string }>;
    publicMetadata?: Record<string, unknown>;
  } | null,
  backendUsers: [] as Array<{
    id: string;
    emailAddresses: Array<{ id: string; emailAddress: string }>;
    primaryEmailAddressId?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    externalAccounts?: Array<{ provider: string }>;
    publicMetadata?: Record<string, unknown>;
    password?: string;
  }>
}));

const mockRedirect = vi.fn();
const mockNotFound = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound()
}));

const mockSyncClerkUserProfile = vi.fn((_args?: any) => Promise.resolve({ ok: true }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
  getOptionalAdminClient: vi.fn(),
  syncClerkUserProfile: (args: unknown) => mockSyncClerkUserProfile(args)
}));

vi.mock('svix', () => {
  class MockWebhook {
    constructor(public secret: string) {}
    verify(payload: string, headers: Record<string, string>) {
      if (headers['svix-signature'] === 'invalid_signature') {
        throw new Error('Invalid signature');
      }
      return JSON.parse(payload);
    }
  }
  return { Webhook: MockWebhook };
});

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({
    userId: clerkMockState.userId,
    sessionClaims: clerkMockState.sessionClaims
  })),
  currentUser: vi.fn(async () => clerkMockState.user),
  clerkMiddleware: vi.fn(() => vi.fn()),
  createRouteMatcher: vi.fn(() => vi.fn(() => false)),
  clerkClient: vi.fn(async () => ({
    users: {
      updateUserMetadata: vi.fn(async (userId: string, { publicMetadata }: { publicMetadata?: Record<string, unknown> }) => {
        const found = clerkMockState.backendUsers.find((u) => u.id === userId);
        if (found) {
          found.publicMetadata = { ...found.publicMetadata, ...publicMetadata };
        }
        return { id: userId, publicMetadata };
      }),
      getUserList: vi.fn(async ({ emailAddress }: { emailAddress?: string[] }) => {
        const email = emailAddress?.[0]?.toLowerCase();
        const matches = clerkMockState.backendUsers.filter((u) =>
          u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email)
        );
        return { data: matches, totalCount: matches.length };
      }),
      verifyPassword: vi.fn(async ({ userId, password }: { userId: string; password: string }) => {
        const found = clerkMockState.backendUsers.find((u) => u.id === userId);
        if (found && found.password === password) {
          return { verified: true };
        }
        return { verified: false };
      }),
      createUser: vi.fn(async ({ emailAddress, password, firstName }: { emailAddress: string[]; password?: string; firstName?: string }) => {
        const email = emailAddress[0].toLowerCase();
        const exists = clerkMockState.backendUsers.some((u) =>
          u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email)
        );
        if (exists) {
          const err = new Error('User already exists');
          (err as unknown as { status: number; errors: Array<{ code: string; message: string }> }).status = 422;
          (err as unknown as { status: number; errors: Array<{ code: string; message: string }> }).errors = [
            { code: 'form_identifier_exists', message: 'That email address is taken.' }
          ];
          throw err;
        }

        const newUser = {
          id: `user_${Date.now()}`,
          emailAddresses: [{ id: `email_${Date.now()}`, emailAddress: email }],
          primaryEmailAddressId: `email_${Date.now()}`,
          fullName: firstName ?? 'Student User',
          firstName: firstName ?? 'Student',
          password
        };
        clerkMockState.backendUsers.push(newUser);
        return newUser;
      })
    }
  }))
}));

describe('Clerk Authentication Configuration & Server Guards', () => {
  beforeEach(() => {
    clearRateLimitBuckets();
    mockRedirect.mockClear();
    mockNotFound.mockClear();
    mockSyncClerkUserProfile.mockClear();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.CLERK_WEBHOOK_SECRET;
    process.env.ADMIN_EMAILS = 'docmubashir@example.com,owner@domain.com';
    clerkMockState.userId = null;
    clerkMockState.sessionClaims = null;
    clerkMockState.user = null;
    clerkMockState.backendUsers = [
      {
        id: 'user_existing_123',
        emailAddresses: [{ id: 'em_1', emailAddress: 'student@example.com' }],
        primaryEmailAddressId: 'em_1',
        fullName: 'Muhammad Ali',
        password: 'ValidPassword123!'
      }
    ];
  });

  it('correctly parses Clerk environment keys and validates required status', () => {
    expect(parseClerkConfig({})).toBeNull();
    expect(() => requireClerkConfig({})).toThrow(BackendConfigError);

    const validEnv = {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_1234567890abcdef',
      CLERK_SECRET_KEY: 'sk_test_secret_key_123'
    };

    const config = parseClerkConfig(validEnv);
    expect(config).toEqual({
      publishableKey: 'pk_test_1234567890abcdef',
      secretKey: 'sk_test_secret_key_123'
    });

    const readiness = getV3RuntimeReadiness(validEnv);
    expect(readiness.clerkConfigured).toBe(true);
  });

  it('getOptionalSessionUser returns anonymous state when unauthenticated and profile state when signed in', async () => {
    const { getOptionalSessionUser } = await import('@/lib/auth/guards');

    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk';

    // Anonymous session
    clerkMockState.userId = null;
    clerkMockState.user = null;
    const anon = await getOptionalSessionUser();
    expect(anon?.user).toBeNull();
    expect(anon?.isAdmin).toBe(false);

    // Authenticated regular student
    clerkMockState.userId = 'user_student_123';
    clerkMockState.user = {
      id: 'user_student_123',
      emailAddresses: [{ id: 'email_1', emailAddress: 'student@example.com' }],
      primaryEmailAddressId: 'email_1',
      fullName: 'Muhammad Ali'
    };

    const authed = await getOptionalSessionUser();
    expect(authed?.user?.id).toBe('user_student_123');
    expect(authed?.email).toBe('student@example.com');
    expect(authed?.displayName).toBe('Muhammad Ali');
    expect(authed?.authProvider).toBe('email');
    expect(authed?.isAdmin).toBe(false);

    // Authenticated admin user
    clerkMockState.userId = 'user_admin_999';
    clerkMockState.user = {
      id: 'user_admin_999',
      emailAddresses: [{ id: 'email_2', emailAddress: 'DocMubashir@example.com' }],
      primaryEmailAddressId: 'email_2',
      firstName: 'Doc',
      lastName: 'Mubashir'
    };

    const admin = await getOptionalSessionUser();
    expect(admin?.user?.id).toBe('user_admin_999');
    expect(admin?.email).toBe('docmubashir@example.com');
    expect(admin?.displayName).toBe('Doc Mubashir');
    expect(admin?.isAdmin).toBe(true);
  });

  it('requireAuthenticatedUser and requireAdminUser enforce authentication and authorization strictly', async () => {
    const { requireAuthenticatedUser, requireAdminUser, ApiError } = await import('@/lib/auth/guards');

    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk';

    // Unauthenticated -> 401 UNAUTHORIZED
    clerkMockState.userId = null;
    clerkMockState.user = null;

    await expect(requireAuthenticatedUser()).rejects.toThrow(ApiError);
    await expect(requireAuthenticatedUser()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED'
    });

    // Authenticated student -> passes requireAuthenticatedUser, but fails requireAdminUser with 403
    clerkMockState.userId = 'user_student_123';
    clerkMockState.user = {
      id: 'user_student_123',
      emailAddresses: [{ id: 'email_1', emailAddress: 'student@example.com' }],
      primaryEmailAddressId: 'email_1',
      fullName: 'Student User'
    };

    const studentContext = await requireAuthenticatedUser();
    expect(studentContext.user.id).toBe('user_student_123');
    expect(studentContext.email).toBe('student@example.com');
    expect(studentContext.isAdmin).toBe(false);

    await expect(requireAdminUser()).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN'
    });

    // Authenticated admin -> passes requireAdminUser
    clerkMockState.userId = 'user_admin_999';
    clerkMockState.user = {
      id: 'user_admin_999',
      emailAddresses: [{ id: 'email_2', emailAddress: 'owner@domain.com' }],
      primaryEmailAddressId: 'email_2',
      fullName: 'Portal Owner'
    };

    const adminContext = await requireAdminUser();
    expect(adminContext.user.id).toBe('user_admin_999');
    expect(adminContext.email).toBe('owner@domain.com');
    expect(adminContext.isAdmin).toBe(true);
  });

  it('handles backend /api/auth/login and /api/auth/signup flows with Clerk', async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk';
    process.env.CLERK_SECRET_KEY = 'sk_test_secret';

    const { POST: login } = await import('@/app/api/auth/login/route');
    const { POST: signup } = await import('@/app/api/auth/signup/route');
    const { POST: forgot } = await import('@/app/api/auth/forgot-password/route');
    const { POST: resend } = await import('@/app/api/auth/resend/route');

    // Test 1: Valid Login
    const validLoginRes = await login(
      new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          password: 'ValidPassword123!'
        })
      })
    );
    expect(validLoginRes.status).toBe(200);
    const loginData = await validLoginRes.json();
    expect(loginData.ok).toBe(true);
    expect(loginData.user.id).toBe('user_existing_123');
    expect(loginData.user.email).toBe('student@example.com');

    // Test 2: Invalid Login Password
    const badPassRes = await login(
      new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          password: 'WrongPassword999!'
        })
      })
    );
    expect(badPassRes.status).toBe(401);
    const badPassData = await badPassRes.json();
    expect(badPassData.error.code).toBe('INVALID_CREDENTIALS');

    // Test 3: Duplicate Signup returns 409
    const dupSignupRes = await signup(
      new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          password: 'ValidPassword123!'
        })
      })
    );
    expect(dupSignupRes.status).toBe(409);
    const dupSignupData = await dupSignupRes.json();
    expect(dupSignupData.error.code).toBe('ACCOUNT_ALREADY_EXISTS');

    // Test 4: New User Signup succeeds
    const newSignupRes = await signup(
      new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newstudent@example.com',
          password: 'NewPassword123!',
          displayName: 'New Student'
        })
      })
    );
    expect(newSignupRes.status).toBe(200);
    const newSignupData = await newSignupRes.json();
    expect(newSignupData.ok).toBe(true);
    expect(newSignupData.user.email).toBe('newstudent@example.com');

    // Test 5: Forgot password and resend
    const forgotRes = await forgot(
      new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'newstudent@example.com' })
      })
    );
    expect(forgotRes.status).toBe(200);

    const resendRes = await resend(
      new NextRequest('http://localhost:3000/api/auth/resend', {
        method: 'POST',
        body: JSON.stringify({ email: 'newstudent@example.com' })
      })
    );
    expect(resendRes.status).toBe(200);
  });

  it('getRole resolves role via session token claims and falls back to allow-list', async () => {
    const { getRole } = await import('@/lib/auth/get-role');

    // 1. Unauthenticated -> returns 'user'
    clerkMockState.userId = null;
    expect(await getRole()).toBe('user');

    // 2. Token claims explicit admin
    clerkMockState.userId = 'user_admin_claim';
    clerkMockState.sessionClaims = { publicMetadata: { role: 'admin' } };
    expect(await getRole()).toBe('admin');

    // 3. Token claims regular user, not on allow-list
    clerkMockState.userId = 'user_student';
    clerkMockState.sessionClaims = { publicMetadata: { role: 'user' } };
    clerkMockState.user = {
      id: 'user_student',
      emailAddresses: [{ id: 'e1', emailAddress: 'student@example.com' }],
      primaryEmailAddressId: 'e1'
    };
    expect(await getRole()).toBe('user');

    // 4. Fallback check: token claim missing role, but email is in ADMIN_EMAILS
    clerkMockState.userId = 'user_owner';
    clerkMockState.sessionClaims = {};
    clerkMockState.user = {
      id: 'user_owner',
      emailAddresses: [{ id: 'e2', emailAddress: 'owner@domain.com' }],
      primaryEmailAddressId: 'e2'
    };
    expect(await getRole()).toBe('admin');
  });

  it('PostAuthPage routes admins to /admin and normal users to destination next path', async () => {
    const PostAuthPage = (await import('@/app/post-auth/page')).default;

    // Admin user scenario
    clerkMockState.userId = 'user_admin_post';
    clerkMockState.sessionClaims = { publicMetadata: { role: 'admin' } };
    await PostAuthPage({ searchParams: Promise.resolve({ next: '/library' }) });
    expect(mockRedirect).toHaveBeenCalledWith('/admin');

    mockRedirect.mockClear();

    // Regular student scenario with next target
    clerkMockState.userId = 'user_student_post';
    clerkMockState.sessionClaims = { publicMetadata: { role: 'user' } };
    clerkMockState.user = {
      id: 'user_student_post',
      emailAddresses: [{ id: 'e3', emailAddress: 'student@example.com' }]
    };
    await PostAuthPage({ searchParams: Promise.resolve({ next: '/account/attempts' }) });
    expect(mockRedirect).toHaveBeenCalledWith('/account/attempts');

    mockRedirect.mockClear();

    // Regular student with external phishing URL falls back safely to '/'
    await PostAuthPage({ searchParams: Promise.resolve({ next: 'https://evil.example.com' }) });
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('handles Clerk webhook signatures, role assignments, and profile synchronization', async () => {
    const { POST: clerkWebhook } = await import('@/app/api/webhooks/clerk/route');

    // 1. Missing webhook secret -> 500
    delete process.env.CLERK_WEBHOOK_SECRET;
    const noSecretRes = await clerkWebhook(
      new Request('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_sig'
        },
        body: JSON.stringify({ type: 'user.created', data: {} })
      })
    );
    expect(noSecretRes.status).toBe(500);

    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_secret_123';

    // 2. Missing svix headers -> 400
    const missingHeadersRes = await clerkWebhook(
      new Request('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({ type: 'user.created', data: {} })
      })
    );
    expect(missingHeadersRes.status).toBe(400);

    // 3. Invalid signature -> 400
    const invalidSigRes = await clerkWebhook(
      new Request('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'invalid_signature'
        },
        body: JSON.stringify({ type: 'user.created', data: {} })
      })
    );
    expect(invalidSigRes.status).toBe(400);

    // 4. Valid signature on user.created with owner email -> role admin & sync
    clerkMockState.backendUsers = [{
      id: 'user_created_owner',
      emailAddresses: [{ id: 'em_wh1', emailAddress: 'owner@domain.com' }]
    }];

    const validOwnerRes = await clerkWebhook(
      new Request('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_sig'
        },
        body: JSON.stringify({
          type: 'user.created',
          data: {
            id: 'user_created_owner',
            email_addresses: [{ id: 'em_wh1', email_address: 'owner@domain.com' }],
            primary_email_address_id: 'em_wh1',
            first_name: 'Portal',
            last_name: 'Owner'
          }
        })
      })
    );
    expect(validOwnerRes.status).toBe(200);
    expect(mockSyncClerkUserProfile).toHaveBeenCalledWith({
      clerkUserId: 'user_created_owner',
      email: 'owner@domain.com',
      displayName: 'Portal Owner',
      role: 'admin'
    });
  });
});
