'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
    box: 'bg-[var(--dmc-surface-card)] border-[var(--dmc-status-verified-border)] text-[var(--dmc-ink-primary)]',
    iconColor: 'text-[var(--dmc-status-verified-ink)]',
    Icon: CheckCircle2
  },
  warning: {
    box: 'bg-[var(--dmc-status-unverified-bg)] border-[var(--dmc-status-unverified-border)] text-[var(--dmc-ink-primary)]',
    iconColor: 'text-[var(--dmc-status-unverified-ink)]',
    Icon: AlertTriangle
  },
  error: {
    box: 'bg-[var(--dmc-status-error-bg)] border-[var(--dmc-status-error-border)] text-[var(--dmc-status-error-ink)]',
    iconColor: 'text-[var(--dmc-status-error-ink)]',
    Icon: XCircle
  },
  info: {
    box: 'bg-[var(--dmc-surface-card)] border-[var(--dmc-border-strong)] text-[var(--dmc-ink-primary)]',
    iconColor: 'text-[var(--dmc-brand-forest)]',
    Icon: Info
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
        {toasts.map((toast) => {
          const style = TONE_STYLES[toast.tone];
          const IconComp = style.Icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={`dmc-toast-enter pointer-events-auto border rounded-xl p-3.5 elevation-3 flex items-start gap-2.5 text-xs ${style.box}`}
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
                    className="mt-1.5 inline-flex items-center min-h-[44px] sm:min-h-[36px] px-3 py-1 rounded-lg bg-[var(--dmc-brand-forest)] text-white text-[11px] font-bold hover:bg-[var(--dmc-brand-emerald)] transition-colors cursor-pointer"
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
            </div>
          );
        })}
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

