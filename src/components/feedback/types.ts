import type { FeedbackCategory } from '@/lib/feedback/mailto';

export interface CorrectionTriggerProps {
  referenceTitle: string;
  category?: FeedbackCategory;
  label?: string;
  className?: string;
}

