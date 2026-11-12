import type {
  AuthProviderType,
  ContentLanguage,
  PdfResourceRow,
  QuestionDifficulty,
  QuizQuestionOptionRow,
  QuizQuestionRow,
  QuizRow,
  QuizType
} from '@/lib/supabase/database.types';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiErrorFieldDetail {
  path: string;
  message: string;
}

export interface V3ApiErrorPayload {
  status: number;
  code: string;
  message: string;
  details?: ApiErrorFieldDetail[] | unknown;
  retryAfterSeconds?: number;
  isOffline?: boolean;
  isTimeout?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Auth & Session                                                             */
/* -------------------------------------------------------------------------- */

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: AuthProviderType;
  isAdmin: boolean;
}

export interface AuthSessionProviders {
  email: boolean;
  google: boolean;
}

export interface AuthSessionState {
  configured: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  providers?: AuthSessionProviders;
}

export interface SignupInput {
  email: string;
  password: string;
  displayName?: string;
  next?: string;
}

export interface SignupResponse {
  ok: boolean;
  requiresEmailVerification: boolean;
  user: AuthUser | null;
  message?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  user: AuthUser;
}

export interface ResendVerificationInput {
  email: string;
  next?: string;
}

export interface ForgotPasswordInput {
  email: string;
  next?: string;
}

export interface UpdatePasswordInput {
  password: string;
}

export interface AuthMessageResponse {
  ok: boolean;
  message: string;
}

/* -------------------------------------------------------------------------- */
/* Public Catalogs & Gated Student Flows                                      */
/* -------------------------------------------------------------------------- */

export interface PublicPdfItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  examTag: string;
  tags: string[];
  fileSize: number;
  downloadCount: number;
  createdAt: string;
  requiresAuth: true;
}

export interface PdfListQuery {
  page?: number;
  pageSize?: number;
  subject?: string;
  examTag?: string;
  search?: string;
  sort?: 'newest' | 'popular';
}

export interface PdfListResponse {
  items: PublicPdfItem[];
  pagination: PaginationMeta;
  configured?: boolean;
}

export interface PdfDownloadGrant {
  pdfId: string;
  title: string;
  fileSize: number;
  downloadUrl: string;
  expiresInSeconds: number;
  expiresAt: string;
}

export interface QuizSummaryItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: QuizType;
  subject: string;
  examTag: string;
  timeLimitSeconds: number | null;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  passPercentage: number;
  language: ContentLanguage;
  questionCount: number;
  createdAt: string;
  requiresAuth: true;
}

export interface QuizListQuery {
  page?: number;
  pageSize?: number;
  type?: QuizType;
  subject?: string;
  examTag?: string;
  search?: string;
}

export interface QuizListResponse {
  items: QuizSummaryItem[];
  pagination: PaginationMeta;
  configured?: boolean;
}

export interface SanitizedQuizQuestionClient {
  id: string;
  quizId: string | null;
  subject: string;
  examTag: string;
  difficulty: QuestionDifficulty;
  language: ContentLanguage;
  textEn: string | null;
  textUr: string | null;
  options: QuizQuestionOptionRow[];
  sortOrder: number;
}

export interface QuizStartConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: QuizType;
  subject: string;
  examTag: string;
  timeLimitSeconds: number | null;
  negativeMarking: boolean;
  negativeMarkingValue: number;
  passPercentage: number;
  language: ContentLanguage;
  questionCount: number;
}

export interface QuizStartResponse {
  quiz: QuizStartConfig;
  questions: SanitizedQuizQuestionClient[];
  startedAt: string;
}

export interface PracticeAnswerCheckResponse {
  questionId: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmitAnswerInput {
  questionId: string;
  selectedOption: string | null;
}

export interface QuizSubmitInput {
  answers: QuizSubmitAnswerInput[];
  timeTakenSeconds: number;
  autoSubmitted?: boolean;
  startedAt?: string;
}

export interface GradedQuizReviewItemClient {
  questionId: string;
  textEn: string | null;
  textUr: string | null;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  unanswered: boolean;
  explanation: string;
}

export interface QuizSubmitResponse {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizType: QuizType;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  autoSubmitted: boolean;
  createdAt: string;
  review: GradedQuizReviewItemClient[];
}

/* -------------------------------------------------------------------------- */
/* Private Student History & Analytics                                        */
/* -------------------------------------------------------------------------- */

export interface UserAttemptSummary {
  totalAttempts: number;
  averagePercentage: number;
  bestPercentage: number;
  passedCount: number;
}

export interface UserAttemptHistoryItem {
  id: string;
  quizId: string;
  quizSlug: string | null;
  quizTitle: string;
  quizType: QuizType | null;
  subject: string | null;
  examTag: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  autoSubmitted: boolean;
  createdAt: string;
}

export interface UserAttemptsResponse {
  summary: UserAttemptSummary;
  items: UserAttemptHistoryItem[];
  pagination: PaginationMeta;
}

export interface UserDownloadHistoryItem {
  id: string;
  pdfId: string;
  slug: string | null;
  title: string;
  subject: string | null;
  examTag: string | null;
  fileSize: number | null;
  downloadedAt: string;
}

export interface UserDownloadsResponse {
  items: UserDownloadHistoryItem[];
  pagination: PaginationMeta;
}

export interface VisitRecordResponse {
  recorded: boolean;
}

/* -------------------------------------------------------------------------- */
/* Admin Management & Analytics                                               */
/* -------------------------------------------------------------------------- */

export interface AdminUploadUrlRequest {
  filename: string;
  contentType: 'application/pdf';
  fileSizeBytes: number;
}

export interface AdminUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
  requiredHeaders: Record<string, string>;
}

