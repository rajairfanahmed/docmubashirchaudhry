import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import React from 'react';
import { AdminShell } from '@/components/admin';
import { getOptionalSessionUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Console',
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSessionUser();

  if (!session || !session.user) {
    redirect('/?auth=required&next=/admin');
  }

  if (!session.isAdmin) {
    // Stealth 404: non-admins never receive confirmation that an admin console exists
    notFound();
  }

  return <AdminShell adminEmail={session.email ?? ''}>{children}</AdminShell>;
}
