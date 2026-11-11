import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDefaultSnapshot } from '../src/lib/data/json-repository';
import { validateDatasetBundle } from '../src/lib/validation/dataset-validator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function main(): void {
  const snapshot = loadDefaultSnapshot();
  const report = validateDatasetBundle(snapshot, {
    publicRootDir: path.join(rootDir, 'public'),
    referenceDate: new Date()
  });

  console.log('=== Dataset Validation Report ===');
  console.log('Counts:', JSON.stringify(report.counts));

  if (report.warnings.length > 0) {
    console.warn(`\nWarnings (${report.warnings.length}):`);
    for (const warn of report.warnings) {
      console.warn(`  [WARN] ${warn.ruleId} (${warn.entityType}:${warn.entityId ?? '-'}) -> ${warn.message}`);
    }
  }

  if (!report.valid) {
    console.error(`\nErrors (${report.errors.length}):`);
    for (const err of report.errors) {
      console.error(`  [FAIL] ${err.ruleId} (${err.entityType}:${err.entityId ?? '-'}) -> ${err.message}`);
    }
    process.exit(1);
  }

  console.log('\nValidation PASSED with 0 errors.');
}

main();

