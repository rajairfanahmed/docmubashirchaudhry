import React from 'react';
import { cn } from '@/lib/utils';

export type ContainerSize = 'narrow' | 'reading' | 'wide';

export interface PageContainerProps {
  size?: ContainerSize;
  className?: string;
  children: React.ReactNode;
}

const SIZE_CLASSES: Record<ContainerSize, string> = {
  narrow: 'max-w-3xl',
  reading: 'max-w-4xl',
  wide: 'max-w-7xl'
};

/**
 * Shared container shell aligning every page, header, and footer
 * on the same vertical grid and responsive horizontal gutters.
 */
export function PageContainer({
  size = 'wide',
  className,
  children
}: PageContainerProps) {
  return (
    <div className={cn(SIZE_CLASSES[size], 'mx-auto w-full px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
