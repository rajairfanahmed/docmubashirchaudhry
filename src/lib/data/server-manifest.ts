import fs from 'node:fs';
import path from 'node:path';

export interface ServerManifestSummary {
  datasetVersion: string;
  generatedAt: string | null;
}

let cachedManifest: ServerManifestSummary | null = null;

export function getServerManifest(): ServerManifestSummary {
  if (cachedManifest) return cachedManifest;
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'data', 'v1', 'manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as { datasetVersion?: unknown; generatedAt?: unknown };
    const datasetVersion =
      typeof parsed.datasetVersion === 'string' && parsed.datasetVersion.trim().length > 0
        ? parsed.datasetVersion
        : 'v1-fallback';
    const generatedAt =
      typeof parsed.generatedAt === 'string' && parsed.generatedAt.trim().length > 0
        ? parsed.generatedAt
        : null;
    cachedManifest = { datasetVersion, generatedAt };
    return cachedManifest;
  } catch {
    // Fallback cleanly if pre-built manifest is not present
  }
  return { datasetVersion: 'v1-fallback', generatedAt: null };
}

export function getServerDatasetVersion(): string {
  return getServerManifest().datasetVersion;
}

