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

  // 2. Questions
  const questions = [
    {
      id: 'b1c2d3e4-0001-4000-8000-000000000001',
      quiz_id: 'a1b2c3d4-0001-4000-8000-000000000001',
      subject: 'Computer Science',
      exam_tag: 'PPSC',
      difficulty: 'easy',
      language: 'en',
      text_en: 'Which keyboard shortcut reverses (undoes) the last edit in Microsoft Word and Windows applications?',
      options: [
        { id: 'a', text: 'Ctrl + Y' },
        { id: 'b', text: 'Ctrl + Z' },
        { id: 'c', text: 'Ctrl + X' },
        { id: 'd', text: 'Ctrl + U' }
      ],
      correct_option: 'b',
      explanation: 'Ctrl + Z performs Undo, whereas Ctrl + Y repeats/redoes an action, Ctrl + X cuts selected items, and Ctrl + U toggles underline formatting.',
      sort_order: 1
    },
    {
      id: 'b1c2d3e4-0002-4000-8000-000000000002',
      quiz_id: 'a1b2c3d4-0001-4000-8000-000000000001',
      subject: 'Computer Science',
      exam_tag: 'PPSC',
      difficulty: 'easy',
      language: 'en',
      text_en: 'Which type of computer memory is volatile and loses its stored contents immediately when electrical power is turned off?',
      options: [
        { id: 'a', text: 'ROM (Read-Only Memory)' },
        { id: 'b', text: 'RAM (Random Access Memory)' },
        { id: 'c', text: 'SSD (Solid State Drive)' },
        { id: 'd', text: 'Optical Blu-ray Disc' }
      ],
      correct_option: 'b',
      explanation: 'RAM requires continuous power to retain active instructions and data; ROM and secondary drives (SSD/optical disks) are non-volatile.',
      sort_order: 2
    },
    {
      id: 'b1c2d3e4-0003-4000-8000-000000000003',
      quiz_id: 'a1b2c3d4-0001-4000-8000-000000000001',
      subject: 'Pakistan Affairs',
      exam_tag: 'PPSC',
      difficulty: 'medium',
      language: 'en',
      text_en: 'On which date did the Constitution of the Islamic Republic of Pakistan (1973) come into formal force?',
      options: [
        { id: 'a', text: '23 March 1973' },
        { id: 'b', text: '10 April 1973' },
        { id: 'c', text: '14 August 1973' },
        { id: 'd', text: '12 April 1973' }
      ],
      correct_option: 'c',
      explanation: 'The National Assembly passed the 1973 Constitution on 10 April 1973, it was authenticated on 12 April 1973, and came into force on 14 August 1973.',
      sort_order: 3
    },
    {
      id: 'b1c2d3e4-0004-4000-8000-000000000004',
      quiz_id: 'a1b2c3d4-0001-4000-8000-000000000001',
      subject: 'General Knowledge',
      exam_tag: 'PPSC',
      difficulty: 'medium',
      language: 'en',
      text_en: 'Where is the permanent Secretariat of the Shanghai Cooperation Organisation (SCO) located?',
      options: [
        { id: 'a', text: 'Astana' },
        { id: 'b', text: 'Beijing' },
        { id: 'c', text: 'Tashkent' },
        { id: 'd', text: 'Moscow' }
      ],
      correct_option: 'b',
      explanation: 'The SCO Secretariat is headquartered in Beijing, China, while its Regional Anti-Terrorist Structure (RATS) Executive Committee is based in Tashkent, Uzbekistan.',
      sort_order: 4
    },
    {
      id: 'b1c2d3e4-0005-4000-8000-000000000005',
      quiz_id: 'a1b2c3d4-0002-4000-8000-000000000002',
      subject: 'Geography',
      exam_tag: 'PPSC',
      difficulty: 'easy',
      language: 'en',
      text_en: 'What is the official capital city of Australia?',
      options: [
        { id: 'a', text: 'Sydney' },
        { id: 'b', text: 'Melbourne' },
        { id: 'c', text: 'Canberra' },
        { id: 'd', text: 'Brisbane' }
      ],
      correct_option: 'c',
      explanation: 'Canberra was selected as the compromise site for the federal capital between Sydney and Melbourne in 1908.',
      sort_order: 1
    },
    {
      id: 'b1c2d3e4-0006-4000-8000-000000000006',
      quiz_id: 'a1b2c3d4-0002-4000-8000-000000000002',
      subject: 'Geography',
      exam_tag: 'PPSC',
      difficulty: 'medium',
      language: 'en',
      text_en: 'What is the official currency of Japan?',
      options: [
        { id: 'a', text: 'Won' },
        { id: 'b', text: 'Yen' },
        { id: 'c', text: 'Yuan' },
        { id: 'd', text: 'Ringgit' }
      ],
      correct_option: 'b',
      explanation: 'The official currency of Japan is the Japanese Yen (JPY, symbol: ¥).',
      sort_order: 2
    }
  ];

  for (const q of questions) {
    const { error } = await client.from('quiz_questions').upsert(q, { onConflict: 'id' });
    if (error) console.error('Question upsert error:', error.message);
    else console.log(`  ✓ Question ready: ${q.text_en.slice(0, 45)}...`);
  }

  // 3. PDF Resources
  const pdfs = [
    {
      id: 'c1d2e3f4-0001-4000-8000-000000000001',
      slug: 'ppsc-intelligence-officer-past-paper-2023-solved',
      title: 'PPSC Intelligence Officer Past Paper 2023 (Verified Solved)',
      description: 'Complete authentic 100-question past paper with verified answers, official syllabus notes, and candidate guidance.',
      subject: 'Pakistan Affairs',
      exam_tag: 'PPSC',
      year: 2023,
      language: 'en',
      page_count: 14,
      file_bytes: 1420500,
      file_key: 'pdfs/ppsc/ppsc-intelligence-officer-2023-solved.pdf',
      sha256: 'a1b2c3d4e5f6',
      is_published: true,
      download_count: 0
    },
    {
      id: 'c1d2e3f4-0002-4000-8000-000000000002',
      slug: 'world-geography-country-capitals-reference-handbook',
      title: 'World Geography: Comprehensive Country Capitals Handbook',
      description: 'Reference handbook listing all 250 ISO 3166-1 sovereign states, official capitals, currency designations, and UN M49 regions.',
      subject: 'Geography',
      exam_tag: 'PPSC',
      year: 2026,
      language: 'en',
      page_count: 22,
      file_bytes: 2150000,
      file_key: 'pdfs/geography/world-geography-handbook-2026.pdf',
      sha256: 'f6e5d4c3b2a1',
      is_published: true,
      download_count: 0
    }
  ];

  for (const p of pdfs) {
    const { error } = await client.from('pdf_resources').upsert(p, { onConflict: 'slug' });
    if (error) console.error('PDF upsert error:', error.message);
    else console.log(`  ✓ PDF ready: ${p.title}`);
  }

  console.log('\nSeed completed successfully!');
}

seed().catch(console.error);
