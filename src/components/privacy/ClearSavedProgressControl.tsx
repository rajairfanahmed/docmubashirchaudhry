'use client';

import React, { useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { clearAllPortalProgress } from '@/lib/storage/persistence';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui/Button';

export function ClearSavedProgressControl() {
  const [cleared, setCleared] = useState(false);
  const { showToast } = useToast();

  const handleClearAll = () => {
    clearAllPortalProgress();
    setCleared(true);
    showToast({
      tone: 'success',
      title: 'Saved progress cleared',
      description: 'Removed saved World Geography and MCQ practice data from this browser.'
    });
  };

  return (
    <div className="pt-2 flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" size="md" onClick={handleClearAll}>
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Clear My Saved Quiz Progress</span>
      </Button>

      {cleared && (
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--dmc-status-verified-ink)]"
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          <span>Local quiz progress cleared on this browser.</span>
        </span>
      )}
    </div>
  );
}

