'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';
import { cn } from '@/lib/utils';

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Restrained one-time entrance reveal for key lower-page bands.
 * Never gates reading: immediately stays visible under `prefers-reduced-motion`,
 * when `IntersectionObserver` is unavailable, or if already above/in the fold.
 */
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96) {
      setIsRevealed(true);
      return;
    }

    setIsRevealed(false);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '0px 0px -24px 0px', threshold: 0.04 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none',
        isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5',
        className
      )}
    >
      {children}
    </div>
  );
}

