'use client';

import type { ReactNode } from 'react';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { VisitTracker } from '@/components/analytics/VisitTracker';
import { AuthModalProvider, AuthSessionProvider } from '@/components/auth';
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { TopLoadingBar } from '@/components/motion/TopLoadingBar';
import { ToastProvider } from '@/components/ui/ToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <SmoothScrollProvider>
          <AuthSessionProvider>
            <ToastProvider>
              <AuthModalProvider>
                <VisitTracker />
                <TopLoadingBar />
                {children}
              </AuthModalProvider>
            </ToastProvider>
          </AuthSessionProvider>
        </SmoothScrollProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
