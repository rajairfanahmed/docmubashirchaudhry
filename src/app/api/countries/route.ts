import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getContentRepository } from '@/lib/data';

const OptionalPositiveIntSchema = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return undefined;
  const parsed = Number(val);
  return parsed;
}, z.number().int().min(1).optional());

const PageSizeSchema = z.preprocess((val) => {
  if (val === null || val === undefined || val === '') return undefined;
  const parsed = Number(val);
  return parsed;
}, z.number().int().min(1).max(100).optional());

const CountriesQuerySchema = z.object({
  page: OptionalPositiveIntSchema.default(1),
  pageSize: PageSizeSchema.default(24),
  continentId: z.string().trim().min(1).optional(),
  regionId: z.string().trim().min(1).optional(),
  letter: z
    .string()
    .trim()
    .regex(/^(all|[a-zA-Z])$/, 'Expected a single letter A-Z or "all"')
    .optional(),
  search: z.string().trim().max(120).optional(),
  onlyVerified: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sort: z.enum(['default', 'alphabetical']).optional().default('default')
});

function nonEmptyParam(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key);
  if (value === null || value.trim() === '') return undefined;
  return value;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = CountriesQuerySchema.safeParse({
    page: nonEmptyParam(request, 'page'),
    pageSize: nonEmptyParam(request, 'pageSize'),
    continentId: nonEmptyParam(request, 'continentId'),
    regionId: nonEmptyParam(request, 'regionId'),
    letter: nonEmptyParam(request, 'letter'),
    search: nonEmptyParam(request, 'search'),
    onlyVerified: nonEmptyParam(request, 'onlyVerified'),
    sort: nonEmptyParam(request, 'sort')
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters for /api/countries',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const repo = getContentRepository();
  const result = await repo.getCountriesPaginated({
    ...parsed.data,
    includeDrafts: false
  });

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
    }
  });
}

