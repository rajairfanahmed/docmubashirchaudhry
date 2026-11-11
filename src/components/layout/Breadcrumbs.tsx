import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/seo/structured-data';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  currentPath?: string;
  className?: string;
}

/**
 * Structural nested navigation trail mounted on every non-root route.
 */
export function Breadcrumbs({ items, currentPath, className }: BreadcrumbsProps) {
  const trail: BreadcrumbItem[] = [{ label: 'Home', href: '/' }, ...items];

  return (
    <>
      <JsonLd data={buildBreadcrumbListSchema(items, currentPath)} />
      <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[var(--dmc-ink-muted)] font-medium">
          {trail.map((item, idx) => {
            const isLast = idx === trail.length - 1;
            return (
              <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
                {idx > 0 && (
                  <ChevronRight
                    className="w-3.5 h-3.5 text-[var(--dmc-border-strong)] shrink-0"
                    aria-hidden="true"
                  />
                )}
                {isLast || !item.href ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className="font-bold text-[var(--dmc-brand-forest)] truncate max-w-[180px] min-[375px]:max-w-[220px] sm:max-w-[340px] py-1 md:py-0"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 min-h-[44px] md:min-h-0 px-0.5 hover:text-[var(--dmc-brand-forest)] transition-colors min-w-0"
                  >
                    {idx === 0 && <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                    <span className="truncate max-w-[140px] sm:max-w-none">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

