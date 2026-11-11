'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { DATA_ENDPOINTS, fetchStaticData } from '@/lib/data/client-fetch';
import type { DatasetManifest } from '@/lib/schemas';

export function ManifestHealthPanel() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [manifest, setManifest] = useState<DatasetManifest | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadManifest = useCallback(async (bypassCache = false) => {
    setStatus('loading');
    setErrorMsg('');
    const res = await fetchStaticData<DatasetManifest>(DATA_ENDPOINTS.manifest, { bypassCache });
    if (res.ok) {
      setManifest(res.data);
      setStatus('ok');
    } else {
      setErrorMsg(res.error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadManifest(false);
  }, [loadManifest]);

  return (
    <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 sm:p-5 elevation-1 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-bold uppercase tracking-wider text-[var(--dmc-ink-muted)]">
          Live Endpoint Probe (GET /data/v1/manifest.json)
        </div>
        <button
          type="button"
          onClick={() => void loadManifest(true)}
          className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-0 px-1 font-bold text-[var(--dmc-brand-forest)] hover:underline cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Re-check Now</span>
        </button>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-[var(--dmc-ink-secondary)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--dmc-brand-forest)]" aria-hidden="true" />
          <span>Checking live static data manifest...</span>
        </div>
      )}

      {status === 'ok' && manifest && (
        <div className="flex flex-wrap items-center gap-3 text-[var(--dmc-ink-primary)]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--dmc-status-verified-bg)] text-[var(--dmc-status-verified-ink)] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>HTTP 200 OK</span>
          </span>
          <span className="font-mono font-bold">Dataset: {manifest.datasetVersion}</span>
          <span className="text-[var(--dmc-ink-muted)]">
            Generated: {new Date(manifest.generatedAt).toUTCString()}
          </span>
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 bg-[var(--dmc-status-error-bg)] border border-[var(--dmc-status-error-border)] rounded-xl p-3 text-[var(--dmc-status-error-ink)]"
        >
          <div className="flex items-center gap-2 font-semibold">
            <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Manifest fetch failed: {errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadManifest(true)}
            className="inline-flex items-center min-h-[44px] sm:min-h-0 px-2 font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

