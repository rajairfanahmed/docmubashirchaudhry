export const STORAGE_KEYS = {
  GEOGRAPHY_QUIZ: 'dmc:v1:geography-quiz',
  MCQ_SESSION: 'dmc:v1:mcq'
} as const;

export const QUIZ_DRAFT_PREFIX = 'dmc:v3:quiz-draft:' as const;

export const STORAGE_SCHEMA_VERSION = 1 as const;

export interface StorageEnvelope<T> {
  version: number;
  datasetVersion: string;
  updatedAt: string;
  payload: T;
}

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * In-memory fallback adapter used during SSR or when browser storage is blocked/full.
 */
export class MemoryStorageBackend implements StorageBackend {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const fallbackMemoryBackend = new MemoryStorageBackend();

function resolveStorageBackend(customBackend?: StorageBackend): {
  backend: StorageBackend;
  isMemoryFallback: boolean;
} {
  if (customBackend) {
    return { backend: customBackend, isMemoryFallback: false };
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probeKey = '__dmc_storage_probe__';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      return { backend: window.localStorage, isMemoryFallback: false };
    }
  } catch {
    // Fall through to memory storage when SecurityError or QuotaExceededError occurs
  }
  return { backend: fallbackMemoryBackend, isMemoryFallback: true };
}

export interface VersionedStorageClient<T> {
  load(): T | null;
  save(payload: T): { persisted: boolean; usedFallback: boolean };
  clear(): void;
  exportJson(): string | null;
}

/**
 * Versioned localStorage wrapper that automatically invalidates corrupt JSON,
 * mismatched schema versions, or outdated dataset versions, with safe memory fallback.
 */
export function createVersionedStorage<T>(params: {
  key: string;
  datasetVersion: string;
  validate?: (payload: unknown) => payload is T;
  backend?: StorageBackend;
}): VersionedStorageClient<T> {
  const { key, datasetVersion, validate, backend } = params;

  const load = (): T | null => {
    const resolved = resolveStorageBackend(backend);
    let raw: string | null = null;
    try {
      raw = resolved.backend.getItem(key);
    } catch {
      raw = fallbackMemoryBackend.getItem(key);
    }
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<StorageEnvelope<unknown>>;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        parsed.version !== STORAGE_SCHEMA_VERSION ||
        parsed.datasetVersion !== datasetVersion ||
        !('payload' in parsed)
      ) {
        clear();
        return null;
      }

      if (validate && !validate(parsed.payload)) {
        clear();
        return null;
      }

      return parsed.payload as T;
    } catch {
      clear();
      return null;
    }
  };

  const save = (payload: T): { persisted: boolean; usedFallback: boolean } => {
    const envelope: StorageEnvelope<T> = {
      version: STORAGE_SCHEMA_VERSION,
      datasetVersion,
      updatedAt: new Date().toISOString(),
      payload
    };
    const serialized = JSON.stringify(envelope);
    const resolved = resolveStorageBackend(backend);

    try {
      resolved.backend.setItem(key, serialized);
      return { persisted: true, usedFallback: resolved.isMemoryFallback };
    } catch {
      fallbackMemoryBackend.setItem(key, serialized);
      return { persisted: true, usedFallback: true };
    }
  };

  const clear = (): void => {
    const resolved = resolveStorageBackend(backend);
    try {
      resolved.backend.removeItem(key);
    } catch {
      // Ignore storage access errors during cleanup
    }
    fallbackMemoryBackend.removeItem(key);
  };

  const exportJson = (): string | null => {
    const current = load();
    if (!current) return null;
    return JSON.stringify(
      {
        key,
        version: STORAGE_SCHEMA_VERSION,
        datasetVersion,
        exportedAt: new Date().toISOString(),
        payload: current
      },
      null,
      2
    );
  };

  return { load, save, clear, exportJson };
}

export function clearAllPortalProgress(backend?: StorageBackend): void {
  Object.values(STORAGE_KEYS).forEach((storageKey) => {
    createVersionedStorage({
      key: storageKey,
      datasetVersion: 'clear',
      backend
    }).clear();
  });
}

export interface V3QuizDraftPayload {
  quizId: string;
  startedAt: string;
  answers: Record<string, string | null>;
}

/**
 * Local answer draft buffer providing resilience during active /quizzes/[slug] sessions
 * before permanent server-side submission to /api/quizzes/[id]/submit.
 */
export function createQuizDraftStorage(
  quizId: string,
  backend?: StorageBackend
): VersionedStorageClient<V3QuizDraftPayload> {
  return createVersionedStorage<V3QuizDraftPayload>({
    key: `${QUIZ_DRAFT_PREFIX}${quizId}`,
    datasetVersion: `v3:${quizId}`,
    validate: (payload): payload is V3QuizDraftPayload =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'quizId' in payload &&
          'answers' in payload &&
          typeof (payload as V3QuizDraftPayload).answers === 'object'
      ),
    backend
  });
}

