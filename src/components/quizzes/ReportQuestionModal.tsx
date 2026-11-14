'use client';

import React, { useState } from 'react';
import { AlertCircle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { isV3ClientError, v3Api } from '@/lib/v3/client';

export interface ReportQuestionModalProps {
  isOpen: boolean;
  questionId: string;
  questionStem?: string;
  onClose: () => void;
}

export function ReportQuestionModal({
  isOpen,
  questionId,
  questionStem,
  onClose
}: ReportQuestionModalProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setErrorMessage('Please describe the error in at least 5 characters.');
      return;
    }
    if (trimmed.length > 500) {
      setErrorMessage('Report description must be under 500 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await v3Api.questionReports.create({
        questionId,
        message: trimmed
      });
      showToast({
        title: 'Report Submitted',
        description: 'Thank you for helping keep our exam question bank accurate.',
        tone: 'success'
      });
      setReason('');
      onClose();
    } catch (err) {
      if (isV3ClientError(err)) {
        if (err.status === 429) {
          setErrorMessage('You have reached the limit of 5 reports per hour. Please try again later.');
          return;
        }
        if (err.status === 401) {
          setErrorMessage('You must be signed in to flag question errors.');
          return;
        }
        setErrorMessage(err.message);
        return;
      }
      setErrorMessage('Unable to submit report right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Question Error"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <p className="text-xs text-[var(--color-ink-secondary)]">
          Help us maintain academic precision by flagging erroneous keys, typo errors, or unclear stems.
        </p>
        {questionStem && (
          <div className="p-3 rounded-[var(--radius-control)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs text-[var(--color-ink-secondary)] line-clamp-3">
            <span className="font-semibold text-[var(--color-ink)] block mb-0.5">
              Question:
            </span>
            {questionStem}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="report-reason" className="text-xs font-semibold text-[var(--color-ink)]">
            What is the issue with this question? (5 to 500 characters)
          </label>
          <textarea
            id="report-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="e.g. Option B is marked correct, but official gazette specifies Option C."
            className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-deep)] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between text-[11px] text-[var(--color-ink-muted)]">
            <span>Minimum 5 characters</span>
            <span>{reason.length}/500</span>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-control)] bg-red-50 text-red-800 text-xs border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={reason.trim().length < 5}
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
