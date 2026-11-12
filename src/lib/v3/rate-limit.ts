import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

interface BucketEntry {
  count: number;
  resetAtMs: number;
}

const MAX_BUCKETS = 5000;
const buckets = new Map<string, BucketEntry>();

export function extractClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

export function checkRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
  nowMs?: number;
}): RateLimitDecision {
  const nowMs = options.nowMs ?? Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.resetAtMs <= nowMs) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, entry] of buckets.entries()) {
        if (entry.resetAtMs <= nowMs) buckets.delete(k);
      }
    }
    buckets.set(options.key, {
      count: 1,
      resetAtMs: nowMs + options.windowMs
    });
    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000)
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAtMs - nowMs) / 1000))
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAtMs - nowMs) / 1000))
  };
}

export function rateLimitExceededResponse(decision: RateLimitDecision): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Please retry after ${decision.retryAfterSeconds} seconds.`
      }
    },
    {
      status: 429,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': String(decision.retryAfterSeconds),
        'X-RateLimit-Limit': String(decision.limit),
        'X-RateLimit-Remaining': String(decision.remaining)
      }
    }
  );
}

export function clearRateLimitBuckets(): void {
  buckets.clear();
}

