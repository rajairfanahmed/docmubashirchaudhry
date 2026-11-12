import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminEmail, parsePublicSupabaseConfig } from '@/lib/env';
import { buildSecureAuthCookieOptions } from './server';

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') || cookie.name.includes('auth-token'));
}

function isAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  );
}

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  const requestHeaders = new Headers(request.headers);
  // Strip any client-supplied internal headers to avoid spoofing downstream
  requestHeaders.delete('x-dmc-user-id');
  requestHeaders.delete('x-dmc-is-admin');

  let response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  const pathname = request.nextUrl.pathname;
  const adminRouteRequested = isAdminPath(pathname);
  const publicConfig = parsePublicSupabaseConfig();

  if (!publicConfig) {
    if (adminRouteRequested) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Admin access unavailable: backend authentication is not configured.' },
          { status: 503, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Performance safeguard: skip external auth round-trip on anonymous public page hits
  const shouldInspectSession =
    adminRouteRequested ||
    pathname.startsWith('/api/me') ||
    pathname.startsWith('/api/pdfs/') ||
    pathname.startsWith('/api/quizzes/') ||
    hasSupabaseAuthCookie(request);

  if (!shouldInspectSession) {
    return response;
  }

  const supabase = createServerClient(publicConfig.url, publicConfig.publishableKey, {
    cookieOptions: buildSecureAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({
          request: {
            headers: requestHeaders
          }
        });
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, buildSecureAuthCookieOptions(options));
        }
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (adminRouteRequested) {
    if (!user) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Authentication required.' },
          { status: 401, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      const loginRedirect = new URL('/', request.url);
      loginRedirect.searchParams.set('auth', 'required');
      loginRedirect.searchParams.set('next', pathname);
      return NextResponse.redirect(loginRedirect);
    }

    if (!isAdminEmail(user.email)) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Forbidden: administrator access restricted to owner allow-list.' },
          { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

