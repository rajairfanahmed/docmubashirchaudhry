export type AuthProviderType = 'google' | 'email' | 'unknown';
export type QuizType = 'practice' | 'mock';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type ContentLanguage = 'en' | 'ur' | 'bilingual';

export interface QuizQuestionOptionRow {
  key: string;
  textEn: string | null;
  textUr?: string | null;
}

export interface QuizAttemptAnswerRecord {
  questionId: string;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
}

export type UserAccountStatus = 'active' | 'blocked' | 'deleted';
export type AdminNotificationType = 'new_user' | 'quiz_joined';
export type QuestionReportStatus = 'new' | 'looked_at' | 'fixed' | 'not_an_issue';

export interface ProfileRow {
  id: string;
  clerk_user_id?: string;
  email: string;
  auth_provider: AuthProviderType;
  display_name: string | null;
  role?: 'user' | 'admin';
  status?: UserAccountStatus;
  blocked_reason?: string | null;
  created_at: string;
  last_active_at?: string;
  last_seen_at?: string | null;
  is_admin: boolean;
}

export interface PdfResourceRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  exam_tag: string;
  tags: string[];
  file_key: string;
  file_size: number;
  sha256: string | null;
  watermark_confirmed: boolean;
  is_published: boolean;
  download_count: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PdfAccessLogRow {
  id: string;
  user_id: string;
  pdf_id: string;
  downloaded_at: string;
}

export interface QuizRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: QuizType;
  subject: string;
  exam_tag: string;
  time_limit_seconds: number | null;
  negative_marking: boolean;
  negative_marking_value: number;
  pass_percentage: number;
  language: ContentLanguage;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionRow {
  id: string;
  quiz_id: string | null;
  subject: string;
  exam_tag: string;
  difficulty: QuestionDifficulty;
  language: ContentLanguage;
  text_en: string | null;
  text_ur: string | null;
  options: QuizQuestionOptionRow[];
  correct_option: string;
  explanation: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_taken_seconds: number;
  auto_submitted: boolean;
  answers: QuizAttemptAnswerRecord[];
  started_at: string | null;
  created_at: string;
}

export interface SiteVisitRow {
  id: string;
  path: string;
  user_id: string | null;
  created_at: string;
}

export interface WebhookEventRow {
  id: string;
  provider: string;
  received_at: string;
}

export interface AdminNotificationRow {
  id: string;
  type: AdminNotificationType;
  user_id: string | null;
  quiz_id: string | null;
  title: string;
  message: string;
  read_at: string | null;
  email_status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export interface DigestRunRow {
  id: string;
  run_date: string;
  sent_at: string;
  recipient_count: number;
}

export interface AdminActivityLogRow {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface QuestionReportRow {
  id: string;
  question_id: string;
  reported_by: string;
  reporter_email: string;
  message: string;
  status: QuestionReportStatus;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface StorageSnapshotRow {
  id: string;
  used_bytes: number;
  object_count: number;
  checked_at: string;
}

