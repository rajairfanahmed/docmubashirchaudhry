import fs from 'node:fs';
import { QuestionSchema } from '../src/lib/schemas';

/**
 * Parses RFC-4180 CSV rows safely without external dependencies.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"' && csvText[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && csvText[i + 1] === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function main(): void {
  const inputPath = process.argv[2];
  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error('Usage: npx tsx scripts/import-csv.ts <path-to-questions.csv> [output.json]');
    process.exit(1);
  }

  const rawCsv = fs.readFileSync(inputPath, 'utf8');
  const [headerRow, ...dataRows] = parseCsvRows(rawCsv);
  if (!headerRow || headerRow.length === 0) {
    console.error('CSV file is empty.');
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const imported: unknown[] = [];

  dataRows.forEach((cols, idx) => {
    if (cols.every((c) => c.trim() === '')) return;
    const record: Record<string, string> = {};
    headerRow.forEach((key, colIdx) => {
      record[key.trim()] = (cols[colIdx] ?? '').trim();
    });

    const candidate = {
      id: record.id,
      stem: record.stem,
      options: [
        { id: 'a', text: record.option_a },
        { id: 'b', text: record.option_b },
        { id: 'c', text: record.option_c },
        { id: 'd', text: record.option_d }
      ],
      correctOptionId: record.correctOptionId,
      explanation: record.explanation,
      difficulty: record.difficulty || 'medium',
      topicIds: (record.topicIds || '').split('|').filter(Boolean),
      postIds: (record.postIds || '').split('|').filter(Boolean),
      attribution: record.attribution || 'self_written',
      status: record.status || 'draft',
      verification: {
        status: record.verificationStatus || 'unverified',
        sourceIds: (record.sourceIds || '').split('|').filter(Boolean),
        verifiedAt: record.verificationStatus === 'verified' ? today : undefined,
        lastCheckedAt: today,
        reviewIntervalDays: 180
      }
    };

    const parsed = QuestionSchema.safeParse(candidate);
    if (!parsed.success) {
      console.error(`Row ${idx + 2} failed validation:`, parsed.error.issues);
      process.exit(1);
    }
    imported.push(parsed.data);
  });

  const outJson = JSON.stringify({ schemaVersion: 1, questions: imported }, null, 2) + '\n';
  if (process.argv[3]) {
    fs.writeFileSync(process.argv[3], outJson, 'utf8');
    console.log(`Validated and wrote ${imported.length} questions to ${process.argv[3]}`);
  } else {
    process.stdout.write(outJson);
  }
}

const isCliEntry = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/import-csv.ts');
if (isCliEntry) {
  main();
}

