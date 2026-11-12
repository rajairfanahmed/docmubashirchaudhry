'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  FieldWrapper,
  SelectField,
  TextArea,
  TextInput
} from '@/components/ui/FormPrimitives';
import { Modal } from '@/components/ui/Modal';
import type { ContentLanguage, QuizRow, QuizType } from '@/lib/supabase/database.types';
import type { CreateQuizInput, UpdateQuizInput } from '@/lib/v3/types';

export interface QuizFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuiz: QuizRow | null;
  onSave: (payload: { mode: 'create'; data: CreateQuizInput } | { mode: 'edit'; id: string; data: UpdateQuizInput }) => Promise<void>;
}

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export function QuizFormModal({ isOpen, onClose, initialQuiz, onSave }: QuizFormModalProps) {
  const isEditing = Boolean(initialQuiz);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<QuizType>('practice');
  const [subject, setSubject] = useState('General Knowledge');
  const [examTag, setExamTag] = useState('PPSC');
  const [timeMinutes, setTimeMinutes] = useState('60');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkingValue, setNegativeMarkingValue] = useState('0.25');
  const [passPercentage, setPassPercentage] = useState('50');
  const [language, setLanguage] = useState<ContentLanguage>('en');
  const [isPublished, setIsPublished] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (initialQuiz) {
      setTitle(initialQuiz.title);
      setSlug(initialQuiz.slug);
      setSlugEditedManually(true);
      setDescription(initialQuiz.description ?? '');
      setType(initialQuiz.type);
      setSubject(initialQuiz.subject);
      setExamTag(initialQuiz.exam_tag);
      setTimeMinutes(
        initialQuiz.time_limit_seconds ? String(Math.round(initialQuiz.time_limit_seconds / 60)) : ''
      );
      setNegativeMarking(initialQuiz.negative_marking);
      setNegativeMarkingValue(String(initialQuiz.negative_marking_value || 0.25));
      setPassPercentage(String(initialQuiz.pass_percentage ?? 50));
      setLanguage(initialQuiz.language);
      setIsPublished(initialQuiz.is_published);
    } else {
      setTitle('');
      setSlug('');
      setSlugEditedManually(false);
      setDescription('');
      setType('practice');
      setSubject('General Knowledge');
      setExamTag('PPSC');
      setTimeMinutes('30');
      setNegativeMarking(false);
      setNegativeMarkingValue('0.25');
      setPassPercentage('50');
      setLanguage('en');
      setIsPublished(true);
    }
    setErrors({});
  }, [isOpen, initialQuiz]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !slugEditedManually) {
      setSlug(slugifyTitle(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (title.trim().length < 3) {
      nextErrors.title = 'Enter a quiz title of at least 3 characters.';
    }
    if (!isEditing && !/^[a-z0-9-]+$/.test(slug.trim())) {
      nextErrors.slug = 'Use lowercase letters, numbers, and hyphens only.';
    }
    if (!subject.trim()) {
      nextErrors.subject = 'Subject is required.';
    }
    if (!examTag.trim()) {
      nextErrors.examTag = 'Exam tag is required.';
    }

    const parsedMins = timeMinutes.trim() ? Number(timeMinutes) : null;
    if (type === 'mock' && (!parsedMins || !Number.isFinite(parsedMins) || parsedMins < 1)) {
      nextErrors.timeMinutes = 'Full-length mock exams require a duration of at least 1 minute.';
    } else if (parsedMins !== null && (!Number.isFinite(parsedMins) || parsedMins < 1)) {
      nextErrors.timeMinutes = 'Duration must be a positive number of minutes or blank.';
    }

    const parsedNeg = Number(negativeMarkingValue);
    if (negativeMarking && (!Number.isFinite(parsedNeg) || parsedNeg <= 0 || parsedNeg > 2)) {
      nextErrors.negativeMarkingValue = 'Enter a deduction between 0.05 and 2.00 per wrong answer.';
    }

    const parsedPass = Number(passPercentage);
    if (!Number.isFinite(parsedPass) || parsedPass < 1 || parsedPass > 100) {
      nextErrors.passPercentage = 'Pass percentage must be between 1 and 100.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const timeLimitSeconds =
        parsedMins && parsedMins > 0 ? Math.round(parsedMins * 60) : null;

      if (initialQuiz) {
        await onSave({
          mode: 'edit',
          id: initialQuiz.id,
          data: {
            title: title.trim(),
            description: description.trim(),
            type,
            subject: subject.trim(),
            examTag: examTag.trim(),
            timeLimitSeconds,
            negativeMarking,
            negativeMarkingValue: negativeMarking ? parsedNeg : 0,
            passPercentage: Math.round(parsedPass),
            language,
            isPublished
          }
        });
      } else {
        await onSave({
          mode: 'create',
          data: {
            slug: slug.trim(),
            title: title.trim(),
            description: description.trim(),
            type,
            subject: subject.trim(),
            examTag: examTag.trim(),
            timeLimitSeconds,
            negativeMarking,
            negativeMarkingValue: negativeMarking ? parsedNeg : 0,
            passPercentage: Math.round(parsedPass),
            language,
            isPublished
          }
        });
      }
      onClose();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Unable to save quiz configuration.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Quiz: ${initialQuiz?.title}` : 'Create New Quiz / Mock Exam'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form ? (
          <div
            role="alert"
            className="rounded-[var(--dmc-radius-squircle)] border border-[var(--dmc-status-error-border)] bg-[var(--dmc-status-error-bg)] px-3.5 py-2.5 text-xs font-semibold text-[var(--dmc-status-error-ink)]"
          >
            {errors.form}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper id="quiz-title" label="Quiz Title" required error={errors.title}>
            <TextInput
              id="quiz-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., PPSC 2026 Full Mock Exam 01"
              hasError={Boolean(errors.title)}
            />
          </FieldWrapper>

          <FieldWrapper
            id="quiz-slug"
            label="URL Slug"
            required={!isEditing}
            helperText={
              isEditing ? 'Slug is locked after creation' : 'Lowercase URL key under /quizzes/'
            }
            error={errors.slug}
          >
            <TextInput
              id="quiz-slug"
              value={slug}
              disabled={isEditing}
              onChange={(e) => {
                setSlugEditedManually(true);
                setSlug(e.target.value);
              }}
              placeholder="ppsc-2026-mock-01"
              hasError={Boolean(errors.slug)}
            />
          </FieldWrapper>
        </div>

        <FieldWrapper id="quiz-description" label="Short Description">
          <TextArea
            id="quiz-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Syllabus coverage, negative marking rules, and target exam..."
          />
        </FieldWrapper>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldWrapper id="quiz-type" label="Quiz Mode" required>
            <SelectField
              id="quiz-type"
              value={type}
              onChange={(e) => setType(e.target.value as QuizType)}
            >
              <option value="practice">Practice Quiz</option>
              <option value="mock">Full-Length Mock Exam</option>
            </SelectField>
          </FieldWrapper>

          <FieldWrapper id="quiz-subject" label="Subject" required error={errors.subject}>
            <TextInput
              id="quiz-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              hasError={Boolean(errors.subject)}
            />
          </FieldWrapper>

          <FieldWrapper id="quiz-exam-tag" label="Exam Tag" required error={errors.examTag}>
            <SelectField
              id="quiz-exam-tag"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldWrapper
            id="quiz-duration"
            label={type === 'mock' ? 'Duration (Minutes)' : 'Optional Timer (Minutes)'}
            required={type === 'mock'}
            error={errors.timeMinutes}
          >
            <TextInput
              id="quiz-duration"
              type="number"
              min={1}
              max={300}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(e.target.value)}
              placeholder={type === 'mock' ? '90' : 'Untimed'}
              hasError={Boolean(errors.timeMinutes)}
            />
          </FieldWrapper>

          <FieldWrapper id="quiz-language" label="Question Language" required>
            <SelectField
              id="quiz-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as ContentLanguage)}
            >
              <option value="en">English Only</option>
              <option value="ur">Urdu Only</option>
              <option value="bilingual">Bilingual (EN + UR)</option>
            </SelectField>
          </FieldWrapper>

          <FieldWrapper
            id="quiz-pass-pct"
            label="Pass Mark (%)"
            required
            error={errors.passPercentage}
          >
            <TextInput
              id="quiz-pass-pct"
              type="number"
              min={1}
              max={100}
              value={passPercentage}
              onChange={(e) => setPassPercentage(e.target.value)}
              hasError={Boolean(errors.passPercentage)}
            />
          </FieldWrapper>
        </div>

        <div className="rounded-[var(--dmc-radius-squircle)] border border-[var(--dmc-border-subtle)] bg-[var(--dmc-surface-ground)] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-[var(--dmc-ink-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--dmc-brand-forest)]"
              />
              <span>Enable negative marking per wrong answer</span>
            </label>

            {negativeMarking ? (
              <div className="w-44">
                <FieldWrapper
                  id="quiz-neg-val"
                  label="Deduction (pts)"
                  error={errors.negativeMarkingValue}
                >
                  <TextInput
                    id="quiz-neg-val"
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="2"
                    value={negativeMarkingValue}
                    onChange={(e) => setNegativeMarkingValue(e.target.value)}
                    hasError={Boolean(errors.negativeMarkingValue)}
                  />
                </FieldWrapper>
              </div>
            ) : null}
          </div>

          <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-[var(--dmc-ink-primary)] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--dmc-brand-forest)]"
            />
            <span>Publish immediately in public Quiz Catalog</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--dmc-border-subtle)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            {isEditing ? 'Save Changes' : 'Create Quiz'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
