import type {
  ContentLanguage,
  QuestionDifficulty,
  QuizAttemptAnswerRecord,
  QuizQuestionOptionRow,
  QuizQuestionRow,
  QuizRow
} from '@/lib/supabase/database.types';
import { CreateQuestionSchema } from './schemas';

export interface SanitizedQuizQuestion {
  id: string;
  quizId: string | null;
  subject: string;
  examTag: string;
  difficulty: QuestionDifficulty;
  language: ContentLanguage;
  textEn: string | null;
  textUr: string | null;
  options: QuizQuestionOptionRow[];
  sortOrder: number;
}

export interface GradedQuizReviewItem {
  questionId: string;
  textEn: string | null;
  textUr: string | null;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  unanswered: boolean;
  explanation: string;
}

export interface GradedQuizResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  autoSubmitted: boolean;
  answerRecords: QuizAttemptAnswerRecord[];
  review: GradedQuizReviewItem[];
}

export function normalizeOptionKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim().toUpperCase();
  return trimmed || null;
}

export function stripQuestionSecrets(
  questions: readonly QuizQuestionRow[]
): SanitizedQuizQuestion[] {
  return [...questions]
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
    .map((q) => ({
      id: q.id,
      quizId: q.quiz_id,
      subject: q.subject,
      examTag: q.exam_tag,
      difficulty: q.difficulty,
      language: q.language,
      textEn: q.text_en,
      textUr: q.text_ur,
      options: q.options,
      sortOrder: q.sort_order
    }));
}

