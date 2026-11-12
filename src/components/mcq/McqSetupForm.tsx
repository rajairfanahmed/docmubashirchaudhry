'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Filter, PlayCircle, RotateCcw } from 'lucide-react';
import type { Exam, Question, RecruitmentPost, Subject, Topic } from '@/lib/schemas';
import { notifyNavigationStart } from '@/lib/motion/navigation-events';
import { buildPaginatedSearchParams, parsePageParam, resetPageOnFilterChange } from '@/lib/pagination';
import { SubjectIconChip } from '@/components/branding/SubjectIconChip';
import { Button } from '@/components/ui/Button';
import { McqQuestionsPreviewList } from './McqQuestionsPreviewList';

export interface McqSetupFormProps {
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  posts?: RecruitmentPost[];
  initialExamSlug?: string;
  initialSubjectSlug?: string;
}

export function McqSetupForm({
  exams,
  subjects,
  topics,
  questions,
  posts = [],
  initialExamSlug = '',
  initialSubjectSlug = ''
}: McqSetupFormProps) {
  const router = useRouter();
  const [selectedExamSlug, setSelectedExamSlug] = useState(initialExamSlug);
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState(initialSubjectSlug);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const examParam = sp.get('exam');
    const subjectParam = sp.get('subject');
    const topicParam = sp.get('topic');
    if (examParam && exams.some((e) => e.slug === examParam)) {
      setSelectedExamSlug(examParam);
    }
    if (subjectParam && subjects.some((s) => s.slug === subjectParam)) {
      setSelectedSubjectSlug(subjectParam);
    }
    if (topicParam && topics.some((t) => t.slug === topicParam)) {
      setSelectedTopicSlug(topicParam);
    }
    setCurrentPage(parsePageParam(sp.get('page'), 1));
  }, [exams, subjects, topics]);

  const syncMcqUrl = useCallback(
    (examSlug: string, subjectSlug: string, topicSlug: string, nextPage: number) => {
      if (typeof window === 'undefined') return;
      const updated = resetPageOnFilterChange(window.location.search, {
        exam: examSlug || undefined,
        subject: subjectSlug || undefined,
        topic: topicSlug || undefined
      });
      const withPage = buildPaginatedSearchParams(updated, nextPage);
      const qs = withPage.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    },
    []
  );

  const selectedExam = useMemo(
    () => exams.find((e) => e.slug === selectedExamSlug),
    [exams, selectedExamSlug]
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.slug === selectedSubjectSlug),
    [subjects, selectedSubjectSlug]
  );

  const selectedTopic = useMemo(
    () => topics.find((t) => t.slug === selectedTopicSlug),
    [topics, selectedTopicSlug]
  );

  const visibleTopics = useMemo(() => {
    if (!selectedSubject) return topics;
    return topics.filter((t) => t.subjectId === selectedSubject.id);
  }, [topics, selectedSubject]);

  const examPostSet = useMemo(() => {
    if (!selectedExam) return null;
    if (posts.length > 0) {
      return new Set(posts.filter((p) => p.examId === selectedExam.id).map((p) => p.id));
    }
    return null;
  }, [selectedExam, posts]);

  const examScopedQuestions = useMemo(() => {
    if (!selectedExam) return questions;
    return questions.filter((q) => {
      if (examPostSet) {
        return q.postIds.some((pid) => examPostSet.has(pid));
      }
      return q.postIds.some((pid) => pid.includes(selectedExam.slug));
    });
  }, [questions, selectedExam, examPostSet]);

  const countsBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    const topicToSubject = new Map(topics.map((t) => [t.id, t.subjectId]));
    for (const q of examScopedQuestions) {
      const seenSubjects = new Set<string>();
      for (const tid of q.topicIds) {
        const sid = topicToSubject.get(tid);
        if (sid && !seenSubjects.has(sid)) {
          seenSubjects.add(sid);
          counts[sid] = (counts[sid] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [examScopedQuestions, topics]);

  const matchingQuestions = useMemo(() => {
    const subjectTopicIds = selectedSubject
      ? new Set(topics.filter((t) => t.subjectId === selectedSubject.id).map((t) => t.id))
      : null;

    return examScopedQuestions.filter((q) => {
      if (selectedTopic && !q.topicIds.includes(selectedTopic.id)) return false;
      if (subjectTopicIds && !q.topicIds.some((tid) => subjectTopicIds.has(tid))) return false;
      return true;
    });
  }, [examScopedQuestions, topics, selectedSubject, selectedTopic]);

  const matchingQuestionsCount = matchingQuestions.length;

  const handleExamChange = (slug: string) => {
    setSelectedExamSlug(slug);
    setCurrentPage(1);
    syncMcqUrl(slug, selectedSubjectSlug, selectedTopicSlug, 1);
  };

  const handleSubjectChange = (slug: string) => {
    setSelectedSubjectSlug(slug);
    setSelectedTopicSlug('');
    setCurrentPage(1);
    syncMcqUrl(selectedExamSlug, slug, '', 1);
  };

  const handleTopicChange = (slug: string) => {
    setSelectedTopicSlug(slug);
    setCurrentPage(1);
    syncMcqUrl(selectedExamSlug, selectedSubjectSlug, slug, 1);
  };

  const resetFilters = () => {
    setSelectedExamSlug('');
    setSelectedSubjectSlug('');
    setSelectedTopicSlug('');
    setCurrentPage(1);
    syncMcqUrl('', '', '', 1);
  };

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage);
    syncMcqUrl(selectedExamSlug, selectedSubjectSlug, selectedTopicSlug, nextPage);
  };

  const practiceHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedExamSlug) params.set('exam', selectedExamSlug);
    if (selectedSubjectSlug) params.set('subject', selectedSubjectSlug);
    if (selectedTopicSlug) params.set('topic', selectedTopicSlug);
    const qs = params.toString();
    return qs ? `/mcq/practice?${qs}` : '/mcq/practice';
  }, [selectedExamSlug, selectedSubjectSlug, selectedTopicSlug]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (matchingQuestionsCount === 0) return;
    notifyNavigationStart();
    router.push(practiceHref);
  };

  return (
    <div className="space-y-6">
      <form
        action="/mcq/practice"
        method="GET"
        onSubmit={handleSubmit}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-4 sm:p-5 lg:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
            <Filter className="w-3.5 h-3.5 text-[var(--color-brand-deep)]" aria-hidden="true" />
            <span>Configure MCQ Session</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedSubject && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs text-[var(--color-ink)]">
                <SubjectIconChip subjectId={selectedSubject.id} label={selectedSubject.name} size="sm" />
              </span>
            )}
            <span
              aria-live="polite"
              className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-ink)] tabular-nums"
            >
              Available MCQs: {matchingQuestionsCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="mcq-setup-exam" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              Exam Body
            </label>
            <select
              id="mcq-setup-exam"
              name="exam"
              value={selectedExamSlug}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full h-11 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]"
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.slug}>
                  {exam.bodyCode} - {exam.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mcq-setup-subject" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              Subject
            </label>
            <select
              id="mcq-setup-subject"
              name="subject"
              value={selectedSubjectSlug}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full h-11 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]"
            >
              <option value="">All Subjects</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.slug}>
                  {subj.name} ({countsBySubject[subj.id] ?? 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mcq-setup-topic" className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              Topic
            </label>
            <select
              id="mcq-setup-topic"
              name="topic"
              value={selectedTopicSlug}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="w-full h-11 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)]"
            >
              <option value="">All Topics ({visibleTopics.length})</option>
              {visibleTopics.map((topic) => (
                <option key={topic.id} value={topic.slug}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={matchingQuestionsCount === 0}
            className="w-full"
          >
            <PlayCircle className="w-4 h-4" aria-hidden="true" />
            <span>Start Practice ({matchingQuestionsCount})</span>
          </Button>
        </div>

        {/* Semantic Subject Quick-Filter Bar */}
        <div
          role="group"
          aria-label="Filter preview by subject"
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border)]"
        >
          <button
            type="button"
            aria-pressed={selectedSubjectSlug === ''}
            onClick={() => handleSubjectChange('')}
            className={`dmc-press inline-flex items-center min-h-[44px] sm:min-h-[40px] max-w-full px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] ${
              selectedSubjectSlug === ''
                ? 'bg-[var(--color-action)] text-[var(--color-action-ink)] border-[var(--color-action)]'
                : 'bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]'
            }`}
          >
            All ({examScopedQuestions.length})
          </button>
          {subjects.map((subj) => {
            const count = countsBySubject[subj.id] ?? 0;
            const active = selectedSubjectSlug === subj.slug;
            return (
              <button
                key={subj.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSubjectChange(active ? '' : subj.slug)}
                className={`dmc-press inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[40px] min-w-0 max-w-full px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-[var(--color-brand-deep)] ${
                  active
                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border-[var(--color-success-border)] font-semibold'
                    : 'bg-[var(--color-surface)] text-[var(--color-ink-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]'
                }`}
              >
                <SubjectIconChip subjectId={subj.id} label={`${subj.name} (${count})`} size="sm" inheritColor={active} />
              </button>
            );
          })}
        </div>

        {matchingQuestionsCount === 0 && (
          <div
            role="status"
            className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-[var(--radius-panel)] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-warning-ink)]"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-[var(--color-warning-ink)] shrink-0" aria-hidden="true" />
              <span>No published MCQs match this filter combination yet. Reset filters or try World Geography Quiz.</span>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 min-h-[44px] px-2 font-semibold underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
              <Link
                href="/geography#quiz-module"
                className="inline-flex items-center min-h-[44px] px-2 font-semibold text-[var(--color-brand-deep)] underline"
              >
                Geography Quiz
              </Link>
            </div>
          </div>
        )}
      </form>

      <McqQuestionsPreviewList
        questions={matchingQuestions}
        subjects={subjects}
        topics={topics}
        examId={selectedExam?.id}
        subjectId={selectedSubject?.id}
        topicIds={selectedTopic ? [selectedTopic.id] : undefined}
        page={currentPage}
        onPageChange={handlePageChange}
        practiceHrefBase={practiceHref}
        emptyTitle="No Published MCQs Match Active Filters"
        emptyDescription="Reset your exam, subject, or topic filter above to browse available practice questions."
        emptyAction={{ label: 'Reset Filters', onClick: resetFilters }}
      />
    </div>
  );
}

