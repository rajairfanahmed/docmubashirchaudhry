import type {
  AdminOverviewAnalytics,
  AdminPdfAnalyticsResponse,
  AdminPdfInventoryResponse,
  AdminQuestionInventoryResponse,
  AdminQuizAnalyticsResponse,
  AdminQuizInventoryResponse,
  AdminUploadUrlRequest,
  AdminUploadUrlResponse,
  AdminUsersAnalyticsResponse,
  ApiErrorFieldDetail,
  AuthMessageResponse,
  AuthSessionState,
  BulkImportQuestionsInput,
  BulkImportResult,
  CreatePdfInput,
  CreateQuestionInput,
  CreateQuizInput,
  ForgotPasswordInput,
  LoginInput,
  LoginResponse,
  PdfDownloadGrant,
  PdfListQuery,
  PdfListResponse,
  PracticeAnswerCheckResponse,
  QuizListQuery,
  QuizListResponse,
  QuizStartResponse,
  QuizSubmitInput,
  QuizSubmitResponse,
  ResendVerificationInput,
  SignupInput,
  SignupResponse,
  UpdatePasswordInput,
  UpdatePdfInput,
  UpdateQuestionInput,
  UpdateQuizInput,
  UserAttemptsResponse,
  UserDownloadsResponse,
  V3ApiErrorPayload,
  VisitRecordResponse
} from './types';
import type { PdfResourceRow, QuizQuestionRow, QuizRow } from '@/lib/supabase/database.types';

const DEFAULT_TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 120_000;

export class V3ClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorFieldDetail[] | unknown;
  readonly retryAfterSeconds?: number;
  readonly isOffline: boolean;
  readonly isTimeout: boolean;

  constructor(payload: V3ApiErrorPayload) {
    super(payload.message);
    this.name = 'V3ClientError';
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
    this.retryAfterSeconds = payload.retryAfterSeconds;
    this.isOffline = Boolean(payload.isOffline);
    this.isTimeout = Boolean(payload.isTimeout);
  }
}

export function isV3ClientError(error: unknown): error is V3ClientError {
  return error instanceof V3ClientError;
}

export function sanitizeClientNextPath(path?: string | null): string {
  if (!path) return '/';
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/';
  }
  return trimmed;
}

export function buildGoogleOAuthUrl(nextPath = '/'): string {
  const safeNext = sanitizeClientNextPath(nextPath);
  return `/api/auth/oauth?provider=google&next=${encodeURIComponent(safeNext)}`;
}

function buildQueryString(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim().length > 0) {
      sp.set(key, String(value).trim());
    }
  }
  const encoded = sp.toString();
  return encoded ? `?${encoded}` : '';
}

function parseRetryAfterHeader(value: string | null): number | undefined {
  if (!value) return undefined;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.ceil(numeric);
  }
  const timestamp = Date.parse(value);
  if (!Number.isNaN(timestamp)) {
    return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
  }
  return undefined;
}

async function requestJson<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    timeoutMs?: number;
    signal?: AbortSignal;
    keepalive?: boolean;
  } = {}
): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new V3ClientError({
      status: 0,
      code: 'OFFLINE',
      message: 'You appear to be offline. Check your connection and try again.',
      isOffline: true
    });
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json'
    };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(path, {
      method: options.method ?? 'GET',
      credentials: 'same-origin',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      keepalive: options.keepalive
    });

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const apiError = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)
        ?.error;
      const firstDetailMessage =
        Array.isArray(apiError?.details) &&
        typeof (apiError.details[0] as { message?: unknown } | undefined)?.message === 'string'
          ? String((apiError.details[0] as { message: string }).message)
          : undefined;
      const resolvedMessage =
        apiError?.code === 'VALIDATION_ERROR' && firstDetailMessage
          ? firstDetailMessage
          : apiError?.message;

      throw new V3ClientError({
        status: res.status,
        code: apiError?.code ?? `HTTP_${res.status}`,
        message:
          resolvedMessage ??
          (res.status === 401
            ? 'Please sign in to continue.'
            : res.status === 403
            ? 'You do not have permission for this action.'
            : res.status === 429
            ? 'Too many requests. Please wait briefly before trying again.'
            : 'Request failed. Please try again.'),
        details: apiError?.details,
        retryAfterSeconds: parseRetryAfterHeader(res.headers.get('Retry-After'))
      });
    }

    return data as T;
  } catch (error) {
    if (error instanceof V3ClientError) {
      throw error;
    }

    if (timedOut) {
      throw new V3ClientError({
        status: 408,
        code: 'TIMEOUT',
        message: 'The request timed out waiting for the server. Please try again.',
        isTimeout: true
      });
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new V3ClientError({
        status: 0,
        code: 'ABORTED',
        message: 'Request was cancelled.'
      });
    }

    throw new V3ClientError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the server. Check your internet connection and retry.',
      isOffline: typeof navigator !== 'undefined' && navigator.onLine === false
    });
  } finally {
    clearTimeout(timer);
    if (options.signal) {
      options.signal.removeEventListener('abort', forwardAbort);
    }
  }
}

