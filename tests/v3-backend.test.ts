import { describe, it, expect } from 'vitest';
import {
  clampSignedUrlTtlSeconds,
  getAdminAllowList,
  isAdminEmail,
  parsePublicSupabaseConfig,
  parseR2Config,
  parseSecretSupabaseConfig
} from '@/lib/env';
import {
  buildPdfObjectKey,
  createPresignedPdfDownloadUrl,
  createPresignedPdfUploadUrl,
  isSafePdfObjectKey,
  sanitizeDownloadFilename
} from '@/lib/r2/client';
import { sanitizeNextPath } from '@/lib/auth/guards';
import { buildSecureAuthCookieOptions } from '@/lib/supabase/server';
import {
  checkSingleQuestionAnswer,
  gradeQuizAttempt,
  parseQuizQuestionsCsv,
  stripQuestionSecrets
} from '@/lib/v3/quiz-grading';
import {
  CreatePdfResourceSchema,
  CreateQuizSchema
} from '@/lib/v3/schemas';
import {
  aggregatePdfAnalytics,
  aggregateQuizAnalytics,
  buildThirtyDayVisitSeries
} from '@/lib/v3/analytics';
import type { QuizQuestionRow } from '@/lib/supabase/database.types';

const TEST_R2_CONFIG = {
  accountId: 'a8ad6735d7fb24f970343d818657f535',
  accessKeyId: 'testaccesskey123',
  secretAccessKey: 'testsecretkey1234567890abcdef',
  bucketName: 'docmubashirchaudhary',
  endpoint: 'https://a8ad6735d7fb24f970343d818657f535.r2.cloudflarestorage.com',
  signedUrlTtlSeconds: 180
};

describe('v3.0 Environment, Allow-List & Private R2 Signed URLs', () => {
  it('parses public/secret Supabase keys, R2 endpoint, and clamps signed URL TTL to [120, 300]s', () => {
    const pub = parsePublicSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://demo-project.supabase.co/',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_demo_key'
    });
    expect(pub).toEqual({
      url: 'https://demo-project.supabase.co',
      publishableKey: 'sb_publishable_demo_key'
    });

    const sec = parseSecretSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://demo-project.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_demo_key'
    });
    expect(sec).toEqual({
      url: 'https://demo-project.supabase.co',
      secretKey: 'sb_secret_demo_key'
    });

    const r2 = parseR2Config({
      CLOUDFLARE_R2_ACCOUNT_ID: 'a8ad6735d7fb24f970343d818657f535',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'accesskey1234',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'secretkey1234567890',
      CLOUDFLARE_R2_BUCKET_NAME: 'docmubashirchaudhary',
      CLOUDFLARE_R2_SIGNED_URL_TTL_SECONDS: '9999'
    });
    expect(r2?.endpoint).toBe('https://a8ad6735d7fb24f970343d818657f535.r2.cloudflarestorage.com');
    expect(r2?.signedUrlTtlSeconds).toBe(300);
    expect(clampSignedUrlTtlSeconds(30)).toBe(120);
    expect(clampSignedUrlTtlSeconds(undefined)).toBe(180);
  });

  it('enforces case-insensitive admin email allow-list and fails closed when empty', () => {
    expect(isAdminEmail('owner@example.com', {})).toBe(false);
    expect(getAdminAllowList({}).size).toBe(0);

    const env = { ADMIN_EMAILS: ' Doc.Mubashir@Example.com , second@example.com ' };
    expect(isAdminEmail('doc.mubashir@example.com', env)).toBe(true);
    expect(isAdminEmail('second@example.com', env)).toBe(true);
    expect(isAdminEmail('student@example.com', env)).toBe(false);
    expect(isAdminEmail(null, env)).toBe(false);

    const quotedAndSemicolon = {
      ADMIN_EMAILS: '"rajairfaniqra143@gmail.com; SECOND.OWNER@GMAIL.COM"'
    };
    expect(isAdminEmail('rajairfaniqra143@gmail.com', quotedAndSemicolon)).toBe(true);
    expect(isAdminEmail('second.owner@gmail.com', quotedAndSemicolon)).toBe(true);
  });

  it('prevents open redirects on OAuth next parameter and enforces httpOnly cookies', () => {
    expect(sanitizeNextPath('/library/ppsc?page=2')).toBe('/library/ppsc?page=2');
    expect(sanitizeNextPath('https://evil.example/phish')).toBe('/');
    expect(sanitizeNextPath('//evil.example')).toBe('/');
    expect(sanitizeNextPath('/\\evil.example')).toBe('/');
    expect(sanitizeNextPath('')).toBe('/');

    const opts = buildSecureAuthCookieOptions({ maxAge: 3600 });
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.path).toBe('/');
  });

  it('validates safe R2 object keys and generates private SigV4 presigned URLs without public r2.dev host', async () => {
    const key = buildPdfObjectKey('Set 01 Intelligence Officer (BS-14).pdf', new Date('2026-11-12T00:00:00Z'));
    expect(key).toMatch(/^pdfs\/2026\/11\/[a-f0-9-]+-set-01-intelligence-officer-bs-14\.pdf$/);
    expect(isSafePdfObjectKey(key)).toBe(true);
    expect(isSafePdfObjectKey('../secret.pdf')).toBe(false);
    expect(isSafePdfObjectKey('/pdfs/2026/a.pdf')).toBe(false);
    expect(isSafePdfObjectKey('pdfs/2026/a.exe')).toBe(false);

    expect(sanitizeDownloadFilename('../../Set 01 (PPSC)<script>.pdf')).toBe(
      '.. .. Set 01 PPSC script.pdf'
    );

    const upload = await createPresignedPdfUploadUrl({
      filename: 'ppsc-gk.pdf',
      contentType: 'application/pdf',
      fileSizeBytes: 2500000,
      config: TEST_R2_CONFIG
    });
    expect(upload.uploadUrl).toContain('.r2.cloudflarestorage.com');
    expect(upload.uploadUrl).toContain('X-Amz-Signature=');
    expect(upload.expiresInSeconds).toBe(120);

    const download = await createPresignedPdfDownloadUrl({
      fileKey: key,
      downloadName: 'Intelligence Officer Set 01',
      expiresInSeconds: 240,
      config: TEST_R2_CONFIG
    });
    expect(download.downloadUrl).toContain('.r2.cloudflarestorage.com');
    expect(download.downloadUrl).not.toContain('.r2.dev');
    expect(download.downloadUrl).toContain('X-Amz-Expires=240');
    expect(download.expiresInSeconds).toBe(240);
  });
});

