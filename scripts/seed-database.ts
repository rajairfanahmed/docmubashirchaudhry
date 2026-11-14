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
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const client = createClient(url, key);

async function seed() {
  console.log('Seeding initial quizzes and questions into Supabase...');

  // 1. Quizzes
  const quizzes: Record<string, unknown>[] = [
    {
      id: 'a1b2c3d4-0001-4000-8000-000000000001',
      slug: 'ppsc-intelligence-officer-full-mock',
      title: 'PPSC Intelligence Officer (BS-16) Full Mock Exam',
      description: 'Timed competitive simulation modeled on the official PPSC syllabus covering General Knowledge, Pakistan Affairs, and Computer Basics.',
      type: 'mock',
      subject: 'Multiple Subjects',
      exam_tag: 'PPSC',
      time_limit_seconds: 5400,
      negative_marking: true,
      negative_marking_value: 0.25,
      pass_percentage: 40.0,
      language: 'en',
      is_published: true
    },
    {
      id: 'a1b2c3d4-0002-4000-8000-000000000002',
      slug: 'world-geography-capitals-practice',
      title: 'World Geography & Capitals Practice Quiz',
      description: 'Self-paced untimed practice quiz covering sovereign state capitals, geographical coordinates, and international borders.',
      type: 'practice',
      subject: 'Geography',
      exam_tag: 'PPSC',
      time_limit_seconds: null,
      negative_marking: false,
      negative_marking_value: 0.0,
      pass_percentage: 50.0,
      language: 'en',
      is_published: true
    }
  ];

  for (const q of quizzes) {
    const { error } = await client.from('quizzes').upsert(q, { onConflict: 'slug' });
    if (error) console.error('Quiz upsert error:', error.message);
    else console.log(`  ✓ Quiz ready: ${q.title}`);
  }

  // 2. Questions: Kept strictly clean for real admin authoring
  console.log('  ✓ Question bank reserved for real administrative authoring');

  // 3. PDF Resources: Kept strictly clean for real admin uploads to Cloudflare R2
  console.log('  ✓ PDF repository reserved for real administrative uploads');

  console.log('\nSeed completed successfully!');
}

seed().catch(console.error);
