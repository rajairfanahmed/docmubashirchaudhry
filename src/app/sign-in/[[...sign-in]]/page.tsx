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
        <div className="flex flex-col items-center justify-center py-6 sm:py-10 min-h-[480px]">
          <SignIn
            fallback={
              <div
                className="w-full max-w-[420px] min-h-[440px] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8 flex flex-col items-center justify-center gap-5 animate-pulse shadow-sm"
                aria-label="Loading sign-in interface"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-soft)]" />
                <div className="w-48 h-5 rounded-md bg-[var(--color-surface-soft)]" />
                <div className="w-64 h-4 rounded-md bg-[var(--color-surface-soft)]" />
                <div className="w-full h-10 rounded-lg bg-[var(--color-surface-soft)] mt-4" />
                <div className="w-full h-px bg-[var(--color-border)] my-2" />
                <div className="w-full h-10 rounded-lg bg-[var(--color-surface-soft)]" />
                <div className="w-full h-10 rounded-lg bg-[var(--color-surface-soft)]" />
              </div>
            }
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/post-auth"
            signUpFallbackRedirectUrl="/post-auth"
          />
        </div>
      </SectionBand>
    </>
  );
}
