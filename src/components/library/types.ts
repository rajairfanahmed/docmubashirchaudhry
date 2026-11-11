import type { Exam, PdfResource, Subject, Topic } from '@/lib/schemas';

export type PdfSortOption = 'newest' | 'title' | 'size' | 'questions';

export interface PdfFilterState {
  search: string;
  examSlug: string;
  subjectId: string;
  topicId: string;
  year: string;
  resourceType: string;
  sort: PdfSortOption;
}

export interface LibraryCatalogProps {
  resources: PdfResource[];
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  scopedExamSlug?: string;
}

