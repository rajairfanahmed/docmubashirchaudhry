import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { clearRateLimitBuckets } from '@/lib/v3/rate-limit';

const authMockState = vi.hoisted(() => ({
  signUpResult: {
    data: {
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'student@example.com',
        identities: [{ id: 'ident-1' }]
      },
      session: null
    },
    error: null as { message?: string; code?: string; status?: number } | null
  },
  signInResult: {
    data: {
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'student@example.com',
        app_metadata: { provider: 'email' }
      },
      session: { access_token: 'tok' }
    } as { user: Record<string, unknown> | null; session: Record<string, unknown> | null },
    error: null as { message?: string; code?: string; status?: number } | null
  },
  resendResult: { error: null as { message?: string; code?: string; status?: number } | null },
  resetPasswordResult: { error: null as { message?: string; code?: string; status?: number } | null },
  updateUserResult: { error: null as { message?: string; code?: string; status?: number } | null },
  exchangeCodeResult: {
    data: {
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'student@example.com'
      }
    } as { user: Record<string, unknown> | null },
    error: null as { message?: string; code?: string; status?: number } | null
  },
  authSettings: {
    emailEnabled: true,
    googleEnabled: false,
    mailerAutoconfirm: false,
    signupDisabled: false
  }
}));

vi.mock('@/lib/supabase/server', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/server')>(
    '@/lib/supabase/server'
  );

  const supabaseStub = {
    auth: {
      signUp: vi.fn(async () => authMockState.signUpResult),
      signInWithPassword: vi.fn(async () => authMockState.signInResult),
      resend: vi.fn(async () => authMockState.resendResult),
      resetPasswordForEmail: vi.fn(async () => authMockState.resetPasswordResult),
      updateUser: vi.fn(async () => authMockState.updateUserResult),
      exchangeCodeForSession: vi.fn(async () => authMockState.exchangeCodeResult),
      signInWithOAuth: vi.fn(async () => ({
        data: { url: 'https://demo.supabase.co/auth/v1/authorize?provider=google' },
        error: null
      }))
    }
  };

  return {
    ...actual,
    createSupabaseServerClient: vi.fn(async () => ({
      supabase: supabaseStub,
      applyAuthCookies: <T extends NextResponse>(res: T) => res
    })),
    syncUserProfile: vi.fn(async () => ({
      id: '11111111-1111-4111-8111-111111111111',
      email: 'student@example.com',
      display_name: 'Student',
      auth_provider: 'email',
      is_admin: false,
      last_active_at: '2026-11-12T00:00:00Z'
    })),
    fetchSupabaseAuthSettings: vi.fn(async () => authMockState.authSettings)
  };
});

vi.mock('@/lib/auth/guards', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/guards')>('@/lib/auth/guards');
  return {
    ...actual,
    getOptionalSessionUser: vi.fn(async () => ({
      user: null,
      email: null,
      displayName: null,
      authProvider: null,
      isAdmin: false,
      applyAuthCookies: <T extends NextResponse>(res: T) => res
    })),
    requireAuthenticatedUser: vi.fn(async () => ({
      supabase: {
        auth: {
          updateUser: vi.fn(async () => authMockState.updateUserResult)
        }
      } as never,
      applyAuthCookies: <T extends NextResponse>(res: T) => res,
      user: { id: '11111111-1111-4111-8111-111111111111', email: 'student@example.com' } as never,
      email: 'student@example.com',
      isAdmin: false,
      profile: null
    }))
  };
});

