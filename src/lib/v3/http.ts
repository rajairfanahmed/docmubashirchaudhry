import { NextRequest, NextResponse } from 'next/server';
import type { ZodError, ZodType } from 'zod';
import { ApiError } from '@/lib/auth/guards';
import { BackendConfigError } from '@/lib/env';

export function apiErrorResponse(options: {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: options.code,
        message: options.message,
        ...(options.details !== undefined ? { details: options.details } : {})
      }
    },
    {
      status: options.status,
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}

export function validationErrorResponse(zodError: ZodError): NextResponse {
  return apiErrorResponse({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Invalid request payload or query parameters.',
    details: zodError.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  });
}

export function handleRouteError(error: unknown, contextLabel: string): NextResponse {
  if (error instanceof ApiError) {
    return apiErrorResponse({
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details
    });
  }

  if (error instanceof BackendConfigError) {
    return apiErrorResponse({
      status: 503,
      code: error.code,
      message: error.message
    });
  }

  const pgCode = (error as { code?: string })?.code;
  if (pgCode === '23505') {
    return apiErrorResponse({
      status: 409,
      code: 'CONFLICT',
      message: 'A record with this unique identifier or slug already exists.'
    });
  }
  if (pgCode === '23503') {
    return apiErrorResponse({
      status: 400,
      code: 'INVALID_REFERENCE',
      message: 'Referenced record does not exist.'
    });
  }
  if (pgCode === '42P01' || pgCode === 'PGRST205') {
    console.error(`[v3-api] ${contextLabel}: Database table not initialized (${pgCode})`);
    return apiErrorResponse({
      status: 503,
      code: 'SERVICE_INITIALIZING',
      message: 'The examination system is currently updating its database records. Your session is preserved; please retry in a moment.'
    });
  }

  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Internal error';
  console.error(`[v3-api] ${contextLabel}:`, errorMessage);

  return apiErrorResponse({
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'We could not complete your request at this moment. Please retry shortly or contact faculty@docmubashirchaudhry.com if this persists.'
  });
}

export async function parseJsonWithSchema<T>(
  request: NextRequest,
  schema: ZodType<T>,
  maxBytes = 256 * 1024
): Promise<{ data: T } | { response: NextResponse }> {
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const bytes = Number(contentLengthHeader);
    if (Number.isFinite(bytes) && bytes > maxBytes) {
      return {
        response: apiErrorResponse({
          status: 413,
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request body exceeds limit of ${maxBytes} bytes.`
        })
      };
    }
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return {
      response: apiErrorResponse({
        status: 400,
        code: 'INVALID_BODY',
        message: 'Could not read request body.'
      })
    };
  }

  if (Buffer.byteLength(rawText, 'utf8') > maxBytes) {
    return {
      response: apiErrorResponse({
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: `Request body exceeds limit of ${maxBytes} bytes.`
      })
    };
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(rawText);
  } catch {
    return {
      response: apiErrorResponse({
        status: 400,
        code: 'INVALID_JSON',
        message: 'Request body must be valid JSON.'
      })
    };
  }

  const parsed = schema.safeParse(rawJson);
  if (!parsed.success) {
    return { response: validationErrorResponse(parsed.error) };
  }

  return { data: parsed.data };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

