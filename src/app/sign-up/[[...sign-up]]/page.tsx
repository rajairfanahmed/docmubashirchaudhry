import React from 'react';
import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionBand } from '@/components/layout/SectionBand';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Create Free Account | DocMubashir Exam Portal',
  description:
    'Create a free account to take timed mock exams, track question accuracy, and download solved past paper booklets.',
  path: '/sign-up'
});

export default function SignUpPage() {
  return (
    <>
      <SectionBand surface="ground" size="reading" density="compact">
        <Breadcrumbs items={[{ label: 'Create Account' }]} currentPath="/sign-up" />
      </SectionBand>

      <SectionBand surface="muted" size="reading" density="standard">
        <div className="flex flex-col items-center justify-center py-6 sm:py-10">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/post-auth"
            signInFallbackRedirectUrl="/post-auth"
          />
        </div>
      </SectionBand>
    </>
  );
}
