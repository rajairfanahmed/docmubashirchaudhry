import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizQuestionRow } from '@/lib/supabase/database.types';
import { apiErrorResponse, handleRouteError, parseJsonWithSchema } from '@/lib/v3/http';
import { parseQuizQuestionsCsv } from '@/lib/v3/quiz-grading';
import { BulkImportQuestionsSchema } from '@/lib/v3/schemas';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const parsed = await parseJsonWithSchema(request, BulkImportQuestionsSchema, 2 * 1024 * 1024);
    if ('response' in parsed) return parsed.response;

    const rowsToInsert =
      parsed.data.format === 'csv'
        ? parseQuizQuestionsCsv({
            csv: parsed.data.csv!,
            quizId: parsed.data.quizId ?? null,
            defaultSubject: parsed.data.defaultSubject,
            defaultExamTag: parsed.data.defaultExamTag
          })
        : parsed.data.questions!.map((q) => ({
            quizId: q.quizId ?? parsed.data.quizId ?? null,
            subject: q.subject,
            examTag: q.examTag,
            difficulty: q.difficulty,
            language: q.language,
            textEn: q.textEn ?? null,
            textUr: q.textUr ?? null,
            options: q.options.map((o) => ({
              key: o.key.toUpperCase(),
              textEn: o.textEn ?? null,
              ...(o.textUr ? { textUr: o.textUr } : {})
            })),
            correctOption: q.correctOption.toUpperCase(),
            explanation: q.explanation,
            sortOrder: q.sortOrder
          }));

    if (rowsToInsert.length === 0 || rowsToInsert.length > 500) {
      return apiErrorResponse({
        status: 400,
        code: 'INVALID_IMPORT_COUNT',
        message: 'Import batch must contain between 1 and 500 questions.'
      });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('quiz_questions')
      .insert(
        rowsToInsert.map((item) => ({
          quiz_id: item.quizId,
          subject: item.subject,
          exam_tag: item.examTag,
          difficulty: item.difficulty,
          language: item.language,
          text_en: item.textEn,
          text_ur: item.textUr,
          options: item.options,
          correct_option: item.correctOption,
          explanation: item.explanation,
          sort_order: item.sortOrder
        }))
      )
      .select('id');

    if (error) throw error;
    const inserted = (data ?? []) as Array<Pick<QuizQuestionRow, 'id'>>;

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          importedCount: inserted.length,
          questionIds: inserted.map((r) => r.id)
        },
        { status: 201, headers: { 'Cache-Control': 'no-store' } }
      )
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('CSV ')) {
      return apiErrorResponse({
        status: 400,
        code: 'CSV_PARSE_ERROR',
        message: error.message
      });
    }
    return handleRouteError(error, 'POST /api/admin/questions/import');
  }
}

