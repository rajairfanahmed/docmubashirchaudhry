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
        <div className="flex flex-col items-center justify-center py-6 sm:py-10 min-h-[480px]">
          <SignUp
            fallback={
              <div
                className="w-full max-w-[420px] min-h-[440px] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8 flex flex-col items-center justify-center gap-5 animate-pulse shadow-sm"
                aria-label="Loading sign-up interface"
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
