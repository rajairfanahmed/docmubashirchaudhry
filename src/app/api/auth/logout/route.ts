import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parsePublicSupabaseConfig } from '@/lib/env';
import { handleRouteError } from '@/lib/v3/http';

export async function POST(): Promise<NextResponse> {
  if (!parsePublicSupabaseConfig()) {
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const { supabase, applyAuthCookies } = await createSupabaseServerClient();
    await supabase.auth.signOut();

    return applyAuthCookies(
      NextResponse.json(
        { ok: true },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'POST /api/auth/logout');
  }
}

