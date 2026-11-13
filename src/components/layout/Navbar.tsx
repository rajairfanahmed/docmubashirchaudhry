'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  ChevronDown,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  History,
  Home,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import { DmcLogo } from '@/components/branding/DmcLogo';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { notifyNavigationStart } from '@/lib/motion/navigation-events';
import { cn } from '@/lib/utils';

function getInitials(displayName: string | null | undefined, email: string): string {
  const source = (displayName && displayName.trim()) || email.split('@')[0] || 'U';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Navbar() {
  const pathname = usePathname() ?? '/';
  const prefersReduced = useReducedMotion();
  const { session, status, logout } = useAuthSession();
  const { openAuthModal } = useAuthModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);
  const accountMenuId = useId();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen && !isAccountMenuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          mobileMenuTriggerRef.current?.focus();
        }
        setIsAccountMenuOpen(false);
        return;
      }

      if (isMobileMenuOpen && event.key === 'Tab' && mobileDrawerRef.current) {
        const focusables = mobileDrawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (
          event.shiftKey &&
          (!mobileDrawerRef.current.contains(document.activeElement) || document.activeElement === first)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (!mobileDrawerRef.current.contains(document.activeElement) || document.activeElement === last)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMobileMenuOpen, isAccountMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      mobileCloseBtnRef.current?.focus();
    }, 30);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAccountMenuOpen]);

  const navLinks = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      label: 'Geography',
      href: '/geography',
      icon: Globe,
      isActive: pathname.startsWith('/geography') || pathname.startsWith('/countries')
    },
    {
      label: 'PPSC',
      href: '/ppsc',
      icon: GraduationCap,
      isActive: pathname.startsWith('/ppsc') || pathname.startsWith('/exams')
    },
    {
      label: 'FPSC',
      href: '/fpsc',
      icon: ShieldCheck,
      isActive: pathname.startsWith('/fpsc')
    },
    {
      label: 'PDF Library',
      href: '/library',
      icon: FileText,
      isActive: pathname.startsWith('/library')
    },
    {
      label: 'Quizzes',
      href: '/quizzes',
      icon: ClipboardCheck,
      isActive: pathname.startsWith('/quizzes') || pathname.startsWith('/mcq')
    }
  ];

  const handleSignInClick = () => {
    setIsMobileMenuOpen(false);
    openAuthModal({
      title: 'Sign in to DocMubashir Portal',
      description:
        'Create or sign in to a free student account to attempt timed mocks, track quiz scores, and download watermarked PDFs.',
      nextUrl: pathname
    });
  };

  const handleLogoutClick = async () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
  };

  const user = session.authenticated ? session.user : null;
  const studentDisplayLabel =
    user?.displayName?.trim() || user?.email?.split('@')[0] || 'Student';
  const studentInitials = user ? getInitials(user.displayName, user.email) : '';

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-[var(--color-accent-ink)] focus:font-semibold focus:rounded-[var(--radius-control)] focus:elevation-2 focus:outline-none"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)]">
        <PageContainer>
          <div className="flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] h-16 gap-3">
            {/* Brand Identity Crest (Pure Logo Without Square/Circle Enclosure) */}
            <Link
              href="/"
              onClick={() => notifyNavigationStart()}
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-deep)] rounded-[var(--radius-control)] shrink-0 lg:justify-self-start"
              aria-label="DocMubashir Exam Portal Home"
            >
              <DmcLogo className="h-9 w-auto transition-transform duration-150 group-hover:scale-[1.03]" />
              <div className="flex flex-col">
                <span className="font-display font-bold text-[var(--color-ink)] text-sm sm:text-base tracking-tight leading-none whitespace-nowrap">
                  Doc<span className="text-[var(--color-brand-deep)]">Mubashir</span>
                </span>
                <span className="text-[11px] font-medium text-[var(--color-ink-secondary)] tracking-wide mt-0.5 leading-none whitespace-nowrap">
                  Exam Portal
                </span>
              </div>
            </Link>

            {/* Primary Centered Single-Row Desktop Links (<= 6 items) */}
            <nav
              aria-label="Primary Navigation"
              className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-1 min-w-0 lg:justify-self-center"
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => notifyNavigationStart()}
                    aria-current={link.isActive ? 'page' : undefined}
                    className={cn(
                      'dmc-press group relative px-2.5 xl:px-3 py-2 rounded-[var(--radius-control)] text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors',
                      link.isActive
                        ? 'text-[var(--color-ink)] font-semibold bg-[var(--color-surface-soft)] border border-[var(--color-border)]'
                        : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]/70 border border-transparent'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none',
                        link.isActive ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-ink-muted)]'
                      )}
                      aria-hidden="true"
                    />
                    <span>{link.label}</span>
                    {link.isActive && (
                      <m.span
                        aria-hidden="true"
                        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scaleX: 0.4 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: prefersReduced ? 0.05 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-deep)] origin-center"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Slot: Student Auth Slot (Desktop) + Compact Controls (Mobile) */}
            <div className="flex items-center justify-end gap-2.5 shrink-0 lg:justify-self-end">
              <div className="hidden lg:flex items-center gap-2.5 shrink-0">

              {user ? (
                <div ref={accountMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                    aria-expanded={isAccountMenuOpen}
                    aria-controls={accountMenuId}
                    className="dmc-press inline-flex items-center gap-2 min-h-[40px] pl-1.5 pr-3 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-sm font-medium text-[var(--color-ink)] whitespace-nowrap"
                  >
                    <span
                      aria-hidden="true"
                      className="w-7 h-7 rounded-full bg-[var(--color-brand-deep)] text-white text-xs font-bold inline-flex items-center justify-center shrink-0"
                    >
                      {studentInitials}
                    </span>
                    <span className="max-w-[110px] truncate">{studentDisplayLabel}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-[var(--color-ink-secondary)] transition-transform duration-150',
                        isAccountMenuOpen && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {isAccountMenuOpen && (
                      <m.div
                        id={accountMenuId}
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: prefersReduced ? 0.08 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 mt-2 w-60 rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] elevation-2 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-[var(--color-border)]">
                          <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
                            {studentDisplayLabel}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-secondary)] truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/my-attempts"
                            onClick={() => {
                              notifyNavigationStart();
                              setIsAccountMenuOpen(false);
                            }}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
                          >
                            <History className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>My Quiz Attempts</span>
                          </Link>
                          <Link
                            href="/my-downloads"
                            onClick={() => {
                              notifyNavigationStart();
                              setIsAccountMenuOpen(false);
                            }}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
                          >
                            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>My Downloads</span>
                          </Link>
                          <Link
                            href="/privacy"
                            onClick={() => {
                              notifyNavigationStart();
                              setIsAccountMenuOpen(false);
                            }}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
                          >
                            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Privacy &amp; Data</span>
                          </Link>
                        </div>
                        <div className="pt-1 border-t border-[var(--color-border)]">
                          <button
                            type="button"
                            onClick={() => void handleLogoutClick()}
                            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[var(--color-danger-ink)] hover:bg-[var(--color-danger-bg)] text-left"
                          >
                            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSignInClick}
                  className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[40px] min-w-[96px] px-3.5 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile / Tablet Compact Controls (< lg) */}
            <div className="flex lg:hidden items-center gap-1.5">
              {!user && (
                <button
                  type="button"
                  onClick={handleSignInClick}
                  className="dmc-press hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-xs font-semibold whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Sign In</span>
                </button>
              )}

              <button
                ref={mobileMenuTriggerRef}
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen((prev) => !prev);
                }}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="dmc-press p-2 rounded-[var(--radius-control)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
              >
                <span className="dmc-hamburger" data-open={isMobileMenuOpen} aria-hidden="true">
                  <span className="dmc-hamburger-line dmc-hamburger-line-1" />
                  <span className="dmc-hamburger-line dmc-hamburger-line-2" />
                  <span className="dmc-hamburger-line dmc-hamburger-line-3" />
                </span>
              </button>
            </div>
            </div>
          </div>
        </PageContainer>
      </header>

      {/* Mobile / Tablet Right-Side Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
          >
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0.08 : 0.18, ease: 'easeOut' }}
              className="fixed inset-0 bg-[var(--dmc-surface-overlay)] backdrop-blur-xs"
              onClick={() => {
                setIsMobileMenuOpen(false);
                mobileMenuTriggerRef.current?.focus();
              }}
              aria-hidden="true"
            />

            <m.nav
              ref={mobileDrawerRef}
              id="mobile-nav-drawer"
              aria-label="Mobile Navigation"
              data-lenis-prevent
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 28 }}
              transition={{ duration: prefersReduced ? 0.08 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-[min(85vw,320px)] h-dvh bg-[var(--color-surface)] border-l border-[var(--color-border)] elevation-3 p-5 flex flex-col justify-between overflow-y-auto"
            >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  <DmcLogo className="h-7 w-auto" />
                  <span className="font-display font-bold text-sm text-[var(--color-ink)]">
                    DocMubashir Portal
                  </span>
                </div>
                <button
                  ref={mobileCloseBtnRef}
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    mobileMenuTriggerRef.current?.focus();
                  }}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-[var(--radius-control)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        notifyNavigationStart();
                        setIsMobileMenuOpen(false);
                      }}
                      aria-current={link.isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-panel)] text-sm font-semibold min-h-[44px] transition-colors',
                        link.isActive
                          ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          link.isActive ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-ink-muted)]'
                        )}
                        aria-hidden="true"
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                <Link
                  href="/search"
                  onClick={() => {
                    notifyNavigationStart();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-panel)] text-sm font-semibold min-h-[44px] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)]"
                >
                  <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Full Search Portal</span>
                </Link>
              </div>

              {/* Account Slot inside Drawer */}
              <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
                <div className="text-xs font-semibold text-[var(--color-ink-secondary)] px-1">
                  Student Account
                </div>
                {user ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-panel)] bg-[var(--color-surface-soft)]">
                      <span
                        aria-hidden="true"
                        className="w-8 h-8 rounded-full bg-[var(--color-brand-deep)] text-white text-xs font-bold inline-flex items-center justify-center shrink-0"
                      >
                        {studentInitials}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--color-ink)] truncate">
                          {studentDisplayLabel}
                        </div>
                        <div className="text-[11px] text-[var(--color-ink-secondary)] truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/my-attempts"
                      onClick={() => {
                        notifyNavigationStart();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-panel)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] min-h-[44px]"
                    >
                      <History className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>My Quiz Attempts</span>
                    </Link>
                    <Link
                      href="/my-downloads"
                      onClick={() => {
                        notifyNavigationStart();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-panel)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] min-h-[44px]"
                    >
                      <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>My Downloads</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleLogoutClick()}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-panel)] text-sm font-semibold text-[var(--color-danger-ink)] hover:bg-[var(--color-danger-bg)] min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignInClick}
                    className="w-full min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Sign In / Free Student Account</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-secondary)] space-y-1">
              <p className="font-semibold text-[var(--color-brand-deep)]">
                Independent Educational Portal
              </p>
              <p>
                Reference guides &amp; exam hubs open to all. Free sign-in required for timed mocks
                &amp; PDF downloads.
              </p>
            </div>
            </m.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
