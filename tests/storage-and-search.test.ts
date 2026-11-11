import { describe, it, expect } from 'vitest';
import {
  createVersionedStorage,
  MemoryStorageBackend,
  STORAGE_KEYS,
  type StorageBackend
} from '@/lib/storage';
import { PortalSearchEngine } from '@/lib/search';
import { loadDefaultSnapshot } from '@/lib/data';
import { buildCorrectionMailtoUrl } from '@/lib/feedback/mailto';

describe('Versioned Storage, MiniSearch & Mailto Composer', () => {
  it('saves, loads, invalidates on datasetVersion change, and drops corrupted JSON cleanly', () => {
    const backend = new MemoryStorageBackend();
    const clientV1 = createVersionedStorage<{ score: number }>({
      key: STORAGE_KEYS.GEOGRAPHY_QUIZ,
      datasetVersion: 'v1-abc',
      backend
    });

    clientV1.save({ score: 9 });
    expect(clientV1.load()).toEqual({ score: 9 });

    // Simulate corrupt JSON payload
    backend.setItem(STORAGE_KEYS.GEOGRAPHY_QUIZ, '{broken_json');
    expect(clientV1.load()).toBeNull();

    // Save again then migrate datasetVersion -> stale entry must clear cleanly
    clientV1.save({ score: 15 });
    const clientV2 = createVersionedStorage<{ score: number }>({
      key: STORAGE_KEYS.GEOGRAPHY_QUIZ,
      datasetVersion: 'v1-def',
      backend
    });
    expect(clientV2.load()).toBeNull();
  });

  it('falls back silently to in-memory storage when localStorage throws', () => {
    const throwingBackend: StorageBackend = {
      getItem: () => {
        throw new Error('SecurityError: storage disabled');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      }
    };

    const client = createVersionedStorage<{ step: number }>({
      key: STORAGE_KEYS.MCQ_SESSION,
      datasetVersion: 'v1-mem',
      backend: throwingBackend
    });

    const result = client.save({ step: 4 });
    expect(result.persisted).toBe(true);
    expect(result.usedFallback).toBe(true);
    client.clear();
  });

  it('indexes and searches countries, PDFs, PPSC posts, and MCQs with typo tolerance and serialization round-trip', () => {
    const snapshot = loadDefaultSnapshot();
    const engine = PortalSearchEngine.fromDataset(snapshot);
    const serialized = engine.toJSON();
    const restored = PortalSearchEngine.fromSerializedJson(serialized);

    expect(restored.search('a')).toEqual([]);
    expect(restored.search('   ')).toEqual([]);

    const typoHits = restored.search('Islambad');
    expect(typoHits.some((h) => h.type === 'country' && h.title === 'Pakistan')).toBe(true);

    const pdfHits = restored.search('Intelligence Officer');
    expect(
      pdfHits.some(
        (h) =>
          h.type === 'pdf' &&
          h.url.includes('(Set 01) Intelligence Officer PPSC (BS-14) 500+ MCQS By Doc Mubashir Chaudhry (1).pdf')
      )
    ).toBe(true);

    const mcqHits = restored.search('Ctrl + Z');
    expect(mcqHits.some((h) => h.type === 'question')).toBe(true);

    // Non-ASCII Urdu query should run safely without error
    expect(() => restored.search('اردو')).not.toThrow();
  });

  it('builds encoded mailto links for errata citations without any backend POST requirement', () => {
    const uri = buildCorrectionMailtoUrl({
      fullName: 'Ali Raza',
      senderEmail: 'ali@example.com',
      category: 'errata',
      referenceTitle: 'Set 01 MCQ #12',
      message: 'Verified against official PPSC gazette.'
    });

    expect(uri.startsWith('mailto:faculty@docmubashirchaudhary.com?subject=')).toBe(true);
    expect(decodeURIComponent(uri)).toContain('[Errata / Question Key Discrepancy] Set 01 MCQ #12');
    expect(decodeURIComponent(uri)).toContain('Verified against official PPSC gazette.');
  });
});

