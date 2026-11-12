'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  ClipboardCheck,
  ExternalLink,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  Users,
  X
} from 'lucide-react';
import { DmcLogo } from '@/components/branding/DmcLogo';
import { v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

export interface AdminShellProps {
  children: React.ReactNode;
  adminEmail: string;
}

const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/quizzes', label: 'Quizzes', icon: ClipboardCheck },
  { href: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
  { href: '/admin/pdfs', label: 'PDF Library', icon: FileText }
];

export function AdminShell({ children, adminEmail }: AdminShellProps) {
  const pathname = usePathname() ?? '/admin';
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        mobileNavTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await v3Api.auth.logout();
      router.push('/');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-page)] text-[var(--color-ink)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-[var(--color-accent-ink)] focus:font-semibold focus:rounded-[var(--radius-control)] focus:elevation-2 focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Admin Workspace Topbar */}
      <header className="sticky top-0 z-30 h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            ref={mobileNavTriggerRef}
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? 'Close admin navigation' : 'Open admin navigation'}
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
          >
            {mobileNavOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2.5 font-display font-bold text-sm sm:text-base text-[var(--color-ink)] truncate"
          >
            <DmcLogo className="h-8 w-auto" />
            <span className="truncate">DocMubashir Admin Console</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-brand-deep)] max-w-[220px] truncate">
            {adminEmail}
          </span>

          <Link
            href="/"
            aria-label="Return to Public Site"
            className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-xs font-semibold text-[var(--color-ink)] whitespace-nowrap"
          >
            <span className="hidden sm:inline">Return to Public Site</span>
            <span className="sm:hidden">Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            aria-label="Sign out of Admin Console"
            className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-3 rounded-[var(--radius-control)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] text-xs font-bold text-[var(--color-danger-ink)] hover:opacity-90 whitespace-nowrap disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </header>

      {/* Collapsible Mobile / Tablet Admin Nav Rail */}
      {mobileNavOpen && (
        <nav
          aria-label="Admin mobile navigation"
          className="lg:hidden bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 space-y-1"
        >
          {ADMIN_NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-control)] text-sm font-semibold min-h-[44px]',
                  isActive
                    ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border)]'
                    : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-ink-muted)]'
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Desktop Persistent Left Rail */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4 justify-between">
          <nav aria-label="Admin sidebar navigation" className="space-y-1">
            <div className="px-3 pb-2 text-xs font-semibold text-[var(--color-ink-secondary)]">
              Management &amp; Telemetry
            </div>
            {ADMIN_NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-control)] text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border)]'
                      : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)] border border-transparent'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-ink-muted)]'
                    )}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[var(--color-border)] px-2 space-y-1">
            <div className="text-xs font-semibold text-[var(--color-ink)]">
              Allow-List Guarded
            </div>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              Owner-only dashboard isolated from public site chrome and robots indexers.
            </p>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