describe('Complete Authentication System Backend Flows', () => {
  beforeEach(() => {
    clearRateLimitBuckets();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_demo_key';
    authMockState.authSettings = {
      emailEnabled: true,
      googleEnabled: false,
      mailerAutoconfirm: false,
      signupDisabled: false
    };
    authMockState.signUpResult = {
      data: {
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'student@example.com',
          identities: [{ id: 'ident-1' }]
        },
        session: null
      },
      error: null
    };
    authMockState.signInResult = {
      data: {
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'student@example.com',
          app_metadata: { provider: 'email' }
        },
        session: { access_token: 'tok' }
      },
      error: null
    };
    authMockState.resendResult = { error: null };
    authMockState.resetPasswordResult = { error: null };
    authMockState.updateUserResult = { error: null };
    authMockState.exchangeCodeResult = {
      data: {
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'student@example.com'
        }
      },
      error: null
    };
  });

  it('returns 409 ACCOUNT_ALREADY_EXISTS when Supabase returns empty identities array or duplicate user error on signup', async () => {
    const { POST: signup } = await import('@/app/api/auth/signup/route');

    // Case 1: Supabase obfuscation (error=null, identities=[])
    authMockState.signUpResult = {
      data: {
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'existing@example.com',
          identities: []
        },
        session: null
      },
      error: null
    };

    const dupIdentityRes = await signup(
      new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'Password123!'
        })
      })
    );
    expect(dupIdentityRes.status).toBe(409);
    const dupIdentityBody = await dupIdentityRes.json();
    expect(dupIdentityBody.error.code).toBe('ACCOUNT_ALREADY_EXISTS');
    expect(dupIdentityBody.error.message).toContain('already created');

    // Case 2: Explicit Supabase duplicate error
    authMockState.signUpResult = {
      data: { user: null as never, session: null },
      error: { message: 'User already registered', status: 400 }
    };

    const dupErrRes = await signup(
      new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'Password123!'
        })
      })
    );
    expect(dupErrRes.status).toBe(409);
    const dupErrBody = await dupErrRes.json();
    expect(dupErrBody.error.code).toBe('ACCOUNT_ALREADY_EXISTS');
  });

  it('maps unconfirmed email login errors cleanly to 403 EMAIL_NOT_CONFIRMED and invalid credentials to 401', async () => {
    const { POST: login } = await import('@/app/api/auth/login/route');

    authMockState.signInResult = {
      data: { user: null, session: null },
      error: { message: 'Email not confirmed', code: 'email_not_confirmed', status: 400 }
    };

    const unconfirmedRes = await login(
      new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          password: 'Password123!'
        })
      })
    );
    expect(unconfirmedRes.status).toBe(403);
    const unconfirmedBody = await unconfirmedRes.json();
    expect(unconfirmedBody.error.code).toBe('EMAIL_NOT_CONFIRMED');

    authMockState.signInResult = {
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 }
    };

    const badPassRes = await login(
      new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          password: 'WrongPassword!'
        })
      })
    );
    expect(badPassRes.status).toBe(401);
    const badPassBody = await badPassRes.json();
    expect(badPassBody.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('intercepts disabled Google OAuth provider cleanly and exposes provider status in GET /api/auth/session', async () => {
    const { GET: oauth } = await import('@/app/api/auth/oauth/route');
    const { GET: getSession } = await import('@/app/api/auth/session/route');

    const sessionRes = await getSession();
    expect(sessionRes.status).toBe(200);
    const sessionBody = await sessionRes.json();
    expect(sessionBody.providers).toEqual({ email: true, google: false });

    const oauthRes = await oauth(
      new NextRequest('https://docmubashirchaudhry.vercel.app/api/auth/oauth?provider=google&next=/quizzes')
    );
    expect(oauthRes.status).toBe(302);
    const location = new URL(oauthRes.headers.get('location') ?? '');
    expect(location.pathname).toBe('/quizzes');
    expect(location.searchParams.get('auth')).toBe('required');
    expect(location.searchParams.get('authError')).toBe('google_provider_disabled');
  });

  it('supports resend verification, forgot password, recovery callback, and update password flows', async () => {
    const { POST: resend } = await import('@/app/api/auth/resend/route');
    const { POST: forgot } = await import('@/app/api/auth/forgot-password/route');
    const { POST: updatePassword } = await import('@/app/api/auth/update-password/route');
    const { GET: callback } = await import('@/app/api/auth/callback/route');

    const resendRes = await resend(
      new NextRequest('http://localhost:3000/api/auth/resend', {
        method: 'POST',
        body: JSON.stringify({ email: 'student@example.com', next: '/quizzes' })
      })
    );
    expect(resendRes.status).toBe(200);
    expect((await resendRes.json()).ok).toBe(true);

    const forgotRes = await forgot(
      new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'student@example.com', next: '/' })
      })
    );
    expect(forgotRes.status).toBe(200);
    expect((await forgotRes.json()).ok).toBe(true);

    const callbackRes = await callback(
      new NextRequest(
        'https://docmubashirchaudhry.vercel.app/api/auth/callback?code=rec-123&next=%2F&flow=recovery'
      )
    );
    expect(callbackRes.status).toBe(302);
    const callbackLocation = new URL(callbackRes.headers.get('location') ?? '');
    expect(callbackLocation.searchParams.get('authReset')).toBe('1');
    expect(callbackLocation.searchParams.get('authConfirmed')).toBeNull();

    const updateRes = await updatePassword(
      new NextRequest('http://localhost:3000/api/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ password: 'NewStrongPassword123' })
      })
    );
    expect(updateRes.status).toBe(200);
    expect((await updateRes.json()).ok).toBe(true);
  });
});

