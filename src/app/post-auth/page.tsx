import { redirect } from 'next/navigation';
import { getRole } from '@/lib/auth/get-role';
import { getOptionalSessionUser, sanitizeNextPath } from '@/lib/auth/guards';
import { syncClerkUserProfile } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface PostAuthProps {
  searchParams: Promise<{
    next?: string;
    redirect_url?: string;
  }>;
}

export default async function PostAuthPage(props: PostAuthProps) {
  const searchParams = await props.searchParams;
  const [role, session] = await Promise.all([getRole(), getOptionalSessionUser()]);
  const rawNext = searchParams.next ?? searchParams.redirect_url;
  const next = sanitizeNextPath(rawNext);

  if (session?.user && session.email) {
    try {
      await syncClerkUserProfile({
        clerkUserId: session.user.id,
        email: session.email,
        displayName: session.displayName,
        role: role === 'admin' ? 'admin' : 'user'
      });
    } catch {
      // Continue even if Supabase sync encounters transient issue
    }
  }

  if (role === 'admin') {
    redirect('/admin');
  }

  redirect(next);
}