/**
 * Streams a validated PDF binary directly from the admin browser to the signed
 * Cloudflare R2 URL (bypasses Vercel serverless body size ceilings cleanly).
 */
export async function uploadPdfBinaryToR2(options: {
  uploadUrl: string;
  file: File;
  requiredHeaders?: Record<string, string>;
  onProgress?: (percent: number) => void;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<void> {
  if (options.signal?.aborted) {
    throw new V3ClientError({
      status: 0,
      code: 'ABORTED',
      message: 'Upload cancelled.'
    });
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new V3ClientError({
      status: 0,
      code: 'OFFLINE',
      message: 'You appear to be offline. Check your connection and try again.',
      isOffline: true
    });
  }

  const timeoutMs = options.timeoutMs ?? UPLOAD_TIMEOUT_MS;

  if (typeof XMLHttpRequest === 'undefined') {
    let res: Response;
    try {
      res = await fetch(options.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
          ...(options.requiredHeaders ?? {})
        },
        body: options.file,
        signal: options.signal
      });
    } catch (err) {
      if (options.signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        throw new V3ClientError({
          status: 0,
          code: 'ABORTED',
          message: 'Upload cancelled.'
        });
      }
      throw err;
    }
    if (!res.ok) {
      throw new V3ClientError({
        status: res.status,
        code: 'R2_UPLOAD_FAILED',
        message: `Storage upload failed with HTTP ${res.status}.`
      });
    }
    options.onProgress?.(100);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', options.uploadUrl, true);
    xhr.timeout = timeoutMs;

    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/pdf',
      ...(options.requiredHeaders ?? {})
    };
    for (const [header, val] of Object.entries(mergedHeaders)) {
      xhr.setRequestHeader(header, val);
    }

    const handleExternalAbort = () => {
      xhr.abort();
    };
    options.signal?.addEventListener('abort', handleExternalAbort, { once: true });

    const cleanup = () => {
      options.signal?.removeEventListener('abort', handleExternalAbort);
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
        options.onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100);
        resolve();
      } else {
        reject(
          new V3ClientError({
            status: xhr.status,
            code: 'R2_UPLOAD_FAILED',
            message: `Storage upload failed with status ${xhr.status}. Please retry.`
          })
        );
      }
    };

    xhr.onabort = () => {
      cleanup();
      reject(
        new V3ClientError({
          status: 0,
          code: 'ABORTED',
          message: 'Upload cancelled.'
        })
      );
    };

    xhr.ontimeout = () => {
      cleanup();
      reject(
        new V3ClientError({
          status: 408,
          code: 'UPLOAD_TIMEOUT',
          message: 'PDF upload timed out. Check your connection and try again.',
          isTimeout: true
        })
      );
    };

    xhr.onerror = () => {
      cleanup();
      reject(
        new V3ClientError({
          status: 0,
          code: 'R2_UPLOAD_NETWORK_ERROR',
          message: 'Network interruption during PDF upload. Please try again.'
        })
      );
    };

    xhr.send(options.file);
  });
}

