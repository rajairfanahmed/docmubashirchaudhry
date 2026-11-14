'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  CheckCircle,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Flag,
  HelpCircle,
  History,
  LogOut,
  Menu,
  ShieldCheck,
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
  { href: '/admin/participation', label: 'Participation', icon: History },
  { href: '/admin/quizzes', label: 'Quizzes', icon: ClipboardCheck },
  { href: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
  { href: '/admin/pdfs', label: 'PDF Library', icon: FileText },
  { href: '/admin/reports', label: 'Question Reports', icon: Flag },
  { href: '/admin/activity', label: 'Activity Audit', icon: ShieldCheck }
];

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function AdminShell({ children, adminEmail }: AdminShellProps) {
  const pathname = usePathname() ?? '/admin';
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);

  // Notification bell state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileNavOpen(false);
    setIsBellOpen(false);
  }, [pathname]);

  // Outside click handler for bell dropdown
  useEffect(() => {
    if (!isBellOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isBellOpen]);

  // Poll notifications on mount and every 60s
  useEffect(() => {
    let isMounted = true;
    async function fetchNotifications() {
      try {
        const res = await v3Api.admin.notifications.list({ pageSize: 10 });
        if (isMounted && res.data) {
          setNotifications(res.data);
          setUnreadCount(res.meta?.unreadCount ?? 0);
        }
      } catch {
        // Non-blocking
      }
    }

    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMarkAllRead = async () => {
    setIsMarkingRead(true);
    try {
      await v3Api.admin.notifications.markRead({ all: true });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Non-blocking
    } finally {
      setIsMarkingRead(false);
    }
  };

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
            className="lg:hidden min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] cursor-pointer"
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
          {/* Notification Bell Dropdown */}
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => setIsBellOpen((prev) => !prev)}
              aria-label="View admin notifications"
              className="relative p-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isBellOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-ink)]">
                      Admin Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-800">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      disabled={isMarkingRead}
                      className="text-xs text-[var(--color-brand-deep)] hover:underline font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--color-ink-muted)]">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'p-3.5 space-y-1 transition-colors',
                          item.isRead ? 'bg-[var(--color-surface)]' : 'bg-emerald-50/40'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--color-ink)] truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[var(--color-ink-muted)] shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-brand-deep)] max-w-[220px] truncate">
            {adminEmail}
          </span>

          <Link
            href="/"
            aria-label="Return to Public Site"
            className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 sm:px-3 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-xs font-semibold text-[var(--color-ink)] whitespace-nowrap cursor-pointer"
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
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-[var(--radius-control)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] text-xs font-bold text-[var(--color-danger-ink)] hover:opacity-90 whitespace-nowrap disabled:opacity-60 cursor-pointer"
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

      {/* Desktop Main Workspace with Persistent Left Rail */}
      <div className="flex-1 flex w-full">
        <aside
          aria-label="Admin side navigation"
          className="hidden lg:flex flex-col w-60 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4 space-y-1.5"
        >
          <div className="text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider px-3 pb-2">
            Control Plane
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
                    ? 'bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] border border-[var(--color-border)] shadow-xs'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]/60'
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
        </aside>

        <main id="main-content" className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
