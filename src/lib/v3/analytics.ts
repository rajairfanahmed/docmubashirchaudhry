import type {
  PdfAccessLogRow,
  PdfResourceRow,
  ProfileRow,
  QuizAttemptAnswerRecord,
  QuizAttemptRow,
  QuizQuestionRow,
  QuizRow
} from '@/lib/supabase/database.types';

export interface DailyVisitPoint {
  date: string;
  visits: number;
}

export function buildThirtyDayVisitSeries(
  visitTimestamps: readonly string[],
  now = new Date()
): DailyVisitPoint[] {
  const counts = new Map<string, number>();
  for (const ts of visitTimestamps) {
    const day = ts.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }

  const series: DailyVisitPoint[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset)
    );
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, visits: counts.get(key) ?? 0 });
  }
  return series;
}

export function aggregateQuizAnalytics(options: {
  quizzes: readonly Pick<
    QuizRow,
    'id' | 'slug' | 'title' | 'type' | 'subject' | 'exam_tag' | 'is_published'
  >[];
  attempts: readonly Pick<
    QuizAttemptRow,
    'quiz_id' | 'percentage' | 'passed' | 'answers'
  >[];
  questions: readonly Pick<
    QuizQuestionRow,
    'id' | 'quiz_id' | 'text_en' | 'text_ur' | 'subject' | 'exam_tag'
  >[];
}): {
  perQuiz: Array<{
    quizId: string;
    slug: string;
    title: string;
    type: string;
    subject: string;
    examTag: string;
    isPublished: boolean;
    attemptCount: number;
    averageScorePercentage: number;
    passRatePercentage: number;
  }>;
  mostMissedQuestions: Array<{
    questionId: string;
    quizId: string | null;
    subject: string | null;
    examTag: string | null;
    textEn: string | null;
    textUr: string | null;
    timesAnswered: number;
    timesMissed: number;
    missRatePercentage: number;
  }>;
} {
  const quizBuckets = new Map<
    string,
    { count: number; percentageSum: number; passCount: number }
  >();
  const questionStats = new Map<string, { answered: number; missed: number }>();

  for (const attempt of options.attempts) {
    const bucket = quizBuckets.get(attempt.quiz_id) ?? {
      count: 0,
      percentageSum: 0,
      passCount: 0
    };
    bucket.count += 1;
    bucket.percentageSum += Number(attempt.percentage ?? 0);
    if (attempt.passed) bucket.passCount += 1;
    quizBuckets.set(attempt.quiz_id, bucket);

    const answers = Array.isArray(attempt.answers)
      ? (attempt.answers as QuizAttemptAnswerRecord[])
      : [];
    for (const entry of answers) {
      if (!entry?.questionId) continue;
      const stat = questionStats.get(entry.questionId) ?? { answered: 0, missed: 0 };
      stat.answered += 1;
      if (!entry.isCorrect) {
        stat.missed += 1;
      }
      questionStats.set(entry.questionId, stat);
    }
  }

  const perQuiz = options.quizzes.map((quiz) => {
    const b = quizBuckets.get(quiz.id);
    const attemptCount = b?.count ?? 0;
    const averageScorePercentage =
      attemptCount > 0
        ? Math.round(((b?.percentageSum ?? 0) / attemptCount) * 100) / 100
        : 0;
    const passRatePercentage =
      attemptCount > 0
        ? Math.round(((b?.passCount ?? 0) / attemptCount) * 10000) / 100
        : 0;

    return {
      quizId: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      type: quiz.type,
      subject: quiz.subject,
      examTag: quiz.exam_tag,
      isPublished: quiz.is_published,
      attemptCount,
      averageScorePercentage,
      passRatePercentage
    };
  });

  const questionMap = new Map(options.questions.map((q) => [q.id, q]));
  const mostMissedQuestions = Array.from(questionStats.entries())
    .filter(([, stat]) => stat.missed > 0)
    .map(([questionId, stat]) => {
      const meta = questionMap.get(questionId);
      const missRatePercentage =
        stat.answered > 0
          ? Math.round((stat.missed / stat.answered) * 10000) / 100
          : 0;
      return {
        questionId,
        quizId: meta?.quiz_id ?? null,
        subject: meta?.subject ?? null,
        examTag: meta?.exam_tag ?? null,
        textEn: meta?.text_en ?? null,
        textUr: meta?.text_ur ?? null,
        timesAnswered: stat.answered,
        timesMissed: stat.missed,
        missRatePercentage
      };
    })
    .sort((a, b) => b.timesMissed - a.timesMissed || b.missRatePercentage - a.missRatePercentage)
    .slice(0, 20);

  return { perQuiz, mostMissedQuestions };
}

export function aggregatePdfAnalytics(options: {
  pdfs: readonly (Pick<
    PdfResourceRow,
    'id' | 'slug' | 'title' | 'subject' | 'exam_tag' | 'download_count' | 'is_published'
  > & { file_bytes?: number; file_size?: number })[];
  logs: readonly Pick<PdfAccessLogRow, 'user_id' | 'pdf_id' | 'downloaded_at'>[];
  profiles: readonly Pick<ProfileRow, 'id' | 'email' | 'display_name'>[];
}): {
  perResource: Array<{
    pdfId: string;
    slug: string;
    title: string;
    subject: string;
    examTag: string;
    fileSize: number;
    isPublished: boolean;
    downloadCount: number;
    loggedDownloads: number;
  }>;
  mostDownloadedResources: Array<{
    pdfId: string;
    title: string;
    subject: string;
    examTag: string;
    downloadCount: number;
  }>;
  downloadsPerUser: Array<{
    userId: string;
    email: string | null;
    displayName: string | null;
    totalDownloads: number;
    lastDownloadedAt: string;
  }>;
} {
  const loggedByPdf = new Map<string, number>();
  const byUser = new Map<string, { count: number; lastAt: string }>();

  for (const log of options.logs) {
    loggedByPdf.set(log.pdf_id, (loggedByPdf.get(log.pdf_id) ?? 0) + 1);
    const existing = byUser.get(log.user_id) ?? { count: 0, lastAt: log.downloaded_at };
    existing.count += 1;
    if (log.downloaded_at > existing.lastAt) {
      existing.lastAt = log.downloaded_at;
    }
    byUser.set(log.user_id, existing);
  }

  const perResource = options.pdfs
    .map((pdf) => ({
      pdfId: pdf.id,
      slug: pdf.slug,
      title: pdf.title,
      subject: pdf.subject,
      examTag: pdf.exam_tag,
      fileSize: pdf.file_bytes ?? pdf.file_size ?? 0,
      isPublished: pdf.is_published,
      downloadCount: pdf.download_count,
      loggedDownloads: loggedByPdf.get(pdf.id) ?? 0
    }))
    .sort((a, b) => b.downloadCount - a.downloadCount);

  const mostDownloadedResources = perResource.slice(0, 10).map((r) => ({
    pdfId: r.pdfId,
    title: r.title,
    subject: r.subject,
    examTag: r.examTag,
    downloadCount: r.downloadCount
  }));

  const profileMap = new Map(options.profiles.map((p) => [p.id, p]));
  const downloadsPerUser = Array.from(byUser.entries())
    .map(([userId, stat]) => {
      const profile = profileMap.get(userId);
      return {
        userId,
        email: profile?.email ?? null,
        displayName: profile?.display_name ?? null,
        totalDownloads: stat.count,
        lastDownloadedAt: stat.lastAt
      };
    })
    .sort((a, b) => b.totalDownloads - a.totalDownloads);

  return {
    perResource,
    mostDownloadedResources,
    downloadsPerUser
  };
}

