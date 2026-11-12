import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { QuizQuestionRow, QuizRow } from '@/lib/supabase/database.types';
import { isUuid } from './http';

export async function findQuizByIdOrSlug(
  idOrSlug: string,
  options?: { includeUnpublished?: boolean }
): Promise<QuizRow | null> {
  const admin = createSupabaseAdminClient();
  const col = isUuid(idOrSlug) ? 'id' : 'slug';
  let query = admin.from('quizzes').select('*').eq(col, idOrSlug);
  if (!options?.includeUnpublished) {
    query = query.eq('is_published', true);
  }
  const { data, error } = await query.maybeSingle<QuizRow>();
  if (error) throw error;
  return data;
}

export async function loadQuizQuestions(quizId: string): Promise<QuizQuestionRow[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as QuizQuestionRow[];
}

