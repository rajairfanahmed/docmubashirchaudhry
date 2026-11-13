import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  parseClerkConfig,
  requireClerkConfig,
  getV3RuntimeReadiness,
  BackendConfigError
} from '@/lib/env';

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
  } | null
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: clerkMockState.userId })),
  currentUser: vi.fn(async () => clerkMockState.user),
  clerkMiddleware: vi.fn(() => vi.fn())
}));

describe('Clerk Authentication Configuration & Server Guards', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
    process.env.ADMIN_EMAILS = 'docmubashir@example.com,owner@domain.com';
    clerkMockState.userId = null;
    clerkMockState.user = null;
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
});

