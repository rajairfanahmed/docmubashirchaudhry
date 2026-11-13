import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { resolveRequestOrigin } from '@/lib/auth/guards';
import { isAdminEmail } from '@/lib/env';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  // 1. API Admin Protection
  if (isAdminApiRoute(request)) {
    const { sessionClaims, userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    const claimsEmail =
      (sessionClaims as Record<string, unknown> | undefined)?.email ??
      (sessionClaims as Record<string, unknown> | undefined)?.primary_email_address ??
      (sessionClaims as Record<string, unknown> | undefined)?.email_address;
    const isEmailAdmin = typeof claimsEmail === 'string' && isAdminEmail(claimsEmail);

    if (role === 'user' && !isEmailAdmin) {
      return NextResponse.json(
        { error: 'Not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  // 2. UI Admin Route Protection
  if (isAdminRoute(request)) {
    const { sessionClaims, userId } = await auth();
    if (!userId) {
      const loginRedirect = new URL('/', resolveRequestOrigin(request));
      loginRedirect.searchParams.set('auth', 'required');
      loginRedirect.searchParams.set('next', pathname);
      return NextResponse.redirect(loginRedirect);
    }

    const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    const claimsEmail =
      (sessionClaims as Record<string, unknown> | undefined)?.email ??
      (sessionClaims as Record<string, unknown> | undefined)?.primary_email_address ??
      (sessionClaims as Record<string, unknown> | undefined)?.email_address;
    const isEmailAdmin = typeof claimsEmail === 'string' && isAdminEmail(claimsEmail);

    if (role === 'user' && !isEmailAdmin) {
      // Stealth 404 rewrite: non-admins never receive confirmation that an admin console exists
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  // 3. Strip client-supplied internal spoofing headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-dmc-user-id');
  requestHeaders.delete('x-dmc-is-admin');

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.svg|icon\\.svg|robots\\.txt|sitemap\\.xml|llms\\.txt|images/|documents/|data/v1/).*)'
  ]
};
