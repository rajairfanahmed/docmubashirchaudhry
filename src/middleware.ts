import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
import { resolveRequestOrigin } from '@/lib/auth/guards';

function isAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  );
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  if (isAdminPath(pathname)) {
    const { userId } = await auth();
    if (!userId) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { error: 'Authentication required.' },
          { status: 401, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      const loginRedirect = new URL('/', resolveRequestOrigin(request));
      loginRedirect.searchParams.set('auth', 'required');
      loginRedirect.searchParams.set('next', pathname);
      return NextResponse.redirect(loginRedirect);
    }
  }

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
