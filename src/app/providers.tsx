'use client';

import type { ReactNode } from 'react';
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { TopLoadingBar } from '@/components/motion/TopLoadingBar';
import { ToastProvider } from '@/components/ui/ToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <TopLoadingBar />
      <ToastProvider>{children}</ToastProvider>
    </SmoothScrollProvider>
  );
}

