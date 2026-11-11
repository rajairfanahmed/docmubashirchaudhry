'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { OptionId, Question } from '@/lib/schemas';
import { createVersionedStorage, STORAGE_KEYS } from '@/lib/storage/persistence';
import { useSmoothScroll } from '@/components/motion/SmoothScrollProvider';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { useToast } from '@/components/ui/ToastProvider';
import { SingleQuestionCard } from './SingleQuestionCard';
import { McqSessionSummary } from './McqSessionSummary';
import { McqPaginationStrip } from './McqPaginationStrip';
import { MCQ_DEFAULT_PAGE_SIZE } from '@/lib/pagination';

export interface McqPracticeRunnerProps {
  questions: Question[];
  sessionKey: string;
  datasetVersion: string;
}

interface StoredMcqSessionEntry {
  deckIds: string[];
  currentIndex: number;
  answers: Record<string, OptionId>;
  isRetryMode: boolean;
  showSummary: boolean;
}

interface StoredMcqRoot {
  sessions: Record<string, StoredMcqSessionEntry>;
}

function isStoredMcqRoot(value: unknown): value is StoredMcqRoot {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'sessions' in value &&
      typeof (value as StoredMcqRoot).sessions === 'object'
  );
}

export function McqPracticeRunner({
  questions,
  sessionKey,
  datasetVersion
}: McqPracticeRunnerProps) {
  const { showToast } = useToast();
  const stageTopRef = useRef<HTMLDivElement>(null);

  const storage = useMemo(
    () =>
      createVersionedStorage<StoredMcqRoot>({
        key: STORAGE_KEYS.MCQ_SESSION,
        datasetVersion,
        validate: isStoredMcqRoot
      }),
    [datasetVersion]
  );

  const questionById = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions]
  );

  const [deckIds, setDeckIds] = useState<string[]>(() => questions.map((q) => q.id));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionId>>({});
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Hydrate saved state for matching question deck once on mount / key switch
  useEffect(() => {
    const savedRoot = storage.load();
    const entry = savedRoot?.sessions?.[sessionKey];
    if (entry && Array.isArray(entry.deckIds)) {
      const validDeckIds = entry.deckIds.filter((id) => questionById.has(id));
      if (validDeckIds.length > 0) {
        setDeckIds(validDeckIds);
        setCurrentIndex(Math.min(Math.max(entry.currentIndex, 0), validDeckIds.length - 1));
        setAnswers(entry.answers ?? {});
        setIsRetryMode(Boolean(entry.isRetryMode));
        setShowSummary(Boolean(entry.showSummary));
        return;
      }
    }
    setDeckIds(questions.map((q) => q.id));
    setCurrentIndex(0);
    setAnswers({});
    setIsRetryMode(false);
    setShowSummary(false);
  }, [storage, sessionKey, questions, questionById]);

  const activeDeck = useMemo(
    () =>
      deckIds
        .map((id) => questionById.get(id))
        .filter((q): q is Question => Boolean(q)),
    [deckIds, questionById]
  );

  const persistSession = (next: StoredMcqSessionEntry) => {
    const existing = storage.load() ?? { sessions: {} };
    storage.save({
      sessions: {
        ...existing.sessions,
        [sessionKey]: next
      }
    });
  };

  const { scrollToTarget } = useSmoothScroll();

  const scrollToStage = () => {
    if (!stageTopRef.current || typeof window === 'undefined') return;
    const rect = stageTopRef.current.getBoundingClientRect();
    if (rect.top < 64 || rect.top > window.innerHeight * 0.45) {
      scrollToTarget(stageTopRef.current, { offset: -76 });
    }
  };

  if (questions.length === 0) {
    return (
      <EmptyStateCard
        icon={RotateCcw}
        title="No MCQs Match This Filter Combination"
        description="Try widening your exam, subject, or topic filter on the MCQ directory to start practicing."
        primaryAction={{ label: 'Reset Filter Selection', href: '/mcq' }}
      />
    );
  }

  const currentQuestion = activeDeck[currentIndex] ?? activeDeck[0];
  const scoreCount = activeDeck.reduce(
    (acc, q) => (answers[q.id] === q.correctOptionId ? acc + 1 : acc),
    0
  );
  const answeredCount = activeDeck.filter((q) => Boolean(answers[q.id])).length;
  const pageSize = MCQ_DEFAULT_PAGE_SIZE;
  const currentPage = Math.floor(currentIndex / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(activeDeck.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageQuestionIds = activeDeck.slice(pageStart, pageStart + pageSize).map((q) => q.id);
  const activeIndexInPage = Math.max(0, currentIndex - pageStart);

  const handleSelectOption = (optionId: OptionId) => {
    if (!currentQuestion || answers[currentQuestion.id]) return;
    const nextAnswers: Record<string, OptionId> = {
      ...answers,
      [currentQuestion.id]: optionId
    };
    setAnswers(nextAnswers);
    persistSession({
      deckIds,
      currentIndex,
      answers: nextAnswers,
      isRetryMode,
      showSummary
    });
  };

  const jumpToQuestion = (globalIndex: number) => {
    const safeIdx = Math.min(Math.max(0, globalIndex), activeDeck.length - 1);
    setCurrentIndex(safeIdx);
    persistSession({
      deckIds,
      currentIndex: safeIdx,
      answers,
      isRetryMode,
      showSummary: false
    });
    scrollToStage();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      jumpToQuestion(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeDeck.length) {
      jumpToQuestion(currentIndex + 1);
    } else {
      setShowSummary(true);
      persistSession({
        deckIds,
        currentIndex,
        answers,
        isRetryMode,
        showSummary: true
      });
      scrollToStage();
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          document.getElementById('mcq-summary-heading')?.focus();
        });
      }
    }
  };

  const handleRetryMissed = (missed: Question[]) => {
    if (missed.length === 0) return;
    const nextIds = missed.map((q) => q.id);
    const cleanedAnswers = { ...answers };
    for (const q of missed) {
      delete cleanedAnswers[q.id];
    }
    setDeckIds(nextIds);
    setAnswers(cleanedAnswers);
    setCurrentIndex(0);
    setIsRetryMode(true);
    setShowSummary(false);
    persistSession({
      deckIds: nextIds,
      currentIndex: 0,
      answers: cleanedAnswers,
      isRetryMode: true,
      showSummary: false
    });
    scrollToStage();
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.getElementById('question-stage-heading')?.focus();
      });
    }
  };

  const handleRestartAll = () => {
    const fullIds = questions.map((q) => q.id);
    setDeckIds(fullIds);
    setCurrentIndex(0);
    setAnswers({});
    setIsRetryMode(false);
    setShowSummary(false);
    persistSession({
      deckIds: fullIds,
      currentIndex: 0,
      answers: {},
      isRetryMode: false,
      showSummary: false
    });
    scrollToStage();
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.getElementById('question-stage-heading')?.focus();
      });
    }
  };

  const handleClearProgress = () => {
    const previousSnapshot: StoredMcqSessionEntry = {
      deckIds,
      currentIndex,
      answers,
      isRetryMode,
      showSummary
    };
    const existing = storage.load();
    if (existing?.sessions) {
      const nextSessions = { ...existing.sessions };
      delete nextSessions[sessionKey];
      storage.save({ sessions: nextSessions });
    }
    const fullIds = questions.map((q) => q.id);
    setDeckIds(fullIds);
    setCurrentIndex(0);
    setAnswers({});
    setIsRetryMode(false);
    setShowSummary(false);
    showToast({
      tone: 'info',
      title: 'Saved MCQ progress cleared',
      description: 'Starting fresh from Question 1.',
      action: {
        label: 'Undo',
        onClick: () => {
          setDeckIds(previousSnapshot.deckIds);
          setCurrentIndex(previousSnapshot.currentIndex);
          setAnswers(previousSnapshot.answers);
          setIsRetryMode(previousSnapshot.isRetryMode);
          setShowSummary(previousSnapshot.showSummary);
          persistSession(previousSnapshot);
        }
      }
    });
  };

  return (
    <div ref={stageTopRef} className="space-y-4 scroll-mt-20">
      {/* Compact Scope Status Row (No Timer, No Submit Button) */}
      <div
        id="mcq-session-progress-slot"
        className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-live="polite"
            className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--dmc-surface-card)] border border-[var(--dmc-border-subtle)] font-bold text-[var(--dmc-mcq-heading)] tabular-nums elevation-1"
          >
            Score: {scoreCount} / {activeDeck.length}
          </span>
          {isRetryMode && (
            <span className="px-2.5 py-1 rounded-full bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] border border-[var(--dmc-highlight-border)] font-bold">
              Retry Missed Round
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={handleClearProgress}
              className="inline-flex items-center gap-1 min-h-[44px] px-2.5 text-xs font-semibold text-[var(--dmc-mcq-heading)] hover:text-[var(--dmc-status-error-ink)] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear progress</span>
            </button>
          )}
        </div>
      </div>

      {showSummary ? (
        <div id="mcq-session-summary-slot" className="dmc-reveal">
          <McqSessionSummary
            questions={activeDeck}
            answersByQuestionId={answers}
            onRetryMissed={handleRetryMissed}
            onRestartAll={handleRestartAll}
          />
        </div>
      ) : (
        <>
          <div id="mcq-single-question-slot">
            <h2 id="question-stage-heading" tabIndex={-1} className="sr-only focus:outline-none">
              Active Practice Question
            </h2>
            {currentQuestion && (
              <SingleQuestionCard
                question={currentQuestion}
                selectedOptionId={answers[currentQuestion.id] ?? null}
                onSelectOption={handleSelectOption}
                questionIndex={currentIndex}
                totalQuestions={activeDeck.length}
                answeredCount={answeredCount}
                footer={
                  <McqPaginationStrip
                    page={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    questionIds={pageQuestionIds}
                    answeredByQuestionId={answers}
                    activeIndex={activeIndexInPage}
                    onSelectQuestion={(indexInPage) => jumpToQuestion(pageStart + indexInPage)}
                    onPageChange={(nextPage) => jumpToQuestion((nextPage - 1) * pageSize)}
                    canPrev={currentIndex > 0}
                    canNext={currentIndex < activeDeck.length}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    nextLabel={currentIndex + 1 === activeDeck.length ? 'View Summary' : 'Next'}
                  />
                }
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-[var(--dmc-ink-secondary)]">
            <span>
              Selections lock immediately and progress saves locally in your browser.
            </span>
            <Link
              href="/mcq"
              className="inline-flex items-center min-h-[44px] font-bold text-[var(--dmc-brand-forest)] hover:underline shrink-0"
            >
              Back to MCQ Matrix
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

