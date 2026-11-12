'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
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
  const prefersReduced = useReducedMotion();
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

  if (!mounted) return null;

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.08 : 0.16, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--color-dark-surface)]/65 p-0 sm:p-4 backdrop-blur-xs"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseRef.current();
          }}
        >
          <m.div
            key="modal-panel"
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            transition={{
              duration: prefersReduced ? 0.08 : 0.22,
              ease: [0.22, 1, 0.36, 1]
            }}
            className={cn(
              'w-full sm:w-full max-w-lg h-dvh sm:h-auto max-h-dvh sm:max-h-[85dvh] overflow-y-auto overscroll-contain bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none sm:rounded-[var(--radius-sheet)] p-4 sm:p-6 elevation-3 space-y-5',
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-3">
              <h2 id={labelledBy} className="type-card-title text-[var(--color-ink)] pt-1.5">
                {title}
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => onCloseRef.current()}
                aria-label="Close modal dialog"
                className="dmc-press min-w-[44px] min-h-[44px] w-11 h-11 rounded-[var(--radius-control)] flex items-center justify-center text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div>{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );

  return createPortal(dialogContent, document.body);
}

