import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getContentRepository } from '@/lib/data';
import { generateGeographyQuizSet } from '@/lib/quiz/engine';

const CountriesQuizQuerySchema = z.object({
  continentId: z.string().trim().min(1).optional(),
  regionId: z.string().trim().min(1).optional(),
  letter: z
    .string()
    .trim()
    .regex(/^(all|[a-zA-Z])$/, 'Expected a single letter A-Z or "all"')
    .optional(),
  search: z.string().trim().max(120).optional(),
  seed: z.string().trim().max(120).optional()
});

function nonEmptyParam(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key);
  if (value === null || value.trim() === '') return undefined;
  return value;
}

/**
 * GET /api/countries/quiz
 * Builds the complete geography selection quiz for the requested scope (All, A-Z, continent, region, search)
 * with one verified question per eligible matching country and no artificial 20-question cap.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = CountriesQuizQuerySchema.safeParse({
    continentId: nonEmptyParam(request, 'continentId'),
    regionId: nonEmptyParam(request, 'regionId'),
    letter: nonEmptyParam(request, 'letter'),
    search: nonEmptyParam(request, 'search'),
    seed: nonEmptyParam(request, 'seed')
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters for /api/countries/quiz',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const repo = getContentRepository();
  const [matchingCountries, allPublishedCountries, reference] = await Promise.all([
    repo.getCountries({
      continentId: parsed.data.continentId,
      regionId: parsed.data.regionId,
      letter: parsed.data.letter,
      search: parsed.data.search,
      onlyVerified: true,
      includeDrafts: false
    }),
    repo.getCountries({ includeDrafts: false }),
    repo.getGeographyReference()
  ]);

  const questions = generateGeographyQuizSet({
    countries: matchingCountries,
    allCountries: allPublishedCountries,
    onePerCountry: true,
    seed: parsed.data.seed ?? 'api-countries-quiz-v1',
    maps: {
      currenciesById: new Map(reference.currencies.map((c) => [c.id, c])),
      languagesById: new Map(reference.languages.map((l) => [l.id, l]))
    }
  });

  return NextResponse.json(
    {
      totalMatchingCountries: matchingCountries.length,
      totalQuestions: questions.length,
      questions
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
      }
    }
  );
}

