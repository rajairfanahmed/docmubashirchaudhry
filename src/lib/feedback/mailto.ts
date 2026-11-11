export type FeedbackCategory =
  | 'errata'
  | 'pastpaper'
  | 'syllabus'
  | 'geography'
  | 'copyright'
  | 'other';

export interface FeedbackMailtoInput {
  fullName: string;
  senderEmail: string;
  category: FeedbackCategory;
  referenceTitle: string;
  message: string;
  recipientEmail?: string;
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  errata: 'Errata / Question Key Discrepancy',
  pastpaper: 'Past Paper Question Clarification',
  syllabus: 'Syllabus Benchmark Update',
  geography: 'Geography Fact Verification',
  copyright: 'Copyright / Takedown Request',
  other: 'General Academic Inquiry'
};

export const PORTAL_CORRECTION_EMAIL = 'faculty@docmubashirchaudhary.com';

export function formatFeedbackReportText(input: FeedbackMailtoInput): {
  subject: string;
  body: string;
} {
  const label = CATEGORY_LABELS[input.category] ?? 'Academic Inquiry';
  const ref = input.referenceTitle.trim() || 'General Repository';
  const subject = `[${label}] ${ref}`;

  const bodyLines = [
    `Category: ${label}`,
    `Reference: ${ref}`,
    `Submitted By: ${input.fullName.trim()} (${input.senderEmail.trim()})`,
    '',
    'Details & Official Citation:',
    input.message.trim()
  ];

  return {
    subject,
    body: bodyLines.join('\n')
  };
}

export function buildCorrectionMailtoUrl(input: FeedbackMailtoInput): string {
  const recipient = input.recipientEmail?.trim() || PORTAL_CORRECTION_EMAIL;
  const { subject, body } = formatFeedbackReportText(input);
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

