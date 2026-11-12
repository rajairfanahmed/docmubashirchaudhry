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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = resolveRequestOrigin(request);
  const searchParams = request.nextUrl.searchParams;
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const otpType = searchParams.get('type') as EmailOtpType | null;
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');

  if (!parsePublicSupabaseConfig()) {
    return NextResponse.redirect(`${origin}/?authError=backend_not_configured`, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' }
    });
  }

  if (providerError) {
    return NextResponse.redirect(
      `${origin}/?authError=${encodeURIComponent('Authentication cancelled or failed.')}`,
      {
        status: 302,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }

  try {
    const { supabase, applyAuthCookies } = await createSupabaseServerClient();

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        await syncUserProfile(data.user);
        return applyAuthCookies(
          NextResponse.redirect(`${origin}${nextPath}`, {
            status: 302,
            headers: { 'Cache-Control': 'no-store' }
          })
        );
      }
    } else if (tokenHash && otpType && ALLOWED_OTP_TYPES.has(otpType)) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: otpType,
        token_hash: tokenHash
      });
      if (!error && data.user) {
        await syncUserProfile(data.user);
        return applyAuthCookies(
          NextResponse.redirect(`${origin}${nextPath}`, {
            status: 302,
            headers: { 'Cache-Control': 'no-store' }
          })
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
    `${origin}/?authError=${encodeURIComponent('Authentication link expired or invalid.')}`,
    {
      status: 302,
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}

