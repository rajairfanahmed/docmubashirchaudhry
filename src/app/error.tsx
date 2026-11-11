'use client';

import React from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';

export default function GlobalErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer size="narrow" className="py-16">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-600">
          {error?.message || 'An unexpected error interrupted this study page.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-[44px] rounded-lg bg-[#0d4a28] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="min-h-[44px] inline-flex items-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800"
          >
            Return Home
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

