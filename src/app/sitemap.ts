import type { MetadataRoute } from 'next';
import { getContentRepository } from '@/lib/data';
import { getServerManifest } from '@/lib/data/server-manifest';
import { parseSecretSupabaseConfig } from '@/lib/env';
import { buildCanonicalUrl } from '@/lib/seo/metadata';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function parseDate(iso?: string | null, fallback = new Date('2026-11-11T00:00:00.000Z')): Date {
  if (!iso) return fallback;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = getContentRepository();
  const manifest = getServerManifest();
  const fallbackDate = parseDate(manifest.generatedAt);

  const [exams, subjects, topics, geoRef, countries, pdfs, allQuestions] = await Promise.all([
    repo.getExams(),
    repo.getSubjects(),
    repo.getTopics(),
    repo.getGeographyReference(),
    repo.getCountries({ includeDrafts: false }),
    repo.getPdfResources({ includeDrafts: false }),
    repo.getQuestions({ includeDrafts: false })
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: buildCanonicalUrl('/'), lastModified: fallbackDate, changeFrequency: 'daily', priority: 1.0 },
    { url: buildCanonicalUrl('/geography'), lastModified: fallbackDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: buildCanonicalUrl('/exams'), lastModified: fallbackDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: buildCanonicalUrl('/ppsc'), lastModified: fallbackDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: buildCanonicalUrl('/quizzes'), lastModified: fallbackDate, changeFrequency: 'daily', priority: 0.9 },
    { url: buildCanonicalUrl('/mcq'), lastModified: fallbackDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: buildCanonicalUrl('/library'), lastModified: fallbackDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: buildCanonicalUrl('/about'), lastModified: fallbackDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: buildCanonicalUrl('/methodology'), lastModified: fallbackDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: buildCanonicalUrl('/corrections'), lastModified: fallbackDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: buildCanonicalUrl('/copyright'), lastModified: fallbackDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: buildCanonicalUrl('/privacy'), lastModified: fallbackDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: buildCanonicalUrl('/accessibility'), lastModified: fallbackDate, changeFrequency: 'monthly', priority: 0.4 },
    { url: buildCanonicalUrl('/status'), lastModified: fallbackDate, changeFrequency: 'daily', priority: 0.4 }
  ];

  // Published Exam Hubs & Scoped Libraries
  for (const exam of exams) {
    if (exam.status !== 'published') continue;
    const examMod = parseDate(exam.verification.lastCheckedAt, fallbackDate);

    entries.push({
      url: buildCanonicalUrl(`/exams/${exam.slug}`),
      lastModified: examMod,
      changeFrequency: 'weekly',
      priority: 0.8
    });

    entries.push({
      url: buildCanonicalUrl(`/library/${exam.slug}`),
      lastModified: examMod,
      changeFrequency: 'weekly',
      priority: 0.8
    });

    const posts = await repo.getRecruitmentPosts(exam.slug);
    for (const post of posts) {
      const postMod = parseDate(post.verification.lastCheckedAt, fallbackDate);
      entries.push({
        url: buildCanonicalUrl(`/${exam.slug}/${post.slug}`),
        lastModified: postMod,
        changeFrequency: 'weekly',
        priority: 0.85
      });
    }
  }

  // Populated Topic Pages
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  for (const topic of topics) {
    const subject = subjectById.get(topic.subjectId);
    if (!subject) continue;
    const hasQuestions = allQuestions.some((q) => q.topicIds.includes(topic.id));
    const hasPdfs = pdfs.some((pdf) => pdf.topicIds.includes(topic.id));
    if (!hasQuestions && !hasPdfs) continue;

    entries.push({
      url: buildCanonicalUrl(`/topics/${subject.slug}/${topic.slug}`),
      lastModified: fallbackDate,
      changeFrequency: 'weekly',
      priority: 0.75
    });
  }

  // Continent Hubs & Published Sovereign Countries
  for (const continent of geoRef.continents) {
    entries.push({
      url: buildCanonicalUrl(`/geography/continent/${continent.slug}`),
      lastModified: fallbackDate,
      changeFrequency: 'weekly',
      priority: 0.8
    });
  }

  for (const country of countries) {
    entries.push({
      url: buildCanonicalUrl(`/geography/${country.slug}`),
      lastModified: parseDate(country.verification.lastCheckedAt, fallbackDate),
      changeFrequency: 'monthly',
      priority: 0.75
    });
  }

  // Published PDF Detail Pages
  for (const pdf of pdfs) {
    entries.push({
      url: buildCanonicalUrl(`/library/resource/${pdf.slug}`),
      lastModified: parseDate(pdf.verification.lastCheckedAt, fallbackDate),
      changeFrequency: 'monthly',
      priority: 0.8
    });
  }

  // Published V3 Quizzes from Supabase (when configured)
  if (parseSecretSupabaseConfig()) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: quizRows } = await admin
        .from('quizzes')
        .select('slug, updated_at, created_at')
        .eq('is_published', true)
        .limit(500);

      for (const quiz of quizRows ?? []) {
        entries.push({
          url: buildCanonicalUrl(`/quizzes/${quiz.slug}`),
          lastModified: parseDate(quiz.updated_at ?? quiz.created_at, fallbackDate),
          changeFrequency: 'weekly',
          priority: 0.8
        });
      }
    } catch {
      // Static dataset entries remain complete even when Supabase is unreachable
    }
  }

  return entries;
}
