import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { resolveRequestOrigin, sanitizeNextPath } from '@/lib/auth/guards';
import { createSupabaseServerClient, syncUserProfile } from '@/lib/supabase/server';
import { parsePublicSupabaseConfig } from '@/lib/env';

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email'
]);

function buildCallbackRedirectUrl(
  origin: string,
  nextPath: string,
  extraParams: Record<string, string>
): string {
  const url = new URL(nextPath, origin);
  for (const [key, value] of Object.entries(extraParams)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = resolveRequestOrigin(request);
  const searchParams = request.nextUrl.searchParams;
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const code = searchParams.get('code')?.trim();
  const tokenHash = searchParams.get('token_hash')?.trim();
  const otpType = searchParams.get('type')?.trim() as EmailOtpType | undefined;
  const flow = searchParams.get('flow')?.trim();
  const isRecoveryFlow = flow === 'recovery' || otpType === 'recovery';
  const successFlag: Record<string, string> = isRecoveryFlow
    ? { authReset: '1' }
    : { authConfirmed: '1' };
  const providerErrorCode = searchParams.get('error_code')?.trim();
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');

  if (!parsePublicSupabaseConfig()) {
    return NextResponse.redirect(
      buildCallbackRedirectUrl(origin, '/', { authError: 'backend_not_configured' }),
      {
        status: 302,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }

  if (providerError || providerErrorCode) {
    const normalized = `${providerErrorCode ?? ''} ${providerError ?? ''}`.toLowerCase();
    const friendlyError = normalized.includes('otp_expired')
      ? 'This email verification or reset link has expired. Request a new email below.'
      : normalized.includes('provider is not enabled') || normalized.includes('unsupported provider')
      ? 'google_provider_disabled'
      : 'Authentication cancelled or link expired. Please try again.';

    return NextResponse.redirect(
      buildCallbackRedirectUrl(origin, '/', {
        authError: friendlyError
      }),
      {
        status: 302,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }

  let failureMessage = 'Authentication link expired or invalid. Request a new email below.';

  try {
    const { supabase, applyAuthCookies } = await createSupabaseServerClient();

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        await syncUserProfile(data.user);
        return applyAuthCookies(
          NextResponse.redirect(
            buildCallbackRedirectUrl(origin, nextPath, successFlag),
            {
              status: 302,
              headers: { 'Cache-Control': 'no-store' }
            }
          )
        );
      }

      if (error?.message?.toLowerCase().includes('code verifier')) {
        failureMessage =
          'Confirmation link was opened in a different browser session. Try signing in with your email and password.';
      }
    } else if (tokenHash && otpType && ALLOWED_OTP_TYPES.has(otpType)) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: otpType,
        token_hash: tokenHash
      });
      if (!error && data.user) {
        await syncUserProfile(data.user);
        return applyAuthCookies(
          NextResponse.redirect(
            buildCallbackRedirectUrl(origin, nextPath, successFlag),
            {
              status: 302,
              headers: { 'Cache-Control': 'no-store' }
            }
          )
        );
      }
    }
  } catch (error) {
    console.error(
      '[v3-auth] callback error:',
      error instanceof Error ? error.message : 'Unexpected callback failure'
    );
  }

  return NextResponse.redirect(
    buildCallbackRedirectUrl(origin, '/', { authError: failureMessage }),
    {
      status: 302,
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}
