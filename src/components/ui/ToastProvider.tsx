'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastTone = 'success' | 'warning' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
  action?: ToastAction;
}

interface ToastItem extends ToastInput {
  id: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (input: ToastInput) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { box: string; iconColor: string; Icon: typeof Info }> = {
  success: {
    box: 'bg-[var(--color-surface)] border-[var(--color-success-border)] text-[var(--color-ink)]',
    iconColor: 'text-[var(--color-success-ink)]',
    Icon: CheckCircle2
  },
  warning: {
    box: 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] text-[var(--color-ink)]',
    iconColor: 'text-[var(--color-warning-ink)]',
    Icon: AlertTriangle
  },
  error: {
    box: 'bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-danger-ink)]',
    iconColor: 'text-[var(--color-danger-ink)]',
    Icon: XCircle
  },
  info: {
    box: 'bg-[var(--color-surface)] border-[var(--color-border-strong)] text-[var(--color-ink)]',
    iconColor: 'text-[var(--color-brand-deep)]',
    Icon: Info
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prefersReduced = useReducedMotion();

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, tone = 'info', durationMs = 4500, action }: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const resolvedDuration = action && durationMs < 6500 ? 6500 : durationMs;
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, title, description, tone, durationMs: resolvedDuration, action }
      ]);

      if (resolvedDuration > 0 && typeof window !== 'undefined') {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, resolvedDuration);
      }
    },
    []
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const latest = toasts[toasts.length - 1];
        if (latest) dismissToast(latest.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toasts, dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm z-50 flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = TONE_STYLES[toast.tone];
            const IconComp = style.Icon;
            return (
              <m.div
                key={toast.id}
                role="status"
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
                transition={{
                  duration: prefersReduced ? 0.08 : 0.19,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className={`pointer-events-auto border rounded-xl p-3.5 elevation-3 flex items-start gap-2.5 text-xs ${style.box}`}
              >
                <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${style.iconColor}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-snug">{toast.title}</div>
                  {toast.description && (
                    <div className="mt-0.5 opacity-90 leading-relaxed">{toast.description}</div>
                  )}
                  {toast.action && (
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick();
                        dismissToast(toast.id);
                      }}
                      className="mt-1.5 inline-flex items-center min-h-[44px] sm:min-h-[36px] px-3 py-1 rounded-[var(--radius-control)] bg-[var(--color-action)] text-[var(--color-action-ink)] text-[11px] font-semibold hover:bg-[var(--color-action-hover)] transition-colors cursor-pointer"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismissToast(toast.id)}
                  className="dmc-press min-w-[44px] min-h-[44px] -mr-2 -my-2 flex items-center justify-center rounded-lg opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      dismissToast: () => {}
    };
  }
  return ctx;
}