describe('v3.0 Quiz Grading, Validation & Bilingual CSV Import', () => {
  const sampleQuestions: QuizQuestionRow[] = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      quiz_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      subject: 'General Knowledge',
      exam_tag: 'PPSC',
      difficulty: 'medium',
      language: 'bilingual',
      text_en: 'Capital of Pakistan?',
      text_ur: 'پاکستان کا دارالحکومت کون سا ہے؟',
      options: [
        { key: 'A', textEn: 'Lahore', textUr: 'لاہور' },
        { key: 'B', textEn: 'Islamabad', textUr: 'اسلام آباد' },
        { key: 'C', textEn: 'Karachi', textUr: 'کراچی' }
      ],
      correct_option: 'B',
      explanation: 'Islamabad became capital in the 1960s.',
      sort_order: 1,
      created_at: '2026-11-12T00:00:00Z',
      updated_at: '2026-11-12T00:00:00Z'
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      quiz_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      subject: 'General Knowledge',
      exam_tag: 'PPSC',
      difficulty: 'easy',
      language: 'en',
      text_en: 'Currency of Japan?',
      text_ur: null,
      options: [
        { key: 'A', textEn: 'Yen' },
        { key: 'B', textEn: 'Won' },
        { key: 'C', textEn: 'Baht' }
      ],
      correct_option: 'A',
      explanation: 'Japanese Yen (JPY).',
      sort_order: 2,
      created_at: '2026-11-12T00:00:01Z',
      updated_at: '2026-11-12T00:00:01Z'
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      quiz_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      subject: 'General Knowledge',
      exam_tag: 'PPSC',
      difficulty: 'hard',
      language: 'en',
      text_en: 'Longest river in Pakistan?',
      text_ur: null,
      options: [
        { key: 'A', textEn: 'Indus' },
        { key: 'B', textEn: 'Chenab' }
      ],
      correct_option: 'A',
      explanation: 'Indus River.',
      sort_order: 3,
      created_at: '2026-11-12T00:00:02Z',
      updated_at: '2026-11-12T00:00:02Z'
    }
  ];

  it('strips answer keys & explanations before delivering quiz questions to client', () => {
    const delivered = stripQuestionSecrets(sampleQuestions);
    expect(delivered).toHaveLength(3);
    expect(delivered[0].textUr).toContain('پاکستان');
    expect((delivered[0] as unknown as Record<string, unknown>).correct_option).toBeUndefined();
    expect((delivered[0] as unknown as Record<string, unknown>).explanation).toBeUndefined();
  });

  it('grades mock exams with negative marking (-0.25), ignores penalty on unanswered items, and clamps strict timers', () => {
    const result = gradeQuizAttempt({
      quiz: {
        type: 'mock',
        time_limit_seconds: 5400,
        negative_marking: true,
        negative_marking_value: 0.25,
        pass_percentage: 40
      },
      questions: sampleQuestions,
      submittedAnswers: [
        { questionId: sampleQuestions[0].id, selectedOption: 'b' }, // correct (+1)
        { questionId: sampleQuestions[1].id, selectedOption: 'B' }, // wrong (-0.25)
        { questionId: sampleQuestions[2].id, selectedOption: null } // unanswered (0)
      ],
      timeTakenSeconds: 5600,
      autoSubmitted: false
    });

    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.unansweredCount).toBe(1);
    expect(result.score).toBe(0.75);
    expect(result.maxScore).toBe(3);
    expect(result.percentage).toBe(25);
    expect(result.passed).toBe(false);
    expect(result.timeTakenSeconds).toBe(5400);
    expect(result.autoSubmitted).toBe(true);

    const practiceCheck = checkSingleQuestionAnswer({
      question: sampleQuestions[0],
      selectedOption: 'b'
    });
    expect(practiceCheck.isCorrect).toBe(true);
    expect(practiceCheck.correctOption).toBe('B');
  });

  it('validates mock quiz timer requirement, watermark confirmation, and strict schema fields', () => {
    const badMock = CreateQuizSchema.safeParse({
      slug: 'ppsc-mock-1',
      title: 'PPSC Full Mock Paper',
      type: 'mock',
      subject: 'General Knowledge',
      examTag: 'PPSC',
      timeLimitSeconds: null
    });
    expect(badMock.success).toBe(false);

    const unwatermarkedPdf = CreatePdfResourceSchema.safeParse({
      slug: 'set-01-ppsc',
      title: 'Set 01 Booklet',
      subject: 'General Knowledge',
      examTag: 'PPSC',
      fileKey: 'pdfs/2026/11/11111111-1111-4111-8111-111111111111-set.pdf',
      fileSize: 1024,
      watermarkConfirmed: false
    });
    expect(unwatermarkedPdf.success).toBe(false);
  });

  it('parses bilingual CSV question banks and rejects invalid rows with line context', () => {
    const csv = [
      'text_en,text_ur,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject,exam_tag',
      '"First Governor General of Pakistan?","پاکستان کے پہلے گورنر جنرل؟","Quaid-e-Azam","Liaquat Ali Khan","Ayub Khan","Iskander Mirza",A,"Appointed in 1947",easy,Pakistan Affairs,PPSC'
    ].join('\n');

    const rows = parseQuizQuestionsCsv({ csv });
    expect(rows).toHaveLength(1);
    expect(rows[0].language).toBe('bilingual');
    expect(rows[0].options).toHaveLength(4);
    expect(rows[0].correctOption).toBe('A');

    expect(() =>
      parseQuizQuestionsCsv({
        csv: 'text_en,option_a,option_b,correct_option\n"Prompt","Yes","No",Z'
      })
    ).toThrow(/CSV row 2 invalid/);
  });

  it('aggregates 30-day visit series, quiz pass rates, most missed questions, and PDF downloads', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    const series = buildThirtyDayVisitSeries(
      ['2026-11-12T01:00:00Z', '2026-11-12T05:00:00Z', '2026-11-10T12:00:00Z'],
      now
    );
    expect(series).toHaveLength(30);
    expect(series[29]).toEqual({ date: '2026-11-12', visits: 2 });
    expect(series[27]).toEqual({ date: '2026-11-10', visits: 1 });
    expect(series[0].visits).toBe(0);

    const quizAgg = aggregateQuizAnalytics({
      quizzes: [
        {
          id: 'q1',
          slug: 'ppsc-gk',
          title: 'PPSC GK',
          type: 'practice',
          subject: 'GK',
          exam_tag: 'PPSC',
          is_published: true
        }
      ],
      attempts: [
        {
          quiz_id: 'q1',
          percentage: 80,
          passed: true,
          answers: [
            { questionId: sampleQuestions[0].id, selectedOption: 'B', correctOption: 'B', isCorrect: true },
            { questionId: sampleQuestions[1].id, selectedOption: 'C', correctOption: 'A', isCorrect: false }
          ]
        },
        {
          quiz_id: 'q1',
          percentage: 20,
          passed: false,
          answers: [
            { questionId: sampleQuestions[1].id, selectedOption: 'B', correctOption: 'A', isCorrect: false }
          ]
        }
      ],
      questions: sampleQuestions
    });
    expect(quizAgg.perQuiz[0].attemptCount).toBe(2);
    expect(quizAgg.perQuiz[0].passRatePercentage).toBe(50);
    expect(quizAgg.mostMissedQuestions[0].questionId).toBe(sampleQuestions[1].id);
    expect(quizAgg.mostMissedQuestions[0].timesMissed).toBe(2);

    const pdfAgg = aggregatePdfAnalytics({
      pdfs: [
        {
          id: 'pdf1',
          slug: 'set-01',
          title: 'Set 01',
          subject: 'GK',
          exam_tag: 'PPSC',
          file_size: 2630400,
          download_count: 15,
          is_published: true
        }
      ],
      logs: [
        { user_id: 'u1', pdf_id: 'pdf1', downloaded_at: '2026-11-12T08:00:00Z' },
        { user_id: 'u1', pdf_id: 'pdf1', downloaded_at: '2026-11-12T09:00:00Z' }
      ],
      profiles: [{ id: 'u1', email: 'student@example.com', display_name: 'Student One' }]
    });
    expect(pdfAgg.mostDownloadedResources[0].downloadCount).toBe(15);
    expect(pdfAgg.downloadsPerUser[0].totalDownloads).toBe(2);
  });
});

