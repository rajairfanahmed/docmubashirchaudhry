'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flag,
  Grid,
  Lock,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  XCircle
} from 'lucide-react';
import { CircularProgressRing } from '@/components/mcq/CircularProgressRing';
import { AnswerHighlight } from '@/components/ui/AnswerHighlight';
import { Button } from '@/components/ui/Button';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { Modal } from '@/components/ui/Modal';
import { SkeletonBlock } from '@/components/ui/FormPrimitives';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { createQuizDraftStorage } from '@/lib/storage/persistence';
import { isV3ClientError, v3Api } from '@/lib/v3/client';
import type {
  PracticeAnswerCheckResponse,
  QuizStartConfig,
  QuizStartResponse,
  QuizSubmitResponse
} from '@/lib/v3/types';
import { BilingualQuestionStem } from '@/components/quizzes/BilingualQuestionStem';
import { MockExamTimerBar } from '@/components/quizzes/MockExamTimerBar';
import { ConfirmSubmitModal } from '@/components/quizzes/ConfirmSubmitModal';
import { QuizResultsPanel } from '@/components/quizzes/QuizResultsPanel';
import { ReportQuestionModal } from '@/components/quizzes/ReportQuestionModal';
import { cn } from '@/lib/utils';

export interface QuizSessionRunnerProps {
  slug: string;
  initialMetadata: {
    title: string;
    description: string | null;
    type: 'practice' | 'mock';
    subject: string | null;
    examTag: string | null;
    timeLimitSeconds: number | null;
    negativeMarking: boolean;
    negativeMarkingValue: number;
    language: string;
    questionCount: number;
  } | null;
}

