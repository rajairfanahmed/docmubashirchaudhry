import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pdfResourcesData from '../src/data/resources/pdf-resources.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const docsDir = path.join(publicDir, 'documents');

function walkPdfFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkPdfFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      files.push(full);
    }
  }
  return files;
}

function main(): void {
  const registeredByPath = new Map(
    pdfResourcesData.pdfResources.map((p) => [p.filePath, p])
  );
  const diskFiles = walkPdfFiles(docsDir);
  const seenHashes = new Map<string, string[]>();

  console.log('=== PDF Asset Integrity Audit ===');
  for (const absPath of diskFiles) {
    const webPath = '/' + path.relative(publicDir, absPath).replace(/\\/g, '/');
    const buf = fs.readFileSync(absPath);
    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    const isPdfHeader = buf.subarray(0, 5).toString('ascii') === '%PDF-';
    const manifestEntry = registeredByPath.get(webPath);

    const existing = seenHashes.get(sha256) ?? [];
    existing.push(webPath);
    seenHashes.set(sha256, existing);

    const statusTag = manifestEntry
      ? manifestEntry.sha256 === sha256 && manifestEntry.fileSizeBytes === buf.length && isPdfHeader
        ? 'VERIFIED'
        : 'MISMATCH'
      : 'UNREGISTERED_DUPLICATE_OR_EXTRA';

    console.log(
      `[${statusTag}] ${webPath} | ${buf.length} bytes | %PDF=${isPdfHeader} | sha256=${sha256}`
    );
  }

  for (const [hash, paths] of seenHashes.entries()) {
    if (paths.length > 1) {
      console.warn(`\nDuplicate binary hash ${hash.slice(0, 12)}... shared across ${paths.length} files:`);
      for (const p of paths) {
        console.warn(`  - ${p}`);
      }
    }
  }
}

main();

