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
  user: null as {
    id: string;
    emailAddresses: Array<{ id: string; emailAddress: string }>;
    primaryEmailAddressId: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    externalAccounts?: Array<{ provider: string }>;
  } | null,
  backendUsers: [] as Array<{
    id: string;
    emailAddresses: Array<{ id: string; emailAddress: string }>;
    primaryEmailAddressId?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    externalAccounts?: Array<{ provider: string }>;
    password?: string;
  }>
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: clerkMockState.userId })),
  currentUser: vi.fn(async () => clerkMockState.user),
  clerkMiddleware: vi.fn(() => vi.fn()),
  clerkClient: vi.fn(async () => ({
    users: {
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
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
    process.env.ADMIN_EMAILS = 'docmubashir@example.com,owner@domain.com';
    clerkMockState.userId = null;
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
});
