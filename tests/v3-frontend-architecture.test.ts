import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildGoogleOAuthUrl,
  isV3ClientError,
  sanitizeClientNextPath,
  v3Api
} from '@/lib/v3/client';
import { createQuizDraftStorage, MemoryStorageBackend } from '@/lib/storage/persistence';
import { TIMER_STATE_TOKENS, V3_SURFACE_TOKENS } from '@/lib/tokens/visual-tokens';

function readProjectFile(...segments: string[]): string {
  return fs.readFileSync(path.resolve(process.cwd(), ...segments), 'utf8');
}

describe('Step 01 Frontend Architecture Foundation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sanitizes relative next paths against open redirects when composing OAuth URLs', () => {
    expect(sanitizeClientNextPath('/library/resource/ppsc-set-1?download=1')).toBe(
      '/library/resource/ppsc-set-1?download=1'
    );
    expect(sanitizeClientNextPath('//evil.com')).toBe('/');
    expect(sanitizeClientNextPath('https://evil.com/phish')).toBe('/');
    expect(sanitizeClientNextPath('')).toBe('/');

    expect(buildGoogleOAuthUrl('/quizzes/ppsc-mock-1?autostart=1')).toBe(
      '/api/auth/oauth?provider=google&next=%2Fquizzes%2Fppsc-mock-1%3Fautostart%3D1'
    );
  });

  it('normalizes backend error envelopes and 429 Retry-After headers cleanly in v3Api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests.'
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '45'
          }
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      await v3Api.pdfs.requestDownloadUrl('sample-pdf');
      expect.unreachable('Expected v3Api.pdfs.requestDownloadUrl to throw V3ClientError');
    } catch (error) {
      expect(isV3ClientError(error)).toBe(true);
      if (isV3ClientError(error)) {
        expect(error.status).toBe(429);
        expect(error.code).toBe('RATE_LIMITED');
        expect(error.retryAfterSeconds).toBe(45);
      }
    }
  });

  it('persists and clears active quiz draft answers cleanly with local fallback storage', () => {
    const backend = new MemoryStorageBackend();
    const draft = createQuizDraftStorage('quiz-uuid-1', backend);

    expect(draft.load()).toBeNull();
    draft.save({
      quizId: 'quiz-uuid-1',
      startedAt: '2026-11-12T07:00:00.000Z',
      answers: { 'q-1': 'B', 'q-2': null }
    });

    expect(draft.load()).toEqual({
      quizId: 'quiz-uuid-1',
      startedAt: '2026-11-12T07:00:00.000Z',
      answers: { 'q-1': 'B', 'q-2': null }
    });

    draft.clear();
    expect(draft.load()).toBeNull();
  });

  it('registers additive v3.0 token slots in visual-tokens.ts and globals.css', () => {
    const css = readProjectFile('src', 'app', 'globals.css');
    const allRefs = [
      ...Object.values(V3_SURFACE_TOKENS),
      ...Object.values(TIMER_STATE_TOKENS).flatMap((group) => Object.values(group))
    ];

    for (const ref of allRefs) {
      expect(ref).toMatch(/^var\(--dmc-/);
      const varName = ref.slice(4, -1);
      expect(css).toContain(`${varName}:`);
    }
  });

  it('keeps Noto Nastaliq Urdu out of root layout while isolating admin routes and wiring v3 providers', () => {
    const rootLayout = readProjectFile('src', 'app', 'layout.tsx');
    const providers = readProjectFile('src', 'app', 'providers.tsx');
    const quizRunnerPage = readProjectFile('src', 'app', 'quizzes', '[slug]', 'page.tsx');
    const adminLayout = readProjectFile('src', 'app', 'admin', 'layout.tsx');

    expect(rootLayout).not.toContain('Noto_Nastaliq_Urdu');
    expect(rootLayout).not.toContain('notoNastaliqUrdu');
    expect(rootLayout).toContain('RouteChromeGate');

    expect(providers).toContain('MotionConfig');
    expect(providers).toContain('reducedMotion="user"');
    expect(providers).toContain('LazyMotion');
    expect(providers).toContain('AuthSessionProvider');
    expect(providers).toContain('AuthModalProvider');
    expect(providers).toContain('VisitTracker');

    expect(quizRunnerPage).toContain('notoNastaliqUrdu.variable');
    expect(adminLayout).toContain('AdminShell');
    expect(adminLayout).toContain('getOptionalSessionUser');
  });
});

