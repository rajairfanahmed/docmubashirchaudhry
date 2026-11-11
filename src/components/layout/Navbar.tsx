'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  Search,
  X
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { NavbarSearch } from './NavbarSearch';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const mobileSearchTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          hamburgerRef.current?.focus();
        }
        if (isMobileSearchOpen) {
          setIsMobileSearchOpen(false);
          mobileSearchTriggerRef.current?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, isMobileSearchOpen]);

  const navLinks = [
    {
      href: '/exams',
      label: 'Exams',
      icon: BookOpen,
      isActive:
        pathname.startsWith('/exams') ||
        pathname.startsWith('/ppsc') ||
        pathname.startsWith('/css-pms') ||
        pathname.startsWith('/fpsc') ||
        pathname.startsWith('/nts')
    },
    {
      href: '/geography',
      label: 'Geography',
      icon: Globe,
      isActive: pathname.startsWith('/geography') || pathname === '/countries'
    },
    {
      href: '/mcq',
      label: 'MCQs',
      icon: HelpCircle,
      isActive: pathname.startsWith('/mcq') || pathname.startsWith('/topics')
    },
    {
      href: '/library',
      label: 'Library',
      icon: FileText,
      isActive: pathname.startsWith('/library')
    }
  ];

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[var(--dmc-brand-forest)] focus:text-white focus:rounded-lg focus:shadow-xl font-bold text-xs"
      >
        Skip to main content
      </a>

      <header
        role="banner"
        className="sticky top-0 z-50 bg-[var(--dmc-surface-card)] border-b border-[var(--dmc-border-subtle)] elevation-1"
      >
        <PageContainer>
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Brand Logo Wordmark */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-2.5 group min-w-0"
              aria-label="docmubashirchaudhry Home"
            >
              <div className="w-8 h-8 min-[375px]:w-9 min-[375px]:h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--dmc-brand-forest)] flex items-center justify-center text-white shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--dmc-accent-gold)]" aria-hidden="true" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] min-[375px]:text-lg sm:text-xl font-bold tracking-tight text-[var(--dmc-ink-primary)] leading-none font-display truncate">
                  docmubashir<span className="text-[var(--dmc-brand-forest)] font-extrabold">chaudhry</span>
                </span>
                <span className="hidden min-[360px]:block text-[9px] sm:text-[10px] tracking-wider text-[var(--dmc-ink-muted)] font-semibold uppercase mt-0.5 truncate">
                  Open Exam Prep Portal
                </span>
              </div>
            </Link>

            {/* Primary Navigation Structure: Exams, Geography, MCQs, Library */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-6 text-sm font-medium min-w-0 shrink">
              {navLinks.map((link) => {
                const IconComp = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={link.isActive ? 'page' : undefined}
                    className={`dmc-press relative inline-flex items-center gap-1.5 min-h-[44px] px-1 ${
                      link.isActive
                        ? 'text-[var(--dmc-brand-forest)] font-bold'
                        : 'text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-brand-forest)]'
                    }`}
                  >
                    <IconComp
                      className={`w-4 h-4 ${
                        link.isActive ? 'text-[var(--dmc-brand-forest)]' : 'text-[var(--dmc-ink-muted)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{link.label}</span>
                    {link.isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-2 left-1 right-1 h-0.5 rounded-full bg-[var(--dmc-accent-gold)]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Search Slot + Mobile Collapsible Trigger (Zero login/account controls) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden md:block">
                <NavbarSearch mode="desktop" />
              </div>

              <button
                ref={mobileSearchTriggerRef}
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen((prev) => {
                    const next = !prev;
                    if (next) setIsMobileMenuOpen(false);
                    return next;
                  });
                }}
                aria-label={isMobileSearchOpen ? 'Close Search Bar' : 'Open Search Bar'}
                aria-expanded={isMobileSearchOpen}
                aria-controls="mobile-nav-search"
                className="dmc-press md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-[var(--dmc-border-subtle)] text-sm font-semibold text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-brand-forest)] hover:bg-[var(--dmc-surface-muted)] cursor-pointer"
              >
                {isMobileSearchOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Search className="w-5 h-5" aria-hidden="true" />
                )}
              </button>

              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen((prev) => {
                    const next = !prev;
                    if (next) setIsMobileSearchOpen(false);
                    return next;
                  });
                }}
                aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                className="dmc-press md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-[var(--dmc-border-subtle)] text-[var(--dmc-ink-primary)] hover:bg-[var(--dmc-surface-muted)] cursor-pointer"
              >
                <span
                  className="dmc-hamburger"
                  data-open={isMobileMenuOpen ? 'true' : 'false'}
                  aria-hidden="true"
                >
                  <span className="dmc-hamburger-line dmc-hamburger-line-1" />
                  <span className="dmc-hamburger-line dmc-hamburger-line-2" />
                  <span className="dmc-hamburger-line dmc-hamburger-line-3" />
                </span>
              </button>
            </div>
          </div>
        </PageContainer>

        {/* Inline Mobile Search Bar Strip (< 768px) */}
        {isMobileSearchOpen && (
          <div
            id="mobile-nav-search"
            className="dmc-drawer-enter md:hidden bg-[var(--dmc-surface-card)] border-t border-[var(--dmc-border-subtle)] px-4 py-3 elevation-2"
          >
            <NavbarSearch
              mode="mobile"
              autoFocus
              onActionComplete={() => setIsMobileSearchOpen(false)}
            />
          </div>
        )}

        {/* Collapsible Mobile Drawer Structure */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-nav-drawer"
            data-lenis-prevent
            aria-label="Mobile Navigation"
            className="dmc-drawer-enter md:hidden bg-[var(--dmc-surface-card)] border-t border-[var(--dmc-border-subtle)] px-4 py-4 space-y-3 elevation-2 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
          >
            <div className="space-y-1">
              {navLinks.map((link) => {
                const IconComp = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={link.isActive ? 'page' : undefined}
                    className={`dmc-press flex items-center gap-3 min-h-[48px] px-3 rounded-lg text-sm font-semibold ${
                      link.isActive
                        ? 'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] border border-[var(--dmc-status-verified-border)]/40'
                        : 'text-[var(--dmc-ink-secondary)] hover:bg-[var(--dmc-surface-muted)]'
                    }`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/search"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={pathname === '/search' ? 'page' : undefined}
                className={`dmc-press flex items-center gap-3 min-h-[48px] px-3 rounded-lg text-sm font-semibold ${
                  pathname === '/search'
                    ? 'bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-brand-forest)] border border-[var(--dmc-status-verified-border)]/40'
                    : 'text-[var(--dmc-ink-secondary)] hover:bg-[var(--dmc-surface-muted)]'
                }`}
              >
                <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Search</span>
              </Link>
            </div>

            <div className="pt-3 border-t border-[var(--dmc-border-subtle)] space-y-2">
              <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)]">
                Quick Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/ppsc"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-lg bg-[var(--dmc-status-verified-bg)] hover:bg-emerald-100 text-[var(--dmc-brand-forest)] border border-[var(--dmc-status-verified-border)]/30 text-xs font-bold"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>PPSC Hub</span>
                </Link>
                <Link
                  href="/library?type=solved"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="dmc-press inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-lg bg-[var(--dmc-highlight-bg)] hover:bg-amber-200/70 text-[var(--dmc-highlight-ink)] border border-[var(--dmc-highlight-border)] text-xs font-bold"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Solved PDFs</span>
                </Link>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--dmc-surface-muted)] border border-[var(--dmc-border-subtle)] p-3 text-[11px] leading-relaxed text-[var(--dmc-ink-secondary)]">
              <strong className="text-[var(--dmc-ink-primary)]">Independent Platform:</strong> Free, zero ads, no login, and not affiliated with PPSC, FPSC, NTS, or any commission.
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