export interface CreatePdfInput {
  slug: string;
  title: string;
  description?: string;
  subject: string;
  examTag: string;
  tags?: string[];
  fileKey: string;
  fileSize: number;
  sha256?: string | null;
  watermarkConfirmed: true;
  isPublished?: boolean;
}

export interface UpdatePdfInput {
  title?: string;
  description?: string;
  subject?: string;
  examTag?: string;
  tags?: string[];
  watermarkConfirmed?: boolean;
  isPublished?: boolean;
}

export interface CreateQuizInput {
  slug: string;
  title: string;
  description?: string;
  type: QuizType;
  subject: string;
  examTag: string;
  timeLimitSeconds?: number | null;
  negativeMarking?: boolean;
  negativeMarkingValue?: number;
  passPercentage?: number;
  language?: ContentLanguage;
  isPublished?: boolean;
}

export type UpdateQuizInput = Partial<Omit<CreateQuizInput, 'slug'>>;

export interface CreateQuestionInput {
  quizId?: string | null;
  subject: string;
  examTag: string;
  difficulty?: QuestionDifficulty;
  language?: ContentLanguage;
  textEn?: string | null;
  textUr?: string | null;
  options: QuizQuestionOptionRow[];
  correctOption: string;
  explanation?: string;
  sortOrder?: number;
}

export type UpdateQuestionInput = Partial<CreateQuestionInput>;

export interface BulkImportQuestionsInput {
  quizId?: string | null;
  format: 'json' | 'csv';
  questions?: CreateQuestionInput[];
  csv?: string;
  defaultSubject?: string;
  defaultExamTag?: string;
}

export interface BulkImportResult {
  importedCount: number;
  questionIds: string[];
}

export interface AdminOverviewAnalytics {
  totalRegisteredUsers: number;
  activeUsersToday: number;
  quizzesAttemptedToday: number;
  totalQuizAttempts: number;
  totalPdfDownloads: number;
  siteVisits: {
    today: number;
    last7Days: number;
    last30Days: number;
    total: number;
  };
  dailyVisitSeries: Array<{
    date: string;
    visits: number;
  }>;
  generatedAt: string;
}

export interface AdminUserAnalyticsRow {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: AuthProviderType;
  joinedAt: string;
  lastActiveAt: string;
  isAdmin: boolean;
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  totalPdfDownloads: number;
}

export interface AdminUsersAnalyticsResponse {
  items: AdminUserAnalyticsRow[];
  pagination: PaginationMeta;
}

export interface AdminQuizAnalyticsResponse {
  perQuiz: Array<{
    quizId: string;
    slug: string;
    title: string;
    type: string;
    subject: string;
    examTag: string;
    isPublished: boolean;
    attemptCount: number;
    averageScorePercentage: number;
    passRatePercentage: number;
  }>;
  mostMissedQuestions: Array<{
    questionId: string;
    quizId: string | null;
    subject: string | null;
    examTag: string | null;
    textEn: string | null;
    textUr: string | null;
    timesAnswered: number;
    timesMissed: number;
    missRatePercentage: number;
  }>;
}

export interface AdminPdfAnalyticsResponse {
  perResource: Array<{
    pdfId: string;
    slug: string;
    title: string;
    subject: string;
    examTag: string;
    fileSize: number;
    isPublished: boolean;
    downloadCount: number;
    loggedDownloads: number;
  }>;
  mostDownloadedResources: Array<{
    pdfId: string;
    title: string;
    subject: string;
    examTag: string;
    downloadCount: number;
  }>;
  downloadsPerUser: Array<{
    userId: string;
    email: string | null;
    displayName: string | null;
    totalDownloads: number;
    lastDownloadedAt: string;
  }>;
}

export interface AdminPdfInventoryResponse {
  items: PdfResourceRow[];
  pagination: PaginationMeta;
}

export interface AdminQuizInventoryResponse {
  items: QuizRow[];
  pagination: PaginationMeta;
}

export interface AdminQuestionInventoryResponse {
  items: QuizQuestionRow[];
  pagination: PaginationMeta;
}

