import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Question } from '../src/lib/schemas';
import questionsData from '../src/data/questions/ppsc/general-knowledge.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function main(): void {
  const outArg = process.argv[2] || path.join(rootDir, 'dist', 'ppsc-questions-export.csv');
  fs.mkdirSync(path.dirname(outArg), { recursive: true });

  const header = [
    'id',
    'stem',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correctOptionId',
    'explanation',
    'difficulty',
    'topicIds',
    'postIds',
    'attribution',
    'status',
    'verificationStatus',
    'sourceIds'
  ];

  const rows = (questionsData.questions as Question[]).map((q) => {
    const byId = new Map(q.options.map((o) => [o.id, o.text]));
    return [
      q.id,
      q.stem,
      byId.get('a') ?? '',
      byId.get('b') ?? '',
      byId.get('c') ?? '',
      byId.get('d') ?? '',
      q.correctOptionId,
      q.explanation,
      q.difficulty,
      q.topicIds.join('|'),
      (q.postIds ?? []).join('|'),
      q.attribution,
      q.status,
      q.verification.status,
      q.verification.sourceIds.join('|')
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  fs.writeFileSync(outArg, [header.join(','), ...rows].join('\n') + '\n', 'utf8');
  console.log(`Exported ${rows.length} questions to ${outArg}`);
}

main();

