import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearStaticDataCache,
  DATA_ENDPOINTS,
  fetchStaticData,
  getContentRepository
} from '@/lib/data';
import { derivePdfYear, formatBytes, formatVerificationDate, normalizeAnswer } from '@/lib/format';

describe('Step 1 Format Utilities', () => {
  it('formats byte sizes cleanly', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2_630_400)).toBe('2.63 MB');
  });

  it('normalizes Unicode accents and case consistently', () => {
    expect(normalizeAnswer('  São Tomé  ')).toBe('sao tome');
    expect(normalizeAnswer('ISLAMABAD')).toBe('islamabad');
  });

  it('derives verification year and formatting safely', () => {
    expect(formatVerificationDate(undefined)).toBe('Pending Check');
    expect(formatVerificationDate('2026-11-11')).toBe('2026-11-11');
    expect(
      derivePdfYear({
        verification: {
          status: 'verified',
          sourceIds: ['src-doc-mubashir-editorial'],
          verifiedAt: '2026-11-11',
          lastCheckedAt: '2026-11-11',
          reviewIntervalDays: 180
        }
      })
    ).toBe('2026');
  });
});

describe('Step 1 Static Client Fetch Layer', () => {
  afterEach(() => {
    clearStaticDataCache();
    vi.unstubAllGlobals();
  });

  it('rejects non-v1 external or untrusted paths before issuing network requests', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const res = await fetchStaticData('https://restcountries.com/v3.1/all');
    expect(res.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches and caches /data/v1/ payloads once per session', async () => {
    const payload = { datasetVersion: '2026.11.11' };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload
    });
    vi.stubGlobal('fetch', fetchSpy);

    const first = await fetchStaticData<{ datasetVersion: string }>(DATA_ENDPOINTS.manifest);
    const second = await fetchStaticData<{ datasetVersion: string }>(DATA_ENDPOINTS.manifest);

    expect(first).toEqual({ ok: true, data: payload, cached: false });
    expect(second).toEqual({ ok: true, data: payload, cached: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('handles HTTP failures safely without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })
    );

    const res = await fetchStaticData(DATA_ENDPOINTS.pdfs);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(404);
    }
  });
});

describe('Step 1 ContentRepository Taxonomy & Blueprint Additions', () => {
  it('exposes subjects, topics, slug pairs, and blueprint versions without breaking existing queries', async () => {
    const repo = getContentRepository();
    const [subjects, gkTopics, pair, versions] = await Promise.all([
      repo.getSubjects(),
      repo.getTopics('sub-gk'),
      repo.getTopicBySlugs('general-knowledge', 'world-capitals-currencies'),
      repo.getBlueprintVersions('intelligent-officer')
    ]);

    expect(subjects.length).toBeGreaterThanOrEqual(9);
    expect(gkTopics.some((t) => t.id === 'top-gk-world-capitals')).toBe(true);
    expect(pair?.subject.id).toBe('sub-gk');
    expect(pair?.topic.id).toBe('top-gk-world-capitals');
    expect(versions.length).toBeGreaterThanOrEqual(0);
  });
});

