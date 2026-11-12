'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  FieldWrapper,
  SelectField,
  TextArea,
  TextInput
} from '@/components/ui/FormPrimitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import type { QuizRow } from '@/lib/supabase/database.types';
import { v3Api } from '@/lib/v3/client';
import type { CreateQuestionInput } from '@/lib/v3/types';
import { cn } from '@/lib/utils';

export interface CsvQuestionImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: QuizRow[];
  onImported: () => Promise<void>;
}

const SAMPLE_CSV_HEADER =
  'subject,examTag,difficulty,language,textEn,textUr,optionA,optionB,optionC,optionD,correctOption,explanation';

export function CsvQuestionImporterModal({
  isOpen,
  onClose,
  quizzes,
  onImported
}: CsvQuestionImporterModalProps) {
  const { showToast } = useToast();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [quizId, setQuizId] = useState('');
  const [defaultSubject, setDefaultSubject] = useState('General Knowledge');
  const [defaultExamTag, setDefaultExamTag] = useState('PPSC');
  const [csvText, setCsvText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  const previewSummary = useMemo(() => {
    if (format === 'csv') {
      const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length <= 1) {
        return { count: 0, error: null, sampleRows: [] as string[] };
      }
      const dataLines = lines.slice(1);
      if (dataLines.length > 500) {
        return {
          count: dataLines.length,
          error: 'Maximum 500 rows can be imported in a single batch.',
          sampleRows: dataLines.slice(0, 3)
        };
      }
      return {
        count: dataLines.length,
        error: null,
        sampleRows: dataLines.slice(0, 4)
      };
    }

    if (!jsonText.trim()) {
      return { count: 0, error: null, sampleRows: [] as string[] };
    }
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        return {
          count: 0,
          error: 'JSON payload must be an array of question objects.',
          sampleRows: []
        };
      }
      if (parsed.length > 500) {
        return {
          count: parsed.length,
          error: 'Maximum 500 questions can be imported per batch.',
          sampleRows: []
        };
      }
      return {
        count: parsed.length,
        error: null,
        sampleRows: parsed.slice(0, 4).map((row, idx) => {
          const item = row as Record<string, unknown>;
          const label =
            typeof item.textEn === 'string'
              ? item.textEn
              : typeof item.textUr === 'string'
              ? item.textUr
              : `Question #${idx + 1}`;
          return label;
        })
      };
    } catch {
      return {
        count: 0,
        error: 'Invalid JSON syntax.',
        sampleRows: []
      };
    }
  }, [format, csvText, jsonText]);

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      setFormat('csv');
      setCsvText(text);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Unable to read selected CSV file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorDetails([]);

    if (previewSummary.error) {
      setErrorMsg(previewSummary.error);
      return;
    }
    if (previewSummary.count < 1) {
      setErrorMsg(
        format === 'csv'
          ? 'Paste CSV rows (including header) or upload a .csv file first.'
          : 'Paste a non-empty JSON array of questions first.'
      );
      return;
    }

    setSubmitting(true);
    try {
      let resultCount = 0;
      if (format === 'csv') {
        const res = await v3Api.admin.questions.bulkImport({
          format: 'csv',
          quizId: quizId || null,
          csv: csvText,
          defaultSubject: defaultSubject.trim() || undefined,
          defaultExamTag: defaultExamTag.trim() || undefined
        });
        resultCount = res.importedCount;
      } else {
        const parsed = JSON.parse(jsonText) as CreateQuestionInput[];
        const res = await v3Api.admin.questions.bulkImport({
          format: 'json',
          quizId: quizId || null,
          questions: parsed,
          defaultSubject: defaultSubject.trim() || undefined,
          defaultExamTag: defaultExamTag.trim() || undefined
        });
        resultCount = res.importedCount;
      }

      showToast({
        title: `Imported ${resultCount} question${resultCount === 1 ? '' : 's'}`,
        tone: 'success'
      });
      await onImported();
      setCsvText('');
      setJsonText('');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bulk import failed.');
      if (typeof err === 'object' && err !== null && 'details' in err) {
        const rawDetails = (err as { details?: unknown }).details;
        if (Array.isArray(rawDetails)) {
          const parsedDetails = rawDetails
            .map((item) => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item !== null) {
                const record = item as { path?: unknown; message?: unknown; row?: unknown };
                const msg = typeof record.message === 'string' ? record.message : null;
                const prefix =
                  typeof record.row === 'number'
                    ? `Row ${record.row}`
                    : typeof record.path === 'string' && record.path
                    ? record.path
                    : null;
                if (prefix && msg) return `${prefix}: ${msg}`;
                if (msg) return msg;
              }
              return null;
            })
            .filter((entry): entry is string => Boolean(entry));
          setErrorDetails(parsedDetails);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Questions (CSV / JSON)"
      className="max-w-2xl"
    >
      <form onSubmit={handleImport} className="space-y-4">
        <div
          role="tablist"
          aria-label="Import format"
          className="grid grid-cols-2 gap-1 rounded-[var(--dmc-radius-button)] bg-[var(--dmc-surface-ground)] p-1 border border-[var(--dmc-border-subtle)]"
        >
          {(['csv', 'json'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={format === tab}
              onClick={() => {
                setFormat(tab);
                setErrorMsg(null);
              }}
              className={cn(
                'min-h-[38px] rounded-[calc(var(--dmc-radius-button)-4px)] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors',
                format === tab
                  ? 'bg-[var(--dmc-surface-card)] text-[var(--dmc-brand-forest)] shadow-xs'
                  : 'text-[var(--dmc-ink-secondary)] hover:text-[var(--dmc-ink-primary)]'
              )}
            >
              {tab === 'csv' ? 'CSV File / Paste' : 'JSON Array'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FieldWrapper id="import-quiz-id" label="Assign to Quiz (Optional)">
            <SelectField
              id="import-quiz-id"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
            >
              <option value="">General Question Bank</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </SelectField>
          </FieldWrapper>

          <FieldWrapper id="import-default-subject" label="Fallback Subject">
            <TextInput
              id="import-default-subject"
              value={defaultSubject}
              onChange={(e) => setDefaultSubject(e.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper id="import-default-exam" label="Fallback Exam Tag">
            <TextInput
              id="import-default-exam"
              value={defaultExamTag}
              onChange={(e) => setDefaultExamTag(e.target.value)}
            />
          </FieldWrapper>
        </div>

        {format === 'csv' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--dmc-radius-squircle)] border border-dashed border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-ground)] p-3">
              <div className="flex items-center gap-2 text-xs text-[var(--dmc-ink-secondary)]">
                <FileSpreadsheet
                  className="w-4 h-4 text-[var(--dmc-brand-forest)] shrink-0"
                  aria-hidden="true"
                />
                <span>Upload UTF-8 CSV (up to 500 questions per batch)</span>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--dmc-radius-button)] border border-[var(--dmc-border-strong)] bg-[var(--dmc-surface-card)] text-xs font-bold text-[var(--dmc-brand-forest)] cursor-pointer hover:bg-[var(--dmc-surface-mint-wash)]">
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Choose .CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <FieldWrapper
              id="import-csv-text"
              label="CSV Content"
              helperText={`Expected columns: ${SAMPLE_CSV_HEADER}`}
            >
              <TextArea
                id="import-csv-text"
                rows={7}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`${SAMPLE_CSV_HEADER}\nGeography,PPSC,medium,en,"Which pass connects Chitral with Afghanistan?",,Dorah Pass,Bolan Pass,Khyber Pass,Lowari Pass,A,"Dorah Pass links Chitral to Badakhshan."`}
                className="font-mono text-xs"
              />
            </FieldWrapper>
          </div>
        ) : (
          <FieldWrapper
            id="import-json-text"
            label="JSON Questions Array"
            helperText="Array of CreateQuestionInput objects ({ subject, examTag, textEn, textUr, options, correctOption, explanation })"
          >
            <TextArea
              id="import-json-text"
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"subject":"Geography","examTag":"PPSC","difficulty":"medium","language":"en","textEn":"Highest peak of Pakistan?","options":[{"key":"A","textEn":"K2"},{"key":"B","textEn":"Nanga Parbat"}],"correctOption":"A","explanation":"K2 is 8,611m."}]'
              className="font-mono text-xs"
            />
          </FieldWrapper>
        )}

        {previewSummary.count > 0 && !previewSummary.error ? (
          <div className="rounded-[var(--dmc-radius-squircle)] border border-[var(--dmc-status-verified-border)]/50 bg-[var(--dmc-status-verified-bg)] p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--dmc-status-verified-ink)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Ready to import {previewSummary.count} rows</span>
            </div>
            {previewSummary.sampleRows.length > 0 ? (
              <ul className="text-[11px] text-[var(--dmc-ink-secondary)] list-disc pl-5 space-y-0.5">
                {previewSummary.sampleRows.map((sample, idx) => (
                  <li key={idx} className="truncate">
                    {sample}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {errorMsg || previewSummary.error ? (
          <div
            role="alert"
            className="rounded-[var(--radius-control)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3.5 py-2.5 text-xs font-semibold text-[var(--color-danger-ink)] space-y-1.5"
          >
            <div>{errorMsg || previewSummary.error}</div>
            {errorDetails.length > 0 && (
              <ul className="list-disc pl-5 font-normal space-y-0.5 max-h-36 overflow-y-auto">
                {errorDetails.slice(0, 12).map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
                {errorDetails.length > 12 && (
                  <li>...and {errorDetails.length - 12} more row issues.</li>
                )}
              </ul>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--dmc-border-subtle)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            Import Questions
          </Button>
        </div>
      </form>
    </Modal>
  );
}
