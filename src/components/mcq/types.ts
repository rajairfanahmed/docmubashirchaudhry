import type { Exam, OptionId, Question, Subject, Topic } from '@/lib/schemas';

export interface McqLauncherProps {
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
}

export interface McqPracticeRunnerProps {
  questions: Question[];
  sessionKey: string;
  datasetVersion: string;
}

export interface CircularProgressRingProps {
  answeredCount: number;
  totalCount: number;
  sizePx?: number;
  strokeWidth?: number;
  className?: string;
}

export interface McqPaginationStripProps {
  page: number;
  totalPages: number;
  questionIds: string[];
  answeredByQuestionId: Record<string, OptionId | string>;
  activeIndex: number;
  pageSize?: number;
  onSelectQuestion: (index: number) => void;
  onPageChange: (nextPage: number) => void;
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  className?: string;
}

export interface McqSessionPersistencePayload {
  filterKey: string;
  currentIndex: number;
  answersByQuestionId: Record<string, string>;
  missedQuestionIds: string[];
  completedAt?: string;
}
