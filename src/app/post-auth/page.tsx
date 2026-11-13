import { redirect } from 'next/navigation';
import { getRole } from '@/lib/auth/get-role';
import { sanitizeNextPath } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

interface PostAuthProps {
  searchParams: Promise<{
    next?: string;
    redirect_url?: string;
  }>;
}

export default async function PostAuthPage(props: PostAuthProps) {
  const searchParams = await props.searchParams;
  const role = await getRole();
  const rawNext = searchParams.next ?? searchParams.redirect_url;
  const next = sanitizeNextPath(rawNext);

  if (role === 'admin') {
    redirect('/admin');
  }

  redirect(next);
}