export const v3Api = {
  auth: {
    getSession: (signal?: AbortSignal) =>
      requestJson<AuthSessionState>('/api/auth/session', { signal }),
    login: (body: LoginInput) =>
      requestJson<LoginResponse>('/api/auth/login', { method: 'POST', body }),
    signup: (body: SignupInput) =>
      requestJson<SignupResponse>('/api/auth/signup', { method: 'POST', body }),
    resendVerification: (body: ResendVerificationInput) =>
      requestJson<AuthMessageResponse>('/api/auth/resend', { method: 'POST', body }),
    forgotPassword: (body: ForgotPasswordInput) =>
      requestJson<AuthMessageResponse>('/api/auth/forgot-password', { method: 'POST', body }),
    updatePassword: (body: UpdatePasswordInput) =>
      requestJson<AuthMessageResponse>('/api/auth/update-password', { method: 'POST', body }),
    logout: () =>
      requestJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  },

  pdfs: {
    list: (query?: PdfListQuery, signal?: AbortSignal) =>
      requestJson<PdfListResponse>(
        `/api/pdfs${buildQueryString(query as Record<string, string | number | undefined>)}`,
        { signal }
      ),
    requestDownloadUrl: (idOrSlug: string) =>
      requestJson<PdfDownloadGrant>(
        `/api/pdfs/${encodeURIComponent(idOrSlug)}/download?mode=json`
      )
  },

  quizzes: {
    list: (query?: QuizListQuery, signal?: AbortSignal) =>
      requestJson<QuizListResponse>(
        `/api/quizzes${buildQueryString(query as Record<string, string | number | undefined>)}`,
        { signal }
      ),
    start: (idOrSlug: string, signal?: AbortSignal) =>
      requestJson<QuizStartResponse>(
        `/api/quizzes/${encodeURIComponent(idOrSlug)}/start`,
        { signal }
      ),
    checkPracticeAnswer: (
      idOrSlug: string,
      body: { questionId: string; selectedOption: string }
    ) =>
      requestJson<PracticeAnswerCheckResponse>(
        `/api/quizzes/${encodeURIComponent(idOrSlug)}/check-answer`,
        { method: 'POST', body }
      ),
    submitAttempt: (idOrSlug: string, body: QuizSubmitInput) =>
      requestJson<QuizSubmitResponse>(
        `/api/quizzes/${encodeURIComponent(idOrSlug)}/submit`,
        { method: 'POST', body, timeoutMs: 25_000 }
      )
  },

  me: {
    getProfile: (signal?: AbortSignal) =>
      requestJson<{
        data: {
          id: string;
          name: string | null;
          email: string;
          avatarUrl: string | null;
          provider: string;
          status: string;
          isAdmin: boolean;
          createdAt: string;
        };
      }>('/api/me', { signal }),
    updateProfile: (name: string) =>
      requestJson<{
        data: {
          id: string;
          name: string;
          email: string;
          provider: string;
          status: string;
          isAdmin: boolean;
        };
      }>('/api/me', { method: 'PATCH', body: { name } }),
    deleteAccount: () =>
      requestJson<void>('/api/me', {
        method: 'DELETE',
        body: { confirm: 'DELETE' }
      }),
    listAttempts: (query?: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
      requestJson<UserAttemptsResponse>(
        `/api/me/attempts${buildQueryString(query)}`,
        { signal }
      ),
    listDownloads: (query?: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
      requestJson<UserDownloadsResponse>(
        `/api/me/downloads${buildQueryString(query)}`,
        { signal }
      )
  },

  questionReports: {
    create: (body: { questionId: string; message: string }) =>
      requestJson<{
        data: {
          id: string;
          questionId: string;
          status: string;
          createdAt: string;
        };
      }>('/api/question-reports', {
        method: 'POST',
        body
      })
  },

  analytics: {
    recordVisit: (path: string) =>
      requestJson<VisitRecordResponse>('/api/analytics/visit', {
        method: 'POST',
        body: { path },
        keepalive: true,
        timeoutMs: 6_000
      })
  },

  admin: {
    analytics: {
      overview: (signal?: AbortSignal) =>
        requestJson<AdminOverviewAnalytics>('/api/admin/analytics/overview', { signal }),
      users: (
        query?: { page?: number; pageSize?: number; search?: string },
        signal?: AbortSignal
      ) =>
        requestJson<AdminUsersAnalyticsResponse>(
          `/api/admin/analytics/users${buildQueryString(query)}`,
          { signal }
        ),
      quizzes: (signal?: AbortSignal) =>
        requestJson<AdminQuizAnalyticsResponse>('/api/admin/analytics/quizzes', { signal }),
      pdfs: (signal?: AbortSignal) =>
        requestJson<AdminPdfAnalyticsResponse>('/api/admin/analytics/pdfs', { signal })
    },
    pdfs: {
      list: (query?: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
        requestJson<AdminPdfInventoryResponse>(
          `/api/admin/pdfs${buildQueryString(query)}`,
          { signal }
        ),
      createUploadUrl: (body: AdminUploadUrlRequest) =>
        requestJson<AdminUploadUrlResponse>('/api/admin/pdfs/upload-url', {
          method: 'POST',
          body
        }),
      create: (body: CreatePdfInput) =>
        requestJson<{ item: PdfResourceRow }>('/api/admin/pdfs', { method: 'POST', body }),
      update: (id: string, body: UpdatePdfInput) =>
        requestJson<{ item: PdfResourceRow }>(`/api/admin/pdfs/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body
        }),
      remove: (id: string) =>
        requestJson<{ ok: boolean }>(`/api/admin/pdfs/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        })
    },
    quizzes: {
      list: (query?: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
        requestJson<AdminQuizInventoryResponse>(
          `/api/admin/quizzes${buildQueryString(query)}`,
          { signal }
        ),
      create: (body: CreateQuizInput) =>
        requestJson<{ item: QuizRow }>('/api/admin/quizzes', { method: 'POST', body }),
      update: (id: string, body: UpdateQuizInput) =>
        requestJson<{ item: QuizRow }>(`/api/admin/quizzes/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body
        }),
      remove: (id: string) =>
        requestJson<{ ok: boolean }>(`/api/admin/quizzes/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        })
    },
    questions: {
      list: (
        query?: {
          page?: number;
          pageSize?: number;
          quizId?: string;
          subject?: string;
          examTag?: string;
          difficulty?: string;
        },
        signal?: AbortSignal
      ) =>
        requestJson<AdminQuestionInventoryResponse>(
          `/api/admin/questions${buildQueryString(query)}`,
          { signal }
        ),
      create: (body: CreateQuestionInput) =>
        requestJson<{ item: QuizQuestionRow }>('/api/admin/questions', {
          method: 'POST',
          body
        }),
      update: (id: string, body: UpdateQuestionInput) =>
        requestJson<{ item: QuizQuestionRow }>(
          `/api/admin/questions/${encodeURIComponent(id)}`,
          { method: 'PATCH', body }
        ),
      remove: (id: string) =>
        requestJson<{ ok: boolean }>(`/api/admin/questions/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        }),
      bulkImport: (body: BulkImportQuestionsInput) =>
        requestJson<BulkImportResult>('/api/admin/questions/import', {
          method: 'POST',
          body,
          timeoutMs: 30_000
        })
    },
    storage: {
      get: (signal?: AbortSignal) =>
        requestJson<{
          data: {
            usedBytes: number;
            allowanceBytes: number;
            objectCount: number;
            checkedAt: string;
            cached: boolean;
            largest?: Array<{ key: string; sizeBytes: number; lastModified?: string }>;
          };
        }>('/api/admin/storage', { signal })
    },
    attempts: {
      list: (
        query?: {
          page?: number;
          pageSize?: number;
          quizId?: string;
          userId?: string;
          from?: string;
          to?: string;
          status?: 'all' | 'passed' | 'failed';
        },
        signal?: AbortSignal
      ) =>
        requestJson<{
          data: Array<{
            id: string;
            userId: string;
            userEmail: string;
            userName: string | null;
            quizId: string;
            quizTitle: string;
            score: number;
            maxScore: number;
            percentage: number;
            passed: boolean;
            correctCount: number;
            incorrectCount: number;
            unansweredCount: number;
            timeTakenSeconds: number | null;
            autoSubmitted: boolean;
            createdAt: string;
          }>;
          pagination: { page: number; pageSize: number; total: number; totalPages: number };
        }>(`/api/admin/attempts${buildQueryString(query as Record<string, string | number | undefined>)}`, {
          signal
        })
    },
    users: {
      list: (
        query?: { page?: number; pageSize?: number; q?: string; status?: string; sort?: string },
        signal?: AbortSignal
      ) =>
        requestJson<{
          data: Array<{
            id: string;
            clerkUserId: string;
            email: string;
            displayName: string | null;
            authProvider: string;
            status: string;
            blockedReason: string | null;
            role: string;
            isAdmin: boolean;
            totalQuizzesAttempted: number;
            averageScorePercentage: number;
            totalPdfDownloads: number;
            createdAt: string;
            lastActiveAt: string;
          }>;
          meta: { page: number; pageSize: number; total: number; totalPages: number };
        }>(`/api/admin/users${buildQueryString(query as Record<string, string | number | undefined>)}`, {
          signal
        }),
      get: (id: string, signal?: AbortSignal) =>
        requestJson<{ data: { profile: unknown; attempts: unknown[]; downloads: unknown[] } }>(
          `/api/admin/users/${encodeURIComponent(id)}`,
          { signal }
        ),
      updateStatus: (id: string, body: { status: 'active' | 'blocked'; reason?: string }) =>
        requestJson<{ data: { id: string; status: string; blockedReason: string | null } }>(
          `/api/admin/users/${encodeURIComponent(id)}/status`,
          { method: 'PATCH', body }
        )
    },
    notifications: {
      list: (
        query?: { page?: number; pageSize?: number; unreadOnly?: string; type?: string },
        signal?: AbortSignal
      ) =>
        requestJson<{
          data: Array<{
            id: string;
            type: string;
            title: string;
            message: string;
            isRead: boolean;
            createdAt: string;
          }>;
          meta: { page: number; pageSize: number; total: number; totalPages: number; unreadCount: number };
        }>(`/api/admin/notifications${buildQueryString(query as Record<string, string | number | undefined>)}`, {
          signal
        }),
      markRead: (body: { all: true } | { ids: string[] }) =>
        requestJson<{ data: { ok: boolean; markedAt: string } }>(
          '/api/admin/notifications/read',
          { method: 'POST', body }
        )
    },
    activity: {
      list: (
        query?: { page?: number; pageSize?: number; adminId?: string; action?: string },
        signal?: AbortSignal
      ) =>
        requestJson<{
          data: Array<{
            id: string;
            adminId: string;
            adminEmail: string;
            action: string;
            entityType: string;
            entityId: string | null;
            details: Record<string, unknown> | null;
            createdAt: string;
          }>;
          meta: { page: number; pageSize: number; total: number; totalPages: number };
        }>(`/api/admin/activity${buildQueryString(query as Record<string, string | number | undefined>)}`, {
          signal
        })
    },
    reports: {
      list: (
        query?: { page?: number; pageSize?: number; status?: string },
        signal?: AbortSignal
      ) =>
        requestJson<{
          data: Array<{
            id: string;
            questionId: string;
            reportedBy: string;
            reporterEmail: string;
            message: string;
            status: string;
            adminNote: string | null;
            createdAt: string;
          }>;
          meta: { page: number; pageSize: number; total: number; totalPages: number };
        }>(`/api/admin/reports${buildQueryString(query as Record<string, string | number | undefined>)}`, {
          signal
        }),
      update: (id: string, body: { status: string; adminNote?: string }) =>
        requestJson<{ data: { id: string; status: string; adminNote: string | null } }>(
          `/api/admin/reports/${encodeURIComponent(id)}`,
          { method: 'PATCH', body }
        )
    }
  }
};

