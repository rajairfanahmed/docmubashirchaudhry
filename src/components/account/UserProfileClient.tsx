'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  History,
  Lock,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  Trash2,
  User,
  UserCheck
} from 'lucide-react';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

interface UserStatsSummary {
  attemptsCount: number;
  avgScore: number;
  downloadsCount: number;
  lastAttemptAt?: string | null;
}

interface UserProfileData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  status: string;
  isAdmin: boolean;
  createdAt: string;
}

export function UserProfileClient() {
  const { isSignedIn, user } = useUser();
  const { session, logout } = useAuthSession();
  const { showToast } = useToast();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<UserStatsSummary>({
    attemptsCount: 0,
    avgScore: 0,
    downloadsCount: 0,
    lastAttemptAt: null
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Self-deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load Profile from API-02 (GET /api/me)
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const res = await v3Api.me.getProfile();
        if (isMounted && res.data) {
          setProfile(res.data);
          setDisplayNameInput(res.data.name || '');
        }
      } catch {
        // Fallback to Clerk/session if API is warming up
        if (user?.firstName) {
          setDisplayNameInput(user.firstName);
        } else if (session.user?.displayName) {
          setDisplayNameInput(session.user.displayName);
        }
      }
    }
    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user?.firstName, session.user?.displayName]);

  // Load Stats from API
  useEffect(() => {
    if (!isSignedIn && !session.authenticated) return;

    let isMounted = true;
    async function loadStats() {
      setIsLoadingStats(true);
      try {
        const [attemptsRes, downloadsRes] = await Promise.allSettled([
          v3Api.me.listAttempts({ page: 1, pageSize: 5 }),
          v3Api.me.listDownloads({ page: 1, pageSize: 5 })
        ]);

        if (!isMounted) return;

        let attemptsCount = 0;
        let avgScore = 0;
        let lastAttemptAt = null;

        if (attemptsRes.status === 'fulfilled') {
          attemptsCount = attemptsRes.value.pagination.totalItems;
          avgScore = Math.round(attemptsRes.value.summary.averagePercentage);
          lastAttemptAt = attemptsRes.value.items[0]?.createdAt ?? null;
        }

        let downloadsCount = 0;
        if (downloadsRes.status === 'fulfilled') {
          downloadsCount = downloadsRes.value.pagination.totalItems;
        }

        setStats({
          attemptsCount,
          avgScore,
          downloadsCount,
          lastAttemptAt
        });
      } catch {
        // Continue with default zeroes
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    }

    void loadStats();
    return () => {
      isMounted = false;
    };
  }, [isSignedIn, session.authenticated]);

  const handleSaveName = async () => {
    const trimmed = displayNameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      showToast({
        title: 'Invalid Name',
        description: 'Name must be at least 2 characters long.',
        tone: 'error'
      });
      return;
    }

    setIsSavingName(true);
    try {
      // 1. Update backend profile (API-03) which syncs to Clerk & Supabase profiles
      await v3Api.me.updateProfile(trimmed);

      // 2. Also update Clerk client user object if available
      if (user) {
        await user.update({ firstName: trimmed });
      }

      setProfile((prev) => (prev ? { ...prev, name: trimmed } : null));
      setIsEditingName(false);
      showToast({
        title: 'Profile Updated',
        description: 'Your display name has been updated cleanly.',
        tone: 'success'
      });
    } catch {
      showToast({
        title: 'Update failed',
        description: 'Unable to update profile right now.',
        tone: 'error'
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      showToast({
        title: 'Confirmation Required',
        description: 'Please type DELETE exactly to confirm account removal.',
        tone: 'error'
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      await v3Api.me.deleteAccount();
      setShowDeleteModal(false);
      showToast({
        title: 'Account Deleted',
        description: 'Your account and personal data have been removed.',
        tone: 'info'
      });
      await logout();
      router.push('/');
      router.refresh();
    } catch {
      showToast({
        title: 'Deletion Failed',
        description: 'Unable to complete account deletion. Please try again.',
        tone: 'error'
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const primaryEmail =
    profile?.email ??
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    session.user?.email ??
    '';
  const role =
    profile?.isAdmin ||
    (user?.publicMetadata as { role?: string } | undefined)?.role === 'admin' ||
    session.user?.isAdmin
      ? 'admin'
      : 'user';
  const name =
    profile?.name ||
    user?.fullName ||
    user?.firstName ||
    session.user?.displayName ||
    primaryEmail.split('@')[0] ||
    'Exam Candidate';

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Account Blocked Alert Banner (DEC-024) */}
      {profile?.status === 'blocked' && (
        <div
          role="alert"
          className="rounded-[var(--radius-panel)] bg-red-50 border border-red-200 p-5 flex items-start gap-3.5 text-red-900 shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Account Access Suspended</h3>
            <p className="text-xs text-red-700 leading-relaxed">
              Your account is not active right now. Please write to rajairfana551@gmail.com for review and verification.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Hero Card */}
      <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--color-brand-deep)] text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0 shadow-md">
              {initials}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] truncate">
                  {name}
                </h2>
                {role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Shield className="w-3 h-3" />
                    Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <UserCheck className="w-3 h-3" />
                    Registered Candidate
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[var(--color-ink-secondary)]">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-[var(--color-brand-deep)] shrink-0" />
                  <span>{primaryEmail}</span>
                  <span title="Email Verified" className="inline-flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                  </span>
                </span>

                {joinedDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-ink-muted)] shrink-0" />
                    <span>Member since {joinedDate}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingName((prev) => !prev)}
            >
              {isEditingName ? 'Cancel Edit' : 'Edit Name'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--color-danger-ink)] hover:bg-[var(--color-danger-bg)]"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Inline Name Editor */}
        {isEditingName && (
          <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="Your full name"
              className="flex-1 px-3.5 py-2 text-sm rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-deep)]"
            />
            <Button
              variant="primary"
              size="sm"
              isLoading={isSavingName}
              onClick={() => void handleSaveName()}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/account/attempts"
          className="group rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand-deep)] p-5 transition-all shadow-xs block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">
              Quiz Attempts
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <History className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-ink)] mt-2">
            {isLoadingStats ? '...' : stats.attemptsCount}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-deep)] mt-3 group-hover:underline">
            <span>View all attempts</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-ink)] mt-2">
            {isLoadingStats ? '...' : `${stats.avgScore}%`}
          </p>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-3">
            Across all completed mock exams
          </p>
        </div>

        <Link
          href="/account/downloads"
          className="group rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand-deep)] p-5 transition-all shadow-xs block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider">
              PDF Downloads
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-soft)] text-[var(--color-brand-deep)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[var(--color-ink)] mt-2">
            {isLoadingStats ? '...' : stats.downloadsCount}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-deep)] mt-3 group-hover:underline">
            <span>View access history</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* Account Details & Quick Hub Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--color-brand-deep)]" />
            Account Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-ink-secondary)]">Authentication Provider</span>
              <span className="font-semibold text-[var(--color-ink)] capitalize">
                {session.user?.authProvider ?? 'Clerk'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-ink-secondary)]">User Identifier</span>
              <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                {session.user?.id ? `${session.user.id.slice(0, 16)}...` : 'Connected'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-ink-secondary)]">Account Status</span>
              <span className={cn(
                'inline-flex items-center gap-1 font-semibold text-xs',
                profile?.status === 'blocked' ? 'text-red-700' : 'text-emerald-700'
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {profile?.status === 'blocked' ? 'Suspended' : 'Active & Verified'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-ink-secondary)]">Data Storage</span>
              <span className="text-xs text-[var(--color-ink)] font-medium">
                Supabase PostgreSQL (RLS Protected)
              </span>
            </div>
            <div className="pt-3 flex justify-between items-center">
              <span className="text-xs text-[var(--color-danger-ink)]">
                Danger Zone
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-xs font-semibold text-[var(--color-danger-ink)] hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-brand-deep)]" />
            Preparation Hub Shortcuts
          </h3>
          <div className="space-y-2.5">
            <Link
              href="/quizzes"
              className="flex items-center justify-between p-3 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] hover:bg-[var(--color-surface-soft-hover)] text-sm font-semibold text-[var(--color-ink)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--color-brand-deep)]" />
                <span>Take a Timed Mock Paper</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" />
            </Link>

            <Link
              href="/library"
              className="flex items-center justify-between p-3 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] hover:bg-[var(--color-surface-soft-hover)] text-sm font-semibold text-[var(--color-ink)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-brand-deep)]" />
                <span>Download Solved PDF Past Papers</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" />
            </Link>

            <Link
              href="/geography"
              className="flex items-center justify-between p-3 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] hover:bg-[var(--color-surface-soft-hover)] text-sm font-semibold text-[var(--color-ink)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--color-brand-deep)]" />
                <span>Practice World Geography MCQs</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account Permanently"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--color-ink-secondary)]">
              This action cannot be undone. All your personal data and identity records will be permanently removed.
            </p>
            <div className="p-3 rounded-[var(--radius-control)] bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
              Please note: Deleting your account will anonymize your profile and remove your Clerk credentials. Past exam attempts are anonymized for integrity verification.
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-delete-input" className="text-xs font-semibold text-[var(--color-ink)]">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 text-sm rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => void handleDeleteAccount()}
                isLoading={isDeletingAccount}
                disabled={deleteConfirmationText !== 'DELETE'}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