export function QuizSessionRunner({ slug, initialMetadata }: QuizSessionRunnerProps) {
  const { session, status: authStatus } = useAuthSession();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();
  const headingId = useId();
  const prefersReduced = useReducedMotion();

  const [quizSession, setQuizSession] = useState<QuizStartResponse | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [requiresAuthGate, setRequiresAuthGate] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [practiceChecks, setPracticeChecks] = useState<
    Record<string, PracticeAnswerCheckResponse>
  >({});
  const [checkingQuestionId, setCheckingQuestionId] = useState<string | null>(null);

  const [startedAtMs, setStartedAtMs] = useState<number>(Date.now());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isJumpGridOpen, setIsJumpGridOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [reportingQuestion, setReportingQuestion] = useState<{
    id: string;
    textEn: string;
    textUr: string | null;
  } | null>(null);

  const hasAutoSubmittedRef = useRef(false);

  const loadQuizSession = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoadingSession(true);
      setSessionError(null);
      setRequiresAuthGate(false);

      try {
        const res = await v3Api.quizzes.start(slug, signal);
        setQuizSession(res);
        setResult(null);
        setPracticeChecks({});
        setCurrentIndex(0);
        hasAutoSubmittedRef.current = false;

        const draft = createQuizDraftStorage(res.quiz.id).load();
        const parsedServerStart = Date.parse(res.startedAt);
        let effectiveStartMs = Number.isNaN(parsedServerStart) ? Date.now() : parsedServerStart;

        if (draft && draft.answers && Object.keys(draft.answers).length > 0) {
          setAnswers(draft.answers);
          const draftStartMs = Date.parse(draft.startedAt);
          if (!Number.isNaN(draftStartMs)) {
            effectiveStartMs = draftStartMs;
          }
        } else {
          setAnswers({});
        }

        setStartedAtMs(effectiveStartMs);

        if (res.quiz.type === 'mock' && res.quiz.timeLimitSeconds) {
          const elapsedSeconds = Math.max(0, Math.floor((Date.now() - effectiveStartMs) / 1000));
          setRemainingSeconds(Math.max(0, res.quiz.timeLimitSeconds - elapsedSeconds));
        } else {
          setRemainingSeconds(0);
        }
      } catch (err) {
        if (signal?.aborted) return;
        if (isV3ClientError(err) && err.status === 401) {
          setRequiresAuthGate(true);
          return;
        }
        setSessionError(
          isV3ClientError(err) ? err.message : 'Unable to start this quiz session right now.'
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoadingSession(false);
        }
      }
    },
    [slug]
  );

  useEffect(() => {
    if (authStatus === 'loading') return;

    if (!session.authenticated) {
      setRequiresAuthGate(true);
      setQuizSession(null);
      return;
    }

    const controller = new AbortController();
    void loadQuizSession(controller.signal);
    return () => controller.abort();
  }, [authStatus, session.authenticated, loadQuizSession]);

  // Save draft answers cleanly to localStorage fallback
  useEffect(() => {
    if (!quizSession || result) return;
    const storage = createQuizDraftStorage(quizSession.quiz.id);
    storage.save({
      quizId: quizSession.quiz.id,
      startedAt: new Date(startedAtMs).toISOString(),
      answers
    });
  }, [answers, quizSession, result, startedAtMs]);

  const submitAttempt = useCallback(
    async (autoSubmitted = false) => {
      if (!quizSession || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const timeTakenSeconds = Math.max(1, Math.round((Date.now() - startedAtMs) / 1000));
        const res = await v3Api.quizzes.submitAttempt(quizSession.quiz.slug, {
          answers: quizSession.questions.map((q) => ({
            questionId: q.id,
            selectedOption: answers[q.id] ?? null
          })),
          timeTakenSeconds,
          autoSubmitted,
          startedAt: new Date(startedAtMs).toISOString()
        });

        createQuizDraftStorage(quizSession.quiz.id).clear();
        setIsConfirmModalOpen(false);
        setIsJumpGridOpen(false);
        setResult(res);
        showToast({
          title: autoSubmitted ? 'Time expired: exam auto-submitted' : 'Quiz submitted',
          description: `Final score: ${res.score} / ${res.maxScore} (${res.percentage}%).`,
          tone: autoSubmitted ? 'warning' : 'success'
        });
      } catch (err) {
        if (isV3ClientError(err) && err.status === 401) {
          openAuthModal({
            title: 'Session expired: sign in to save your attempt',
            description: 'Your selected answers are preserved locally while you sign back in.',
            onAuthenticated: () => submitAttempt(autoSubmitted)
          });
          return;
        }
        showToast({
          title: 'Submission failed',
          description: isV3ClientError(err)
            ? err.message
            : 'Could not grade answers right now. Please retry.',
          tone: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, isSubmitting, openAuthModal, quizSession, showToast, startedAtMs]
  );

  // Strict Mock Timer Ticker + Auto-Submit
  useEffect(() => {
    if (!quizSession || result) return;
    const quiz: QuizStartConfig = quizSession.quiz;
    if (quiz.type !== 'mock' || !quiz.timeLimitSeconds) return;

    const timer = window.setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
      const nextRemaining = Math.max(0, (quiz.timeLimitSeconds ?? 0) - elapsed);
      setRemainingSeconds(nextRemaining);

      if (nextRemaining <= 0 && !hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        window.clearInterval(timer);
        void submitAttempt(true);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quizSession, result, startedAtMs, submitAttempt]);

  const answeredCount = useMemo(() => {
    if (!quizSession) return 0;
    return quizSession.questions.filter((q) => Boolean(answers[q.id])).length;
  }, [answers, quizSession]);

  const handleOptionSelect = async (questionId: string, optionKey: string) => {
    if (!quizSession || result) return;
    const isPractice = quizSession.quiz.type === 'practice';

    if (isPractice) {
      if (practiceChecks[questionId] || checkingQuestionId === questionId) return;

      setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
      setCheckingQuestionId(questionId);
      try {
        const checked = await v3Api.quizzes.checkPracticeAnswer(quizSession.quiz.slug, {
          questionId,
          selectedOption: optionKey
        });
        setPracticeChecks((prev) => ({ ...prev, [questionId]: checked }));
      } catch (err) {
        if (isV3ClientError(err) && err.status === 401) {
          openAuthModal({
            title: 'Session expired: sign in to continue',
            description: 'Your quiz progress is preserved locally while you sign back in.',
            onAuthenticated: () => {
              void handleOptionSelect(questionId, optionKey);
            }
          });
          setAnswers((prev) => ({ ...prev, [questionId]: null }));
          return;
        }
        showToast({
          title: 'Could not verify answer',
          description: isV3ClientError(err) ? err.message : 'Please try selecting again.',
          tone: 'error'
        });
        setAnswers((prev) => ({ ...prev, [questionId]: null }));
      } finally {
        setCheckingQuestionId(null);
      }
      return;
    }

    // Mock mode allows toggling / changing selection prior to submission
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionKey ? null : optionKey
    }));
  };

  const handleRetake = () => {
    if (quizSession) {
      createQuizDraftStorage(quizSession.quiz.id).clear();
    }
    setResult(null);
    void loadQuizSession();
  };

  // Auth Gate Card when not logged in
  if (requiresAuthGate || (!session.authenticated && authStatus !== 'loading')) {
    const title = initialMetadata?.title ?? `Quiz Session: ${slug}`;
    const isMock = initialMetadata?.type === 'mock';
    const durationMinutes = initialMetadata?.timeLimitSeconds
      ? Math.ceil(initialMetadata.timeLimitSeconds / 60)
      : null;

    return (
      <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sheet)] p-6 sm:p-10 elevation-1 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_170px] lg:items-center lg:gap-10 gap-6">
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)]">
                {isMock ? 'Timed Mock Exam' : 'Practice Quiz'}
              </span>
              {initialMetadata?.examTag && (
                <span className="font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                  {initialMetadata.examTag}
                </span>
              )}
              {durationMinutes && (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{durationMinutes} min timer</span>
                </span>
              )}
              {initialMetadata?.negativeMarking && (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-warning-ink)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] px-2.5 py-0.5 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>-{initialMetadata.negativeMarkingValue} neg marking</span>
                </span>
              )}
            </div>

            <h1 id={headingId} className="type-page-title text-[var(--color-ink)]">
              {title}
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-ink-secondary)] leading-relaxed">
              {initialMetadata?.description ||
                'Sign in with a free student account to launch interactive questions, run the exam timer, and save scores to your personal attempt history.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() =>
                  openAuthModal({
                    title: `Sign in to start "${title}"`,
                    description:
                      'Create or sign in to a free student account to attempt this quiz and record your private result.',
                    onAuthenticated: () => void loadQuizSession()
                  })
                }
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>Sign In to Start Quiz</span>
              </Button>

              <Link
                href="/quizzes"
                className="dmc-press inline-flex items-center gap-1.5 min-h-[48px] px-4 py-2 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-soft)] text-sm font-semibold text-[var(--color-ink)]"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>All Quizzes</span>
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center gap-2 shrink-0">
            <CircularProgressRing
              answeredCount={0}
              totalCount={initialMetadata?.questionCount || 10}
              sizePx={132}
            />
            <span className="text-xs font-semibold text-[var(--color-ink-muted)] tabular-nums">
              {initialMetadata?.questionCount || 0} MCQs
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Loading Skeleton
  if (authStatus === 'loading' || isLoadingSession) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] p-6 sm:p-10 elevation-2 space-y-6">
        <SkeletonBlock className="h-8 w-1/3" />
        <SkeletonBlock className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkeletonBlock className="h-14" />
          <SkeletonBlock className="h-14" />
          <SkeletonBlock className="h-14" />
          <SkeletonBlock className="h-14" />
        </div>
      </div>
    );
  }

  // Error State
  if (sessionError || !quizSession) {
    return (
      <EmptyStateCard
        icon={ShieldAlert}
        title="Could not open this quiz"
        description={
          sessionError ?? 'The requested quiz could not be loaded or is not currently published.'
        }
        primaryAction={{
          label: 'Retry Loading',
          onClick: () => void loadQuizSession()
        }}
        secondaryAction={{
          label: 'Back to Quizzes',
          href: '/quizzes'
        }}
      />
    );
  }

  if (quizSession.questions.length === 0) {
    return (
      <EmptyStateCard
        icon={Sparkles}
        title="No questions assigned yet"
        description="This quiz has no published questions assigned yet. Please choose another practice quiz or mock exam."
        primaryAction={{
          label: 'Browse Other Quizzes',
          href: '/quizzes'
        }}
      />
    );
  }

  // Post-Submit Results & Chronological Review
  if (result) {
    return (
      <QuizResultsPanel
        result={result}
        language={quizSession.quiz.language}
        passPercentage={quizSession.quiz.passPercentage}
        onRetake={handleRetake}
      />
    );
  }

  const quiz = quizSession.quiz;
  const questions = quizSession.questions;
  const totalCount = questions.length;
  const currentQ = questions[currentIndex] ?? questions[0];
  const selectedKey = answers[currentQ.id] ?? null;
  const checkedResult = practiceChecks[currentQ.id];
  const isMock = quiz.type === 'mock';
  const showOverflowDrawerTrigger = totalCount > 20;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Session Bar */}
      {isMock && quiz.timeLimitSeconds ? (
        <MockExamTimerBar
          title={quiz.title}
          remainingSeconds={remainingSeconds}
          totalSeconds={quiz.timeLimitSeconds}
          answeredCount={answeredCount}
          totalCount={totalCount}
          negativeMarking={quiz.negativeMarking}
          negativeMarkingValue={quiz.negativeMarkingValue}
          onOpenSubmitModal={() => setIsConfirmModalOpen(true)}
          isSubmitting={isSubmitting}
        />
      ) : (
        <header className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-panel)] px-4 sm:px-6 py-4 elevation-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-[var(--color-success-border)]">
                Practice Mode
              </span>
              {quiz.examTag && (
                <span className="font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                  {quiz.examTag}
                </span>
              )}
              {quiz.negativeMarking && (
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-warning-ink)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] px-2.5 py-0.5 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>-{quiz.negativeMarkingValue} neg marking</span>
                </span>
              )}
            </div>

            <h1 id={headingId} className="type-card-title text-[var(--color-ink)] break-words">
              {quiz.title}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirmModalOpen(true)}
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Finish &amp; Save Attempt</span>
            </Button>
          </div>
        </header>
      )}

      {/* Practice Score Pill Row (Matches Practice Session Sheet) */}
      {!isMock && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <span
            aria-live="polite"
            className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] font-bold text-[var(--color-ink)] tabular-nums elevation-1"
          >
            Score:{' '}
            {Object.values(practiceChecks).filter((check) => check.isCorrect).length} /{' '}
            {totalCount}
          </span>
          <span className="text-xs font-semibold text-[var(--color-brand-deep)]">
            {answeredCount} of {totalCount} answered
          </span>
        </div>
      )}

      {/* Single Active Question Sheet Card (Matches Practice MCQ Design) */}
      <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sheet)] p-4 sm:p-8 lg:p-10 elevation-1 space-y-5 sm:space-y-6">
        {/* Mobile Centered Progress Ring (< lg) */}
        <div className="flex justify-center lg:hidden">
          <CircularProgressRing answeredCount={answeredCount} totalCount={totalCount} sizePx={96} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_170px] lg:items-center lg:gap-10 gap-6">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={currentQ.id}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: prefersReduced ? 0.06 : 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 sm:space-y-5 min-w-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--color-ink-secondary)] tabular-nums">
                  Question {currentIndex + 1} of {totalCount}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] px-2.5 py-0.5 rounded-full">
                    {currentQ.difficulty}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!session.authenticated) {
                        openAuthModal({
                          title: 'Sign in to report errors',
                          description: 'Please sign in with a free account to flag question errors.',
                          onAuthenticated: () =>
                            setReportingQuestion({
                              id: currentQ.id,
                              textEn: currentQ.textEn ?? '',
                              textUr: currentQ.textUr
                            })
                        });
                        return;
                      }
                      setReportingQuestion({
                        id: currentQ.id,
                        textEn: currentQ.textEn ?? '',
                        textUr: currentQ.textUr
                      });
                    }}
                    title="Report question error"
                    aria-label="Report an error in this question"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-ink-muted)] hover:text-red-700 hover:bg-red-50/60 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Report</span>
                  </button>
                </div>
              </div>

              <BilingualQuestionStem
                language={currentQ.language}
                textEn={currentQ.textEn}
                textUr={currentQ.textUr}
              />

              {/* Options Grid (Matches SingleQuestionCard Clean Typography) */}
              <div
                role="group"
                aria-label="Answer options"
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {currentQ.options.map((opt) => {
                  const isSelected = selectedKey === opt.key;
                  const isCheckedCorrect = checkedResult && opt.key === checkedResult.correctOption;
                  const isCheckedWrong =
                    checkedResult && isSelected && opt.key !== checkedResult.correctOption;
                  const isOptionInteractive =
                    !checkedResult && checkingQuestionId !== currentQ.id;

                  let cardStyle =
                    'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] text-[var(--color-ink)] cursor-pointer';
                  let letterStyle = 'text-[var(--color-ink)]';

                  if (checkedResult) {
                    if (isCheckedCorrect && isSelected) {
                      cardStyle =
                        'border-2 border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-ink)] cursor-default';
                      letterStyle = 'text-[var(--color-success-ink)]';
                    } else if (isCheckedCorrect) {
                      cardStyle =
                        'border-2 border-[var(--color-warning-border)] bg-[var(--dmc-highlight-bg)] text-[var(--dmc-highlight-ink)] cursor-default';
                      letterStyle = 'text-[var(--dmc-highlight-ink)]';
                    } else if (isCheckedWrong) {
                      cardStyle =
                        'border-2 border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-ink)] cursor-default';
                      letterStyle = 'text-[var(--color-danger-ink)]';
                    } else {
                      cardStyle =
                        'border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)] cursor-default';
                      letterStyle = 'text-[var(--color-ink-secondary)]';
                    }
                  } else if (isSelected) {
                    cardStyle =
                      'border-2 border-[var(--color-brand-deep)] bg-[var(--color-success-bg)] text-[var(--color-ink)]';
                    letterStyle = 'text-[var(--color-brand-deep)]';
                  }

                  const showOptEn = Boolean(
                    opt.textEn && (currentQ.language !== 'ur' || !opt.textUr)
                  );
                  const showOptUr = Boolean(
                    opt.textUr && (currentQ.language !== 'en' || !opt.textEn)
                  );

                  return (
                    <m.button
                      key={opt.key}
                      type="button"
                      onClick={() => void handleOptionSelect(currentQ.id, opt.key)}
                      aria-disabled={Boolean(checkedResult) || checkingQuestionId === currentQ.id || undefined}
                      aria-pressed={isSelected}
                      whileHover={isOptionInteractive && !prefersReduced ? { y: -1 } : undefined}
                      whileTap={isOptionInteractive && !prefersReduced ? { scale: 0.986 } : undefined}
                      transition={{ duration: 0.13, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        'w-full min-h-[52px] text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-2.5 text-sm font-medium transition-colors duration-150 ease-out',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]',
                        cardStyle
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          dir="ltr"
                          className={cn('font-bold uppercase shrink-0 min-w-[20px]', letterStyle)}
                        >
                          {opt.key.toUpperCase()}.
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          {showOptEn && opt.textEn && (
                            <span dir="ltr" className="block leading-snug break-words">
                              {opt.textEn}
                            </span>
                          )}
                          {showOptUr && opt.textUr && (
                            <span
                              dir="rtl"
                              lang="ur"
                              className="type-urdu block text-right leading-[1.8]"
                            >
                              {opt.textUr}
                            </span>
                          )}
                        </div>
                      </div>

                      {isCheckedCorrect && (
                        <m.span
                          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.75 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          className="shrink-0"
                        >
                          <CheckCircle2
                            className="w-4 h-4 text-[var(--color-success-ink)]"
                            aria-hidden="true"
                          />
                        </m.span>
                      )}
                      {isCheckedWrong && (
                        <m.span
                          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.75 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                          className="shrink-0"
                        >
                          <XCircle
                            className="w-4 h-4 text-[var(--color-danger-ink)]"
                            aria-hidden="true"
                          />
                        </m.span>
                      )}
                    </m.button>
                  );
                })}
              </div>
            </m.div>
          </AnimatePresence>

          {/* Right Zone (>= lg): Circular Progress Ring */}
          <div className="hidden lg:flex items-center justify-center shrink-0">
            <CircularProgressRing answeredCount={answeredCount} totalCount={totalCount} sizePx={124} />
          </div>
        </div>

        {/* Practice Mode Immediate Feedback + Golden Answer Highlight */}
        <AnimatePresence initial={false}>
          {checkedResult && (
            <m.div
              key={`quiz-explain-${currentQ.id}`}
              aria-live="polite"
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0.06 : 0.19, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-[var(--color-border)] pt-5 space-y-3.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={
                    checkedResult.isCorrect
                      ? 'font-bold text-[var(--color-success-ink)]'
                      : 'font-bold text-[var(--color-danger-ink)]'
                  }
                >
                  {checkedResult.isCorrect ? 'Correct pick:' : 'Correct option:'}
                </span>

                <AnswerHighlight className="uppercase">
                  Option {checkedResult.correctOption.toUpperCase()}
                </AnswerHighlight>
              </div>

              {checkedResult.explanation && (
                <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-[var(--radius-control)] p-4 text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                  {checkedResult.explanation}
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Card Footer Pagination Strip (Prev | 1..N | Next) */}
        <div className="pt-2 border-t border-[var(--color-border)]/80">
          <nav aria-label="Quiz question navigator">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                aria-label="Previous question"
                className="dmc-press min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] disabled:opacity-40 cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
              >
                Prev
              </button>

              {!showOverflowDrawerTrigger ? (
                <div className="hidden md:flex flex-wrap items-center justify-center gap-1.5">
                  {questions.map((q, index) => {
                    const isCurrent = index === currentIndex;
                    const isAnswered = Boolean(answers[q.id]);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        aria-current={isCurrent ? 'step' : undefined}
                        aria-label={`Question ${index + 1}, ${isAnswered ? 'answered' : 'unanswered'}`}
                        className={cn(
                          'dmc-press min-h-[44px] min-w-[44px] px-2.5 inline-flex items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]',
                          isCurrent
                            ? 'bg-[var(--color-action)] text-[var(--color-action-ink)] shadow-xs'
                            : isAnswered
                            ? 'bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-ink)] hover:border-[var(--color-brand-deep)]'
                            : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-secondary)] hover:border-[var(--color-brand-deep)]'
                        )}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsJumpGridOpen(true)}
                >
                  <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Jump ({currentIndex + 1}/{totalCount})</span>
                </Button>
              )}

              {currentIndex < totalCount - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((idx) => Math.min(totalCount - 1, idx + 1))}
                  className="dmc-press min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-deep)] hover:bg-[var(--color-surface-soft)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="dmc-press min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--color-action-ink)] text-xs font-semibold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-deep)]"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Finish &amp; Submit</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      </article>

      {/* Secondary Action Row Below Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--color-ink-secondary)]">
        <button
          type="button"
          onClick={handleRetake}
          className="inline-flex items-center gap-1.5 min-h-[44px] font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-deep)] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Restart Session</span>
        </button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsConfirmModalOpen(true)}
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Submit Quiz ({answeredCount}/{totalCount})</span>
        </Button>
      </div>

      {/* Large Exam Question Jump Modal (> 20 questions) */}
      <Modal
        isOpen={isJumpGridOpen}
        onClose={() => setIsJumpGridOpen(false)}
        title={`Jump to Question (${answeredCount} / ${totalCount} answered)`}
        className="max-w-lg"
      >
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {questions.map((q, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = Boolean(answers[q.id]);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(index);
                  setIsJumpGridOpen(false);
                }}
                className={cn(
                  'min-h-[42px] rounded-lg text-xs font-bold tabular-nums',
                  isCurrent
                    ? 'bg-[var(--color-action)] text-[var(--color-action-ink)]'
                    : isAnswered
                    ? 'bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success-ink)]'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-ink-secondary)]'
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </Modal>

      <ConfirmSubmitModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirmSubmit={() => submitAttempt(false)}
        answeredCount={answeredCount}
        totalCount={totalCount}
        negativeMarking={quiz.negativeMarking}
        negativeMarkingValue={quiz.negativeMarkingValue}
        isSubmitting={isSubmitting}
      />

      {reportingQuestion && (
        <ReportQuestionModal
          isOpen={Boolean(reportingQuestion)}
          questionId={reportingQuestion.id}
          questionStem={reportingQuestion.textEn || reportingQuestion.textUr || undefined}
          onClose={() => setReportingQuestion(null)}
        />
      )}
    </div>
  );
}

