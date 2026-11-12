'use client';

import React, { useCallback, useState } from 'react';
import { Download, Loader2, Lock } from 'lucide-react';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { formatBytes } from '@/lib/format';
import { isV3ClientError, v3Api } from '@/lib/v3/client';
import { cn } from '@/lib/utils';

export interface GatedPdfDownloadButtonProps {
  pdfId: string;
  title: string;
  fileSizeBytes?: number;
  fallbackPublicHref?: string;
  label?: string;
  variant?: 'forest' | 'emerald' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  tabIndex?: number;
  className?: string;
}

function triggerBrowserDownload(url: string, filenameHint?: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  if (filenameHint) {
    anchor.download = filenameHint;
  }
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function GatedPdfDownloadButton({
  pdfId,
  title,
  fileSizeBytes,
  fallbackPublicHref,
  label,
  variant = 'forest',
  size = 'md',
  tabIndex,
  className
}: GatedPdfDownloadButtonProps) {
  const { session, refreshSession } = useAuthSession();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();
  const [isPreparing, setIsPreparing] = useState(false);

  const performDownload = useCallback(async () => {
    setIsPreparing(true);
    try {
      const grant = await v3Api.pdfs.requestDownloadUrl(pdfId);
      triggerBrowserDownload(grant.downloadUrl);
      const validMinutes = Math.max(1, Math.round(grant.expiresInSeconds / 60));
      showToast({
        title: 'Download started',
        description: `Secure temporary link generated (valid for ${validMinutes} min).`,
        tone: 'success'
      });
    } catch (error) {
      if (isV3ClientError(error)) {
        if (error.status === 401) {
          void refreshSession();
          openAuthModal({
            title: 'Sign in to download this PDF',
            description: `Sign in with a free student account to generate your personal expiring download link for "${title}".`,
            onAuthenticated: performDownload
          });
          return;
        }

        if (error.status === 429) {
          const waitSeconds = error.retryAfterSeconds ?? 60;
          showToast({
            title: 'Download limit reached temporarily',
            description: `Please wait about ${waitSeconds}s before requesting another signed PDF link.`,
            tone: 'warning',
            action: {
              label: 'Retry',
              onClick: () => void performDownload()
            }
          });
          return;
        }

        if (
          (error.code === 'PDF_NOT_FOUND' || error.status === 503) &&
          fallbackPublicHref
        ) {
          triggerBrowserDownload(fallbackPublicHref);
          showToast({
            title: 'Download started',
            description: `Downloading study booklet: ${title}.`,
            tone: 'success'
          });
          return;
        }

        showToast({
          title: 'Download could not start',
          description: error.message,
          tone: 'error'
        });
        return;
      }

      showToast({
        title: 'Download interrupted',
        description: 'Could not reach the download endpoint. Please retry.',
        tone: 'error'
      });
    } finally {
      setIsPreparing(false);
    }
  }, [fallbackPublicHref, openAuthModal, pdfId, refreshSession, showToast, title]);

  const handleClick = () => {
    if (!session.authenticated) {
      openAuthModal({
        title: 'Sign in to download this PDF',
        description: `Create or sign in to a free student account to download "${title}".`,
        onAuthenticated: performDownload
      });
      return;
    }

    void performDownload();
  };

  const sizeClass =
    size === 'sm'
      ? 'min-h-[40px] px-3.5 py-1.5 text-xs'
      : size === 'lg'
      ? 'min-h-[48px] px-5 py-3 text-sm'
      : 'min-h-[44px] px-4 py-2 text-xs';

  const variantClass =
    variant === 'emerald'
      ? 'bg-[var(--color-brand-deep)] hover:bg-[var(--color-brand-deep-hover)] text-white'
      : variant === 'outline'
      ? 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:border-[var(--color-brand-deep)]'
      : 'bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)]';

  const isLocked = !session.authenticated;
  const visibleLabel = label ?? (isPreparing ? 'Preparing secure link...' : 'Download PDF');

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPreparing}
      aria-busy={isPreparing || undefined}
      tabIndex={tabIndex}
      className={cn(
        'dmc-press inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer',
        sizeClass,
        variantClass,
        className
      )}
    >
      {isPreparing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : isLocked ? (
        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {visibleLabel}
        <span className="sr-only">
          {' '}
          {title}
          {fileSizeBytes ? ` (${formatBytes(fileSizeBytes)})` : ''}
          {isLocked ? ' (requires sign in)' : ''}
        </span>
      </span>
    </button>
  );
}

