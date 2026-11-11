'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { TopLoadingBar } from '@/components/motion/TopLoadingBar';
import { ToastProvider } from '@/components/ui/ToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60 * 24, // 24 hours caching
            gcTime: 1000 * 60 * 60 * 24,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SmoothScrollProvider>
        <TopLoadingBar />
        <ToastProvider>{children}</ToastProvider>
      </SmoothScrollProvider>
    </QueryClientProvider>
  );
}

