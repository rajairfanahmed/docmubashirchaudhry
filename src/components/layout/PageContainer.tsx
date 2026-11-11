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
  wide: 'max-w-6xl'
};

/**
 * Base responsive container wrapper established in Step 1.
 * Structural widths follow docs/structural-layout.md; responsive gutters are finalized in Steps 3 and 6.
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