export function checkSingleQuestionAnswer(options: {
  question: QuizQuestionRow;
  selectedOption: string;
}): {
  questionId: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  explanation: string;
} {
  const normalizedSelected = normalizeOptionKey(options.selectedOption) ?? '';
  const normalizedCorrect = normalizeOptionKey(options.question.correct_option) ?? '';
  const isCorrect =
    normalizedSelected.length > 0 && normalizedSelected === normalizedCorrect;

  return {
    questionId: options.question.id,
    selectedOption: normalizedSelected,
    correctOption: normalizedCorrect,
    isCorrect,
    explanation: options.question.explanation
  };
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function gradeQuizAttempt(options: {
  quiz: Pick<
    QuizRow,
    | 'type'
    | 'time_limit_seconds'
    | 'negative_marking'
    | 'negative_marking_value'
    | 'pass_percentage'
  >;
  questions: readonly QuizQuestionRow[];
  submittedAnswers: ReadonlyArray<{ questionId: string; selectedOption: string | null }>;
  timeTakenSeconds: number;
  autoSubmitted: boolean;
  startedAtIso?: string;
  nowMs?: number;
}): GradedQuizResult {
  const orderedQuestions = [...options.questions].sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
  );

  // Deduplicate user submissions cleanly, last answer wins
  const submissionMap = new Map<string, string | null>();
  for (const item of options.submittedAnswers) {
    submissionMap.set(item.questionId, normalizeOptionKey(item.selectedOption));
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const answerRecords: QuizAttemptAnswerRecord[] = [];
  const review: GradedQuizReviewItem[] = [];

  for (const question of orderedQuestions) {
    const correctOption = normalizeOptionKey(question.correct_option) ?? '';
    const rawSelected = submissionMap.get(question.id) ?? null;
    const validKeys = new Set(
      question.options.map((o) => normalizeOptionKey(o.key)).filter(Boolean)
    );
    const selectedOption =
      rawSelected && validKeys.has(rawSelected) ? rawSelected : null;

    if (!selectedOption) {
      unansweredCount += 1;
      answerRecords.push({
        questionId: question.id,
        selectedOption: null,
        correctOption,
        isCorrect: false
      });
      review.push({
        questionId: question.id,
        textEn: question.text_en,
        textUr: question.text_ur,
        selectedOption: null,
        correctOption,
        isCorrect: false,
        unanswered: true,
        explanation: question.explanation
      });
      continue;
    }

    const isCorrect = selectedOption === correctOption;
    if (isCorrect) {
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }

    answerRecords.push({
      questionId: question.id,
      selectedOption,
      correctOption,
      isCorrect
    });
    review.push({
      questionId: question.id,
      textEn: question.text_en,
      textUr: question.text_ur,
      selectedOption,
      correctOption,
      isCorrect,
      unanswered: false,
      explanation: question.explanation
    });
  }

  const maxScore = orderedQuestions.length;
  const deduction = options.quiz.negative_marking
    ? Number(options.quiz.negative_marking_value || 0)
    : 0;
  const rawScore = correctCount - incorrectCount * deduction;
  const score = roundToTwo(rawScore);
  const percentage =
    maxScore > 0 ? Math.max(0, roundToTwo((score / maxScore) * 100)) : 0;
  const passed = percentage >= Number(options.quiz.pass_percentage ?? 40);

  // Authoritative elapsed time check when startedAt is supplied & timer applies
  let elapsed = Math.max(0, Math.floor(options.timeTakenSeconds));
  let autoSubmitted = options.autoSubmitted;
  if (options.startedAtIso) {
    const startMs = Date.parse(options.startedAtIso);
    const nowMs = options.nowMs ?? Date.now();
    if (Number.isFinite(startMs) && nowMs >= startMs) {
      const serverElapsed = Math.floor((nowMs - startMs) / 1000);
      elapsed = Math.max(elapsed, serverElapsed);
    }
  }

  if (
    options.quiz.type === 'mock' &&
    typeof options.quiz.time_limit_seconds === 'number' &&
    options.quiz.time_limit_seconds > 0 &&
    elapsed > options.quiz.time_limit_seconds
  ) {
    elapsed = options.quiz.time_limit_seconds;
    autoSubmitted = true;
  }

  return {
    score,
    maxScore,
    percentage,
    passed,
    correctCount,
    incorrectCount,
    unansweredCount,
    timeTakenSeconds: elapsed,
    autoSubmitted,
    answerRecords,
    review
  };
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"' && csvText[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && csvText[i + 1] === '\n') i += 1;
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export interface ParsedQuestionInput {
  quizId: string | null;
  subject: string;
  examTag: string;
  difficulty: QuestionDifficulty;
  language: ContentLanguage;
  textEn: string | null;
  textUr: string | null;
  options: QuizQuestionOptionRow[];
  correctOption: string;
  explanation: string;
  sortOrder: number;
}

export function parseQuizQuestionsCsv(options: {
  csv: string;
  quizId?: string | null;
  defaultSubject?: string;
  defaultExamTag?: string;
}): ParsedQuestionInput[] {
  const rows = parseCsvRows(options.csv);
  if (rows.length < 2) {
    throw new Error('CSV must contain a header row and at least one question row.');
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const indexOf = (name: string) => headers.indexOf(name);

  const output: ParsedQuestionInput[] = [];

  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r];
    const cell = (col: string): string => {
      const idx = indexOf(col);
      return idx >= 0 && idx < cells.length ? cells[idx].trim() : '';
    };

    const optionDefs: QuizQuestionOptionRow[] = [];
    for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
      const upper = letter.toUpperCase();
      const textEn = cell(`option_${letter}`) || cell(`option_${letter}_en`) || null;
      const textUr = cell(`option_${letter}_ur`) || null;
      if (textEn || textUr) {
        optionDefs.push({
          key: upper,
          textEn,
          ...(textUr ? { textUr } : {})
        });
      }
    }

    const textEn = cell('text_en') || cell('question_en') || cell('question') || null;
    const textUr = cell('text_ur') || cell('question_ur') || null;
    const inferredLang: ContentLanguage =
      cell('language') === 'ur' || cell('language') === 'bilingual' || cell('language') === 'en'
        ? (cell('language') as ContentLanguage)
        : textEn && textUr
          ? 'bilingual'
          : textUr
            ? 'ur'
            : 'en';

    const candidate = {
      quizId: options.quizId ?? null,
      subject: cell('subject') || options.defaultSubject || 'General Knowledge',
      examTag: cell('exam_tag') || options.defaultExamTag || 'PPSC',
      difficulty: (cell('difficulty') || 'medium') as QuestionDifficulty,
      language: inferredLang,
      textEn,
      textUr,
      options: optionDefs,
      correctOption: (cell('correct_option') || 'A').toUpperCase(),
      explanation: cell('explanation') || '',
      sortOrder: Number.isFinite(Number(cell('sort_order'))) && cell('sort_order') !== ''
        ? Math.max(0, Math.floor(Number(cell('sort_order'))))
        : r - 1
    };

    const validated = CreateQuestionSchema.safeParse(candidate);
    if (!validated.success) {
      const issue = validated.error.issues[0];
      throw new Error(
        `CSV row ${r + 1} invalid (${issue?.path.join('.') || 'row'}): ${issue?.message}`
      );
    }

    output.push({
      quizId: validated.data.quizId ?? null,
      subject: validated.data.subject,
      examTag: validated.data.examTag,
      difficulty: validated.data.difficulty,
      language: validated.data.language,
      textEn: validated.data.textEn ?? null,
      textUr: validated.data.textUr ?? null,
      options: validated.data.options.map((o) => ({
        key: o.key.toUpperCase(),
        textEn: o.textEn ?? null,
        ...(o.textUr ? { textUr: o.textUr } : {})
      })),
      correctOption: validated.data.correctOption.toUpperCase(),
      explanation: validated.data.explanation,
      sortOrder: validated.data.sortOrder
    });
  }

  return output;
}

