import React from 'react';
import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sign In | DocMubashir Exam Portal',
  description:
    'Sign in to access timed mock quizzes, track personal score history, and download verified solved PDF past papers.',
  path: '/sign-in'
});

export default function SignInPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact">
        <Breadcrumbs items={[{ label: 'Sign In' }]} currentPath="/sign-in" />
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard">
        <div className="flex flex-col items-center justify-center py-6 sm:py-10">
          <SignIn
            fallbackRedirectUrl="/post-auth"
            signUpFallbackRedirectUrl="/post-auth"
          />
        </div>
      </SectionBand>
    </>
  );
}
