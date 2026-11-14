'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  FileSpreadsheet,
  HelpCircle,
  Languages,
  Plus,
  PlusCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { CsvQuestionImporterModal } from '@/components/admin/CsvQuestionImporterModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import {
  FieldWrapper,
  SelectField,
  SkeletonBlock,
  TextArea,
  TextInput
} from '@/components/ui/FormPrimitives';
import { Modal } from '@/components/ui/Modal';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  ContentLanguage,
  QuestionDifficulty,
  QuizQuestionOptionRow,
  QuizQuestionRow,
  QuizRow
} from '@/lib/supabase/database.types';
import { v3Api } from '@/lib/v3/client';
import type { AdminQuestionInventoryResponse } from '@/lib/v3/types';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const CANONICAL_SUBJECTS = [
  'General Knowledge & World Geography',
  'Pakistan Affairs & History',
  'Islamic Studies & Ethics',
  'Everyday Science',
  'English Grammar & Vocabulary',
  'Urdu Literature & Grammar',
  'Basic Mathematics & Mental Ability',
  'Basic Computer Studies & IT',
  'Sports & Physical Education'
] as const;

function createDefaultOptions(): QuizQuestionOptionRow[] {
  return [
    { key: 'A', textEn: '', textUr: '' },
    { key: 'B', textEn: '', textUr: '' },
    { key: 'C', textEn: '', textUr: '' },
    { key: 'D', textEn: '', textUr: '' }
  ];
}

