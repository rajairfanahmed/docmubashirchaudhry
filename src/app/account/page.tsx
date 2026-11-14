import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { UserProfileClient } from '@/components/account/UserProfileClient';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'User Profile & Account Settings',
  description: 'Manage your user profile, exam metrics, attempt history, and downloaded materials.',
  path: '/account',
  index: false,
  follow: false
});

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/?auth=required&next=/account');
  }

  return (
    <div className="flex flex-col">
      <SectionBand surface="hero" density="compact" className="py-8">
        <div className="space-y-3">
          <Breadcrumbs items={[{ label: 'User Profile' }]} currentPath="/account" />
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--color-brand-deep)]">
              User Dashboard
            </span>
            <h1 className="type-page-title text-[var(--color-ink)]">
              My Account
            </h1>
            <p className="type-supporting text-[var(--color-ink-secondary)] max-w-2xl">
              Track your exam prep progress, access personal mock attempts, manage account settings, and review downloaded past papers.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand surface="ground" className="py-8 sm:py-10">
        <UserProfileClient />
      </SectionBand>
    </div>
  );
}
