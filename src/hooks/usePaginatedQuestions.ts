'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchQuestionsPage } from '@/lib/api';
import type { PaginatedQuestionFilter, PaginatedResult } from '@/lib/data';
import type { Question } from '@/lib/schemas';
import { MCQ_DEFAULT_PAGE_SIZE } from '@/lib/pagination';

export interface UsePaginatedQuestionsOptions {
  filter: PaginatedQuestionFilter;
  initialData?: PaginatedResult<Question>;
  enabled?: boolean;
}

export function getPaginatedQuestionsQueryKey(filter: PaginatedQuestionFilter) {
  return [
    'questions',
    'paginated',
    {
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? MCQ_DEFAULT_PAGE_SIZE,
      examId: filter.examId ?? '',
      subjectId: filter.subjectId ?? '',
      postId: filter.postId ?? '',
      topicIds: filter.topicIds?.join(',') ?? '',
      difficulty: filter.difficulty ?? '',
      onlyVerified: Boolean(filter.onlyVerified)
    }
  ] as const;
}

/**
 * Architectural TanStack Query hook wrapping GET /api/questions (20/page default)
 * with static /data/v1/questions/pages/ fallback via fetchQuestionsPage.
 */
export function usePaginatedQuestions({
  filter,
  initialData,
  enabled = true
}: UsePaginatedQuestionsOptions) {
  const normalizedFilter: PaginatedQuestionFilter = {
    pageSize: MCQ_DEFAULT_PAGE_SIZE,
    ...filter
  };

  return useQuery<PaginatedResult<Question>>({
    queryKey: getPaginatedQuestionsQueryKey(normalizedFilter),
    queryFn: () => fetchQuestionsPage(normalizedFilter),
    initialData,
    placeholderData: keepPreviousData,
    enabled
  });
}

