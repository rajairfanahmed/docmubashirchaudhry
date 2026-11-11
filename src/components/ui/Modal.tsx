'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  labelledBy?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  labelledBy = 'modal-dialog-title',
  children,
  className
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const appShell = document.getElementById('dmc-app-shell');
    const hadInert = appShell?.hasAttribute('inert') ?? false;
    const prevAriaHidden = appShell?.getAttribute('aria-hidden') ?? null;
    if (appShell) {
      appShell.setAttribute('inert', '');
      appShell.setAttribute('aria-hidden', 'true');
    }

    const timer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 30);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && (!containerRef.current.contains(document.activeElement) || document.activeElement === first)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (!containerRef.current.contains(document.activeElement) || document.activeElement === last)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (appShell) {
        if (!hadInert) appShell.removeAttribute('inert');
        if (prevAriaHidden === null) appShell.removeAttribute('aria-hidden');
        else appShell.setAttribute('aria-hidden', prevAriaHidden);
      }
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const dialogContent = (
    <div
      data-lenis-prevent
      className="dmc-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={containerRef}
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          'dmc-modal-enter w-[calc(100%-2rem)] sm:w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-modal)] p-4 sm:p-6 elevation-3 space-y-5',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--dmc-border-subtle)] pb-3">
          <h2 id={labelledBy} className="type-card-title text-[var(--dmc-ink-primary)] pt-1.5">
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close modal dialog"
            className="dmc-press min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center text-[var(--dmc-ink-secondary)] hover:bg-slate-100 hover:text-[var(--dmc-ink-primary)] focus-visible:outline-2 focus-visible:outline-[var(--dmc-brand-forest)] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}

