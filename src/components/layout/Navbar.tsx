'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  History,
  Home,
  LogIn,
  Search,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { DmcLogo } from '@/components/branding/DmcLogo';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { notifyNavigationStart } from '@/lib/motion/navigation-events';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname() ?? '/';
  const prefersReduced = useReducedMotion();
  const { session } = useAuthSession();
  const { openAuthModal } = useAuthModal();
  const { user: clerkUser, isSignedIn: isClerkSignedIn } = useUser();
  const isAuthenticated = Boolean(isClerkSignedIn || session.authenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        mobileMenuTriggerRef.current?.focus();
        return;
      }

      if (event.key === 'Tab' && mobileDrawerRef.current) {
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
  }, [isMobileMenuOpen]);

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
          <div className="grid grid-cols-[auto_1fr] lg:grid-cols-[1fr_auto_1fr] items-center h-16 gap-3 lg:gap-4">
            {/* Brand Identity Crest */}
            <Link
              href="/"
              onClick={() => notifyNavigationStart()}
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-deep)] rounded-[var(--radius-control)] shrink-0"
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

            {/* Primary Centered Desktop Links */}
            <nav
              aria-label="Primary Navigation"
              className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1 max-w-2xl mx-auto"
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
                      'dmc-press group relative px-2.5 xl:px-3 py-2 rounded-[var(--radius-control)] text-xs xl:text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors',
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

            {/* Right Slot: User Auth Slot (Desktop) + Compact Controls (Mobile) */}
            <div className="flex items-center justify-end gap-2.5 shrink-0">
              {/* Desktop Auth Section */}
              <div className="hidden lg:flex items-center gap-2.5 shrink-0 min-w-[40px] justify-end">
                {isAuthenticated ? (
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: 'w-9 h-9 ring-2 ring-[var(--color-brand-deep)]/25 hover:ring-[var(--color-brand-deep)] transition-all',
                        userButtonTrigger: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-deep)] rounded-full'
                      }
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="User Profile"
                        href="/account"
                        labelIcon={<User className="w-4 h-4 text-[var(--color-brand-deep)]" />}
                      />
                      <UserButton.Link
                        label="My Quiz Attempts"
                        href="/my-attempts"
                        labelIcon={<History className="w-4 h-4 text-[var(--color-brand-deep)]" />}
                      />
                      <UserButton.Link
                        label="My Downloads"
                        href="/my-downloads"
                        labelIcon={<FileText className="w-4 h-4 text-[var(--color-brand-deep)]" />}
                      />
                      <UserButton.Link
                        label="Privacy & Data"
                        href="/privacy"
                        labelIcon={<ShieldCheck className="w-4 h-4 text-[var(--color-brand-deep)]" />}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                ) : (
                  <SignInButton
                    mode="modal"
                    fallbackRedirectUrl="/post-auth"
                    signUpFallbackRedirectUrl="/post-auth"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!isClerkSignedIn) openAuthModal();
                      }}
                      className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                    >
                      <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Sign In</span>
                    </button>
                  </SignInButton>
                )}
              </div>

              {/* Mobile / Tablet Controls (< lg) */}
              <div className="flex lg:hidden items-center gap-2">
                {isAuthenticated ? (
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: 'w-8 h-8 ring-2 ring-[var(--color-brand-deep)]/20'
                      }
                    }}
                  />
                ) : (
                  <SignInButton
                    mode="modal"
                    fallbackRedirectUrl="/post-auth"
                    signUpFallbackRedirectUrl="/post-auth"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!isClerkSignedIn) openAuthModal();
                      }}
                      className="dmc-press inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                    >
                      <LogIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Sign In</span>
                    </button>
                  </SignInButton>
                )}

                <button
                  ref={mobileMenuTriggerRef}
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                  aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  className="dmc-press p-2 rounded-[var(--radius-control)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] min-w-[40px] min-h-[40px] inline-flex items-center justify-center cursor-pointer"
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
                    className="p-2 rounded-[var(--radius-control)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] min-w-[40px] min-h-[40px] inline-flex items-center justify-center cursor-pointer"
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

                {/* Account Section in Drawer */}
                <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
                  <div className="text-xs font-semibold text-[var(--color-ink-secondary)] px-1">
                    User Account
                  </div>

                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2.5 rounded-[var(--radius-panel)] bg-[var(--color-surface-soft)]">
                        <UserButton
                          showName
                          appearance={{
                            elements: {
                              userButtonAvatarBox: 'w-8 h-8',
                              userButtonOuterIdentifier: 'text-sm font-semibold text-[var(--color-ink)]'
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Link
                          href="/account"
                          onClick={() => {
                            notifyNavigationStart();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-panel)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] min-h-[44px]"
                        >
                          <User className="w-4 h-4 shrink-0 text-[var(--color-brand-deep)]" aria-hidden="true" />
                          <span>User Profile</span>
                        </Link>
                        <Link
                          href="/my-attempts"
                          onClick={() => {
                            notifyNavigationStart();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-panel)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] min-h-[44px]"
                        >
                          <History className="w-4 h-4 shrink-0 text-[var(--color-brand-deep)]" aria-hidden="true" />
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
                          <FileText className="w-4 h-4 shrink-0 text-[var(--color-brand-deep)]" aria-hidden="true" />
                          <span>My Downloads</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <SignInButton
                      mode="modal"
                      fallbackRedirectUrl="/post-auth"
                      signUpFallbackRedirectUrl="/post-auth"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (!isClerkSignedIn) openAuthModal();
                        }}
                        className="w-full min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                      >
                        <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Sign In / Create Account</span>
                      </button>
                    </SignInButton>
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
