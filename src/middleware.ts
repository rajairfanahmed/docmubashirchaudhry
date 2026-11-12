import type { NextRequest } from 'next/server';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.svg|icon\\.svg|robots\\.txt|sitemap\\.xml|llms\\.txt|images/|documents/|data/v1/).*)'
  ]
};

