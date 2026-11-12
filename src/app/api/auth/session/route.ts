import { NextResponse } from 'next/server';
import { getOptionalSessionUser } from '@/lib/auth/guards';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getOptionalSessionUser();
    if (!session) {
      return NextResponse.json(
        {
          configured: false,
          authenticated: false,
          user: null
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      );
    }

    const response = NextResponse.json(
      {
        configured: true,
        authenticated: Boolean(session.user),
        user: session.user
          ? {
              id: session.user.id,
              email: session.email,
              displayName: session.displayName,
              authProvider: session.authProvider,
              isAdmin: session.isAdmin
            }
          : null
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, no-store' }
      }
    );

    return session.applyAuthCookies(response);
  } catch (error) {
    return handleRouteError(error, 'GET /api/auth/session');
  }
}