export function AdminQuestionsClient() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [filterQuizId, setFilterQuizId] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'' | QuestionDifficulty>('');

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [inventory, setInventory] = useState<AdminQuestionInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [importerOpen, setImporterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuizQuestionRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Authoring panel state (Create or Edit)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestionRow | null>(null);
  const [quizId, setQuizId] = useState('');
  const [subject, setSubject] = useState('General Knowledge');
  const [examTag, setExamTag] = useState('PPSC');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [language, setLanguage] = useState<ContentLanguage>('bilingual');
  const [textEn, setTextEn] = useState('');
  const [textUr, setTextUr] = useState('');
  const [options, setOptions] = useState<QuizQuestionOptionRow[]>(createDefaultOptions);
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setEditingQuestion(null);
    setQuizId('');
    setSubject('General Knowledge');
    setExamTag('PPSC');
    setDifficulty('medium');
    setLanguage('bilingual');
    setTextEn('');
    setTextUr('');
    setOptions(createDefaultOptions());
    setCorrectOption('A');
    setExplanation('');
    setFormErrors({});
  }, []);

  const populateForEdit = (q: QuizQuestionRow) => {
    setEditingQuestion(q);
    setQuizId(q.quiz_id ?? '');
    setSubject(q.subject);
    setExamTag(q.exam_tag);
    setDifficulty(q.difficulty);
    setLanguage(q.language);
    setTextEn(q.text_en ?? '');
    setTextUr(q.text_ur ?? '');
    setOptions(
      q.options && q.options.length >= 2
        ? q.options.map((opt) => ({
            key: opt.key,
            textEn: opt.textEn ?? '',
            textUr: opt.textUr ?? ''
          }))
        : createDefaultOptions()
    );
    setCorrectOption(q.correct_option || 'A');
    setExplanation(q.explanation ?? '');
    setFormErrors({});
  };

  const fetchQuestions = useCallback(
    async (targetPage: number, signal?: AbortSignal) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [qRes, quizRes] = await Promise.all([
          v3Api.admin.questions.list(
            {
              page: targetPage,
              pageSize,
              quizId: filterQuizId || undefined,
              subject: filterSubject.trim() || undefined,
              difficulty: filterDifficulty || undefined
            },
            signal
          ),
          v3Api.admin.quizzes.list({ page: 1, pageSize: 50 }, signal)
        ]);
        setInventory(qRes);
        setQuizzes(quizRes.items);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load question bank.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize, filterQuizId, filterSubject, filterDifficulty]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchQuestions(page, controller.signal);
    return () => controller.abort();
  }, [page, fetchQuestions]);

  const handleOptionChange = (
    idx: number,
    field: 'textEn' | 'textUr',
    value: string
  ) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, [field]: value } : opt))
    );
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      return;
    }
    const nextKey = OPTION_KEYS[options.length] ?? String.fromCharCode(65 + options.length);
    setOptions((prev) => [...prev, { key: nextKey, textEn: '', textUr: '' }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) {
      return;
    }
    const next = options
      .filter((_, i) => i !== idx)
      .map((opt, i) => ({ ...opt, key: OPTION_KEYS[i] ?? opt.key }));
    setOptions(next);
    if (!next.some((o) => o.key === correctOption)) {
      setCorrectOption(next[0].key);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!subject.trim()) {
      errs.subject = 'Subject is required.';
    }
    if (!examTag.trim()) {
      errs.examTag = 'Exam tag is required.';
    }
    if ((language === 'en' || language === 'bilingual') && !textEn.trim()) {
      errs.textEn = 'English question stem is required.';
    }
    if ((language === 'ur' || language === 'bilingual') && !textUr.trim()) {
      errs.textUr = 'Urdu question stem is required.';
    }

    const sanitizedOptions: QuizQuestionOptionRow[] = options.map((opt) => ({
      key: opt.key,
      textEn: opt.textEn?.trim() || null,
      textUr: opt.textUr?.trim() || null
    }));

    const hasMissingOption = sanitizedOptions.some((opt) => !opt.textEn && !opt.textUr);
    if (hasMissingOption) {
      errs.options = 'Fill in text for all visible options (at least 2 options required).';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        quizId: quizId || null,
        subject: subject.trim(),
        examTag: examTag.trim(),
        difficulty,
        language,
        textEn: textEn.trim() || null,
        textUr: textUr.trim() || null,
        options: sanitizedOptions,
        correctOption,
        explanation: explanation.trim()
      };

      if (editingQuestion) {
        await v3Api.admin.questions.update(editingQuestion.id, payload);
        showToast({ title: 'Question updated', tone: 'success' });
      } else {
        await v3Api.admin.questions.create(payload);
        showToast({ title: 'Question created', tone: 'success' });
      }

      resetForm();
      await fetchQuestions(page);
    } catch (err) {
      setFormErrors({
        form: err instanceof Error ? err.message : 'Unable to save question.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await v3Api.admin.questions.remove(deleteTarget.id);
      showToast({ title: 'Question deleted', tone: 'info' });
      if (editingQuestion?.id === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      await fetchQuestions(page);
    } catch (err) {
      showToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete question.',
        tone: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const showEn = language === 'en' || language === 'bilingual';
  const showUr = language === 'ur' || language === 'bilingual';
  const questions = inventory?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setImporterOpen(true)}
        >
          <FileSpreadsheet className="w-4 h-4 text-[var(--dmc-brand-forest)]" aria-hidden="true" />
          <span>CSV / JSON Import</span>
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={resetForm}
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>New Blank MCQ</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-4 elevation-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FieldWrapper id="filter-quiz" label="Filter by Quiz">
          <SelectField
            id="filter-quiz"
            value={filterQuizId}
            onChange={(e) => {
              setFilterQuizId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Quizzes &amp; Bank</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </SelectField>
        </FieldWrapper>

        <FieldWrapper id="filter-subject" label="Subject Filter">
          <SelectField
            id="filter-subject"
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All 9 Official Subjects</option>
            {CANONICAL_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
        </FieldWrapper>

        <FieldWrapper id="filter-difficulty" label="Difficulty">
          <SelectField
            id="filter-difficulty"
            value={filterDifficulty}
            onChange={(e) => {
              setFilterDifficulty(e.target.value as '' | QuestionDifficulty);
              setPage(1);
            }}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </SelectField>
        </FieldWrapper>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Question Bank List */}
        <div className="xl:col-span-7 space-y-4">
          {errorMsg ? (
            <div
              role="alert"
              className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-status-error-border)] rounded-[var(--dmc-radius-card)] p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[var(--dmc-status-error-ink)] shrink-0" />
                <p className="text-xs text-[var(--dmc-ink-secondary)]">{errorMsg}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchQuestions(page)}
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry</span>
              </Button>
            </div>
          ) : loading && !inventory ? (
            <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-6 space-y-3">
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          ) : questions.length === 0 ? (
            <EmptyStateCard
              icon={HelpCircle}
              title="No questions match these filters"
              description="Author a single bilingual MCQ using the panel or upload a spreadsheet batch via CSV / JSON Import."
            />
          ) : (
            <div className="bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] overflow-hidden elevation-1">
              <div className="px-5 py-4 border-b border-[var(--dmc-border-subtle)] flex items-center justify-between gap-2">
                <h2 className="type-card-title text-[var(--dmc-ink-primary)]">
                  Authored MCQs ({inventory?.pagination.totalItems ?? questions.length})
                </h2>
                <HelpCircle className="w-4 h-4 text-[var(--dmc-ink-muted)]" aria-hidden="true" />
              </div>

              <ul className="divide-y divide-[var(--dmc-border-subtle)]">
                {questions.map((q) => (
                  <li key={q.id} className="p-4 sm:p-5 space-y-2.5 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <Badge variant="feature">{q.subject}</Badge>
                        <Badge variant="neutral">{q.exam_tag}</Badge>
                        <Badge variant="neutral">{q.difficulty}</Badge>
                        <Badge variant="verified">Key: {q.correct_option}</Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => populateForEdit(q)}
                          aria-label="Edit question"
                          className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-lg text-[var(--dmc-ink-secondary)] hover:bg-[var(--dmc-surface-muted)] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(q)}
                          aria-label="Delete question"
                          className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-lg text-[var(--dmc-status-error-ink)] hover:bg-[var(--dmc-status-error-bg)] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {q.text_en ? (
                      <p dir="ltr" className="text-sm font-semibold text-[var(--dmc-ink-primary)] break-words">
                        {q.text_en}
                      </p>
                    ) : null}
                    {q.text_ur ? (
                      <p
                        lang="ur"
                        dir="rtl"
                        className="type-urdu text-sm font-semibold text-[var(--dmc-ink-secondary)] break-words"
                      >
                        {q.text_ur}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[var(--dmc-ink-secondary)]">
                      {q.options.map((opt) => (
                        <div
                          key={opt.key}
                          className="min-w-0 break-words rounded-lg border border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-ground)] px-2.5 py-1.5"
                        >
                          <strong className="text-[var(--dmc-brand-forest)]">{opt.key}.</strong>{' '}
                          {opt.textEn || opt.textUr}
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <PaginationBar
            page={page}
            totalPages={inventory?.pagination.totalPages ?? 1}
            totalItems={inventory?.pagination.totalItems ?? questions.length}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="questions"
          />
        </div>

        {/* Right: Bilingual English LTR + Urdu RTL Authoring Panel */}
        <aside className="xl:col-span-5 bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] rounded-[var(--dmc-radius-card)] p-5 elevation-1 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="type-card-title text-[var(--dmc-ink-primary)]">
              {editingQuestion ? 'Edit Question' : 'Author New Question'}
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-forest)] bg-[var(--dmc-surface-mint-wash)] px-2.5 py-0.5 rounded-full">
              <Languages className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{language.toUpperCase()}</span>
            </span>
          </div>

          <form onSubmit={handleSaveQuestion} className="space-y-3.5">
            {formErrors.form ? (
              <div
                role="alert"
                className="rounded-[var(--dmc-radius-squircle)] border border-[var(--dmc-status-error-border)] bg-[var(--dmc-status-error-bg)] px-3 py-2 text-xs font-semibold text-[var(--dmc-status-error-ink)]"
              >
                {formErrors.form}
              </div>
            ) : null}

            <FieldWrapper id="q-quiz" label="Linked Quiz (Optional)">
              <SelectField id="q-quiz" value={quizId} onChange={(e) => setQuizId(e.target.value)}>
                <option value="">Unlinked / Subject Bank</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </SelectField>
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper id="q-subject" label="Subject" required error={formErrors.subject}>
                <SelectField
                  id="q-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  hasError={Boolean(formErrors.subject)}
                >
                  {CANONICAL_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {subject &&
                  !CANONICAL_SUBJECTS.includes(subject as (typeof CANONICAL_SUBJECTS)[number]) ? (
                    <option value={subject}>{subject}</option>
                  ) : null}
                </SelectField>
              </FieldWrapper>
              <FieldWrapper id="q-exam" label="Exam Tag" required error={formErrors.examTag}>
                <SelectField
                  id="q-exam"
                  value={examTag}
                  onChange={(e) => setExamTag(e.target.value)}
                >
                  <option value="PPSC">PPSC</option>
                  <option value="FPSC">FPSC</option>
                  <option value="CSS">CSS</option>
                  <option value="PMS">PMS</option>
                  <option value="FIA">FIA</option>
                  <option value="PERA">PERA</option>
                  <option value="General">General</option>
                </SelectField>
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper id="q-language" label="Language Mode" required>
                <SelectField
                  id="q-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ContentLanguage)}
                >
                  <option value="bilingual">Bilingual (EN + UR)</option>
                  <option value="en">English Only</option>
                  <option value="ur">Urdu Only</option>
                </SelectField>
              </FieldWrapper>

              <FieldWrapper id="q-difficulty" label="Difficulty">
                <SelectField
                  id="q-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </SelectField>
              </FieldWrapper>
            </div>

            {showEn ? (
              <FieldWrapper
                id="q-stem-en"
                label="English Stem (LTR)"
                required
                error={formErrors.textEn}
              >
                <TextArea
                  id="q-stem-en"
                  rows={2}
                  dir="ltr"
                  value={textEn}
                  onChange={(e) => setTextEn(e.target.value)}
                  placeholder="Enter question statement in English..."
                  hasError={Boolean(formErrors.textEn)}
                />
              </FieldWrapper>
            ) : null}

            {showUr ? (
              <FieldWrapper
                id="q-stem-ur"
                label="Urdu Stem (RTL)"
                required
                error={formErrors.textUr}
              >
                <TextArea
                  id="q-stem-ur"
                  rows={2}
                  lang="ur"
                  dir="rtl"
                  value={textUr}
                  onChange={(e) => setTextUr(e.target.value)}
                  placeholder="سوال اردو میں درج کریں..."
                  className="type-urdu text-right"
                  hasError={Boolean(formErrors.textUr)}
                />
              </FieldWrapper>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--dmc-ink-primary)]">
                  Answer Options ({options.length}/6)
                </span>
                {options.length < 6 ? (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--dmc-brand-forest)] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Option</span>
                  </button>
                ) : null}
              </div>

              {formErrors.options ? (
                <p role="alert" className="text-xs font-semibold text-[var(--dmc-status-error-ink)]">
                  {formErrors.options}
                </p>
              ) : null}

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <div
                    key={opt.key}
                    className="rounded-[var(--dmc-radius-squircle)] border border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-ground)] p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--dmc-brand-forest)] cursor-pointer">
                        <input
                          type="radio"
                          name="correct-option-key"
                          value={opt.key}
                          checked={correctOption === opt.key}
                          onChange={() => setCorrectOption(opt.key)}
                          className="accent-[var(--dmc-brand-forest)]"
                        />
                        <span>Option {opt.key} (Mark Correct)</span>
                      </label>
                      {options.length > 2 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          aria-label={`Remove option ${opt.key}`}
                          className="text-xs text-[var(--dmc-status-error-ink)] hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {showEn ? (
                      <TextInput
                        dir="ltr"
                        aria-label={`Option ${opt.key} English`}
                        value={opt.textEn ?? ''}
                        onChange={(e) => handleOptionChange(idx, 'textEn', e.target.value)}
                        placeholder={`Option ${opt.key} in English`}
                      />
                    ) : null}
                    {showUr ? (
                      <TextInput
                        lang="ur"
                        dir="rtl"
                        aria-label={`Option ${opt.key} Urdu`}
                        value={opt.textUr ?? ''}
                        onChange={(e) => handleOptionChange(idx, 'textUr', e.target.value)}
                        placeholder={`آپشن ${opt.key} اردو میں`}
                        className="type-urdu text-right"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <FieldWrapper id="q-explanation" label="Explanation Note (Shown in Review)">
              <TextArea
                id="q-explanation"
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Brief factual explanation for students after answering..."
              />
            </FieldWrapper>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--dmc-border-subtle)]">
              {editingQuestion ? (
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel Edit
                </Button>
              ) : null}
              <Button type="submit" variant="primary" size="md" isLoading={saving}>
                {editingQuestion ? 'Save Question' : 'Add Question'}
              </Button>
            </div>
          </form>
        </aside>
      </div>

      <CsvQuestionImporterModal
        isOpen={importerOpen}
        onClose={() => setImporterOpen(false)}
        quizzes={quizzes}
        onImported={() => fetchQuestions(1)}
      />

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Question?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--dmc-ink-secondary)]">
            Are you sure you want to permanently remove this question from the question bank?
          </p>
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleting}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
