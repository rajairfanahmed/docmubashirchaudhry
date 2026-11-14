'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ChevronDown,
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
import { ClerkLoaded, UserButton, useClerk, useUser } from '@clerk/nextjs';
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
  const clerk = useClerk();
  const isAuthenticated = Boolean(isClerkSignedIn || session.authenticated);

  const handleSignInClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow modifier-key clicks to navigate to /sign-in page
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      // Only prevent default and open modal if Clerk is loaded
      if (clerk.loaded) {
        e.preventDefault();
        clerk.openSignIn({
          fallbackRedirectUrl: '/post-auth',
          signUpFallbackRedirectUrl: '/post-auth'
        });
      }
      // If Clerk isn't loaded yet, let the Link navigate to /sign-in page as fallback
    },
    [clerk]
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExamsDropdownOpen, setIsExamsDropdownOpen] = useState(false);
  const [isMobileExamsOpen, setIsMobileExamsOpen] = useState(true);
  const examsDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsExamsDropdownOpen(false);
  }, [pathname]);

  const handleExamsMouseEnter = () => {
    if (examsDropdownTimeoutRef.current) {
      clearTimeout(examsDropdownTimeoutRef.current);
      examsDropdownTimeoutRef.current = null;
    }
    setIsExamsDropdownOpen(true);
  };

  const handleExamsMouseLeave = () => {
    if (examsDropdownTimeoutRef.current) {
      clearTimeout(examsDropdownTimeoutRef.current);
    }
    examsDropdownTimeoutRef.current = setTimeout(() => {
      setIsExamsDropdownOpen(false);
    }, 180);
  };

  const isExamsActive =
    pathname.startsWith('/ppsc') ||
    pathname.startsWith('/fpsc') ||
    pathname.startsWith('/css-pms') ||
    pathname.startsWith('/nts') ||
    pathname.startsWith('/exams');

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

  const primaryNavLinks = [
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

  const examSubMenuItems = [
    {
      label: 'PPSC',
      fullName: 'Punjab Public Service Commission',
      badge: 'Punjab',
      description: 'Lecturer, Sub-Inspector & Screening Tests',
      href: '/ppsc'
    },
    {
      label: 'FPSC',
      fullName: 'Federal Public Service Commission',
      badge: 'Federal',
      description: 'Customs, FIA, AD & General Recruitment',
      href: '/fpsc'
    },
    {
      label: 'CSS',
      fullName: 'Central Superior Services (MPT)',
      badge: 'Federal',
      description: 'MPT Screening & Compulsory Subject Drills',
      href: '/css-pms'
    },
    {
      label: 'PMS',
      fullName: 'Provincial Management Service',
      badge: 'Punjab',
      description: 'Combined Competitive Exam & GK Papers',
      href: '/css-pms'
    },
    {
      label: 'NTS',
      fullName: 'National Testing Service',
      badge: 'Aptitude',
      description: 'NAT & GAT General Aptitude Practice',
      href: '/nts'
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
              {/* Home */}
              <Link
                href="/"
                onClick={() => notifyNavigationStart()}
                aria-current={pathname === '/' ? 'page' : undefined}
                className={cn(
                  'dmc-press group relative px-2.5 xl:px-3 py-2 rounded-[var(--radius-control)] text-xs xl:text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors',
                  pathname === '/'
                    ? 'text-[var(--color-ink)] font-semibold bg-[var(--color-surface-soft)] border border-[var(--color-border)]'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]/70 border border-transparent'
                )}
              >
                <Home
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none',
                    pathname === '/' ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-ink-muted)]'
                  )}
                  aria-hidden="true"
                />
                <span>Home</span>
                {pathname === '/' && (
                  <m.span
                    aria-hidden="true"
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scaleX: 0.4 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: prefersReduced ? 0.05 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-deep)] origin-center"
                  />
                )}
              </Link>

              {/* Geography */}
              <Link
                href="/geography"
                onClick={() => notifyNavigationStart()}
                aria-current={pathname.startsWith('/geography') || pathname.startsWith('/countries') ? 'page' : undefined}
                className={cn(
                  'dmc-press group relative px-2.5 xl:px-3 py-2 rounded-[var(--radius-control)] text-xs xl:text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors',
                  pathname.startsWith('/geography') || pathname.startsWith('/countries')
                    ? 'text-[var(--color-ink)] font-semibold bg-[var(--color-surface-soft)] border border-[var(--color-border)]'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]/70 border border-transparent'
                )}
              >
                <Globe
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none',
                    pathname.startsWith('/geography') || pathname.startsWith('/countries')
                      ? 'text-[var(--color-brand-deep)]'
                      : 'text-[var(--color-ink-muted)]'
                  )}
                  aria-hidden="true"
                />
                <span>Geography</span>
                {(pathname.startsWith('/geography') || pathname.startsWith('/countries')) && (
                  <m.span
                    aria-hidden="true"
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scaleX: 0.4 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: prefersReduced ? 0.05 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-deep)] origin-center"
                  />
                )}
              </Link>

              {/* Exams Dropdown (Hover & Click) */}
              <div
                className="relative"
                onMouseEnter={handleExamsMouseEnter}
                onMouseLeave={handleExamsMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setIsExamsDropdownOpen((prev) => !prev)}
                  onFocus={() => setIsExamsDropdownOpen(true)}
                  aria-expanded={isExamsDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Toggle competitive examinations menu"
                  className={cn(
                    'dmc-press group relative px-2.5 xl:px-3 py-2 rounded-[var(--radius-control)] text-xs xl:text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors cursor-pointer',
                    isExamsActive
                      ? 'text-[var(--color-ink)] font-semibold bg-[var(--color-surface-soft)] border border-[var(--color-border)]'
                      : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]/70 border border-transparent'
                  )}
                >
                  <GraduationCap
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none',
                      isExamsActive ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-ink-muted)]'
                    )}
                    aria-hidden="true"
                  />
                  <span>Exams</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-[var(--color-ink-muted)] transition-transform duration-200 motion-reduce:transform-none',
                      isExamsDropdownOpen && 'rotate-180 text-[var(--color-brand-deep)]'
                    )}
                    aria-hidden="true"
                  />
                  {isExamsActive && (
                    <m.span
                      aria-hidden="true"
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scaleX: 0.4 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: prefersReduced ? 0.05 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-deep)] origin-center"
                    />
                  )}
                </button>

                {/* Floating Exams Dropdown Panel */}
                <AnimatePresence>
                  {isExamsDropdownOpen && (
                    <m.div
                      role="menu"
                      aria-label="Competitive examinations menu"
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 w-72 sm:w-80"
                    >
                      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-2 divide-y divide-[var(--color-border)] elevation-3">
                        <div className="space-y-1 pb-1.5">
                          {examSubMenuItems.map((item) => {
                            const itemActive = pathname === item.href;
                            return (
                              <Link
                                key={item.label}
                                href={item.href}
                                role="menuitem"
                                onClick={() => {
                                  notifyNavigationStart();
                                  setIsExamsDropdownOpen(false);
                                }}
                                className={cn(
                                  'flex items-start gap-2.5 px-3 py-2 rounded-xl transition-colors group/item text-left',
                                  itemActive
                                    ? 'bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] font-semibold'
                                    : 'hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)]'
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs sm:text-sm text-[var(--color-ink)] group-hover/item:text-[var(--color-brand-deep)]">
                                      {item.label}
                                    </span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--color-surface-soft)] text-[var(--color-ink-muted)] border border-[var(--color-border)]">
                                      {item.badge}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[var(--color-ink-secondary)] truncate mt-0.5">
                                    {item.fullName}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>

                        <div className="pt-1.5">
                          <Link
                            href="/exams"
                            role="menuitem"
                            onClick={() => {
                              notifyNavigationStart();
                              setIsExamsDropdownOpen(false);
                            }}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] transition-colors group/all"
                          >
                            <span>All Examinations Directory</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/all:translate-x-0.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* PDF Library */}
              <Link
                href="/library"
                onClick={() => notifyNavigationStart()}
                aria-current={pathname.startsWith('/library') ? 'page' : undefined}
                className={cn(
                  'dmc-press group relative px-2.5 xl:px-3 py-2 rounded-[var(--radius-control)] text-xs xl:text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors',
                  pathname.startsWith('/library')
                    ? 'text-[var(--color-ink)] font-semibold bg-[var(--color-surface-soft)] border border-[var(--color-border)]'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]/70 border border-transparent'
                )}
              >
                <FileText
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none',
                    pathname.startsWith('/library') ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-ink-muted)]'
                  )}
                  aria-hidden="true"
                />
                <span>PDF Library</span>
                {pathname.startsWith('/library') && (
                  <m.span
                    aria-hidden="true"
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scaleX: 0.4 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: prefersReduced ? 0.05 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-deep)] origin-center"
                  />
                )}
              </Link>

              {/* Quizzes */}
              <Link
                href="/quizzes"
                onClick={() => notifyNavigationStart()}
                aria-current={pathname.startsWith('/quizzes') || pathname.startsWith('/mcq') ? 'page' : undefined}
                className={cn(
                  'dmc-press group relative px-2.5 xl:px-3 py-2 rounded-[var(--radius-control)] text-xs xl:text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors',
                  pathname.startsWith('/quizzes') || pathname.startsWith('/mcq')
                    ? 'text-[var(--color-ink)] font-semibold bg-[var(--color-surface-soft)] border border-[var(--color-border)]'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]/70 border border-transparent'
                )}
              >
                <ClipboardCheck
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none',
                    pathname.startsWith('/quizzes') || pathname.startsWith('/mcq')
                      ? 'text-[var(--color-brand-deep)]'
                      : 'text-[var(--color-ink-muted)]'
                  )}
                  aria-hidden="true"
                />
                <span>Quizzes</span>
                {(pathname.startsWith('/quizzes') || pathname.startsWith('/mcq')) && (
                  <m.span
                    aria-hidden="true"
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scaleX: 0.4 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: prefersReduced ? 0.05 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-brand-deep)] origin-center"
                  />
                )}
              </Link>
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
                  <Link
                      href="/sign-in"
                      onClick={handleSignInClick}
                      className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                    >
                      <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Sign In</span>
                    </Link>
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
                  <Link
                      href="/sign-in"
                      onClick={handleSignInClick}
                      className="dmc-press inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
                    >
                      <LogIn className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Sign In</span>
                    </Link>
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
                  {/* Home */}
                  <Link
                    href="/"
                    onClick={() => {
                      notifyNavigationStart();
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={pathname === '/' ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-panel)] text-sm font-semibold min-h-[44px] transition-colors',
                      pathname === '/'
                        ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border)]'
                        : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)]'
                    )}
                  >
                    <Home className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                    <span>Home</span>
                  </Link>

                  {/* Geography */}
                  <Link
                    href="/geography"
                    onClick={() => {
                      notifyNavigationStart();
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={pathname.startsWith('/geography') || pathname.startsWith('/countries') ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-panel)] text-sm font-semibold min-h-[44px] transition-colors',
                      pathname.startsWith('/geography') || pathname.startsWith('/countries')
                        ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border)]'
                        : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)]'
                    )}
                  >
                    <Globe className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                    <span>Geography</span>
                  </Link>

                  {/* Competitive Exams Accordion */}
                  <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsMobileExamsOpen((prev) => !prev)}
                      aria-expanded={isMobileExamsOpen}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-3 text-sm font-semibold min-h-[44px] transition-colors cursor-pointer',
                        isExamsActive
                          ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                        <span>Exams</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-[var(--color-ink-muted)] transition-transform duration-200',
                          isMobileExamsOpen && 'rotate-180'
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {isMobileExamsOpen && (
                      <div className="bg-[var(--color-surface-soft)]/50 px-3 py-2 space-y-1 border-t border-[var(--color-border)]">
                        {examSubMenuItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => {
                              notifyNavigationStart();
                              setIsMobileMenuOpen(false);
                            }}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                              pathname === item.href
                                ? 'bg-[var(--color-surface)] text-[var(--color-brand-deep)] shadow-xs'
                                : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                            )}
                          >
                            <span>{item.label} - {item.fullName}</span>
                            <span className="text-[10px] text-[var(--color-ink-muted)] shrink-0 ml-1">{item.badge}</span>
                          </Link>
                        ))}
                        <Link
                          href="/exams"
                          onClick={() => {
                            notifyNavigationStart();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-[var(--color-brand-deep)] hover:underline pt-2 border-t border-[var(--color-border)]/50"
                        >
                          <span>All Examinations Directory</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* PDF Library */}
                  <Link
                    href="/library"
                    onClick={() => {
                      notifyNavigationStart();
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={pathname.startsWith('/library') ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-panel)] text-sm font-semibold min-h-[44px] transition-colors',
                      pathname.startsWith('/library')
                        ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border)]'
                        : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)]'
                    )}
                  >
                    <FileText className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                    <span>PDF Library</span>
                  </Link>

                  {/* Quizzes */}
                  <Link
                    href="/quizzes"
                    onClick={() => {
                      notifyNavigationStart();
                      setIsMobileMenuOpen(false);
                    }}
                    aria-current={pathname.startsWith('/quizzes') || pathname.startsWith('/mcq') ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-panel)] text-sm font-semibold min-h-[44px] transition-colors',
                      pathname.startsWith('/quizzes') || pathname.startsWith('/mcq')
                        ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border)]'
                        : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)]/70 hover:text-[var(--color-ink)]'
                    )}
                  >
                    <ClipboardCheck className="w-4 h-4 text-[var(--color-brand-deep)] shrink-0" aria-hidden="true" />
                    <span>Quizzes</span>
                  </Link>

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
                    <Link
                        href="/sign-in"
                        onClick={(e) => {
                          setIsMobileMenuOpen(false);
                          handleSignInClick(e);
                        }}
                        className="w-full min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                      >
                        <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Sign In / Create Account</span>
                      </Link>
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
