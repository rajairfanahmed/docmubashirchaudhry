import type { PdfResource } from '@/lib/schemas';

/**
 * Formats byte sizes deterministically for PDF cards and detail panels.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

/**
 * Formats ISO calendar date strings (YYYY-MM-DD) for verification displays.
 */
export function formatVerificationDate(isoDate?: string): string {
  if (!isoDate) return 'Pending Check';
  return isoDate;
}

/**
 * Derives publication year cleanly until explicit publicationYear field exists on PdfResourceSchema.
 */
export function derivePdfYear(
  pdf: Pick<PdfResource, 'verification'> & { publicationYear?: number }
): string {
  if (typeof pdf.publicationYear === 'number') {
    return String(pdf.publicationYear);
  }
  const candidate = pdf.verification.verifiedAt ?? pdf.verification.lastCheckedAt;
  return candidate ? candidate.slice(0, 4) : 'Unlisted';
}

/**
 * Normalizes geography and MCQ answer strings with Unicode accent folding.
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

