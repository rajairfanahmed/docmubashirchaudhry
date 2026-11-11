import type { Exam, RecruitmentPost, Source } from '@/lib/schemas';

export interface ExamHubCardProps {
  exam: Exam;
  postCount?: number;
  pdfCount?: number;
}

export interface ProvenanceBoxProps {
  officialUrl?: string;
  officialLabel?: string;
  verification: RecruitmentPost['verification'];
  sources: Source[];
  title?: string;
}
