import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile('.env.secrets.local');
loadEnvFile('.env.local');
loadEnvFile('.env');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials in .env or .env.secrets.local');
  process.exit(1);
}

const client = createClient(url, key);

const TABLES = [
  'profiles',
  'quizzes',
  'quiz_questions',
  'quiz_attempts',
  'pdf_resources',
  'pdf_access_log',
  'site_visits',
  'admin_notifications',
  'admin_activity_log',
  'question_reports',
  'storage_snapshots',
  'digest_runs',
  'webhook_events'
];

async function main() {
  console.log('\n=== Supabase PostgreSQL Database Table Verification ===\n');
  let missingCount = 0;

  for (const table of TABLES) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${table.padEnd(22)}: MISSING (Table not created yet in PostgreSQL)`);
      missingCount++;
    } else {
      console.log(`✅ ${table.padEnd(22)}: READY`);
    }
  }

  console.log('\n------------------------------------------------------------');
  if (missingCount === 0) {
    console.log('🎉 ALL 13 DATABASE TABLES ARE FULLY OPERATIONAL!\n');
  } else {
    console.log(`⚠️  ${missingCount} tables need to be created in Supabase.`);
    console.log(`👉 Simply open Supabase Dashboard -> SQL Editor and run supabase/COMPLETE_DATABASE_SETUP.sql\n`);
  }
}

main().catch((err) => {
  console.error('Fatal check error:', err);
  process.exit(1);
});
