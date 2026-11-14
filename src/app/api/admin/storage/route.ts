import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/guards';
import { measureR2Storage, R2_FREE_ALLOWANCE_BYTES } from '@/lib/r2/client';
import { getOptionalAdminClient } from '@/lib/supabase/admin';
import { handleRouteError } from '@/lib/v3/http';

export const dynamic = 'force-dynamic';

const SNAPSHOT_CACHE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes cache window (FEAT-14 / API-21)

/**
 * GET /api/admin/storage (API-21)
 * Returns Cloudflare R2 bucket storage usage, allowance, object counts, and largest files.
 * Re-measures if last snapshot is older than 10 minutes.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    const admin = getOptionalAdminClient();
    const now = Date.now();

    // Check if we have a recent snapshot (< 10 mins old)
    if (admin) {
      const { data: latestSnapshot } = await admin
        .from('storage_snapshots')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSnapshot) {
        const snapshotAge = now - new Date(latestSnapshot.checked_at).getTime();
        if (snapshotAge < SNAPSHOT_CACHE_WINDOW_MS) {
          return auth.applyAuthCookies(
            NextResponse.json(
              {
                data: {
                  usedBytes: Number(latestSnapshot.used_bytes),
                  allowanceBytes: R2_FREE_ALLOWANCE_BYTES,
                  objectCount: Number(latestSnapshot.object_count),
                  checkedAt: latestSnapshot.checked_at,
                  cached: true
                }
              },
              {
                status: 200,
                headers: { 'Cache-Control': 'private, no-store' }
              }
            )
          );
        }
      }
    }

    // Measure live bucket via S3 client
    let storageData = {
      usedBytes: 0,
      allowanceBytes: R2_FREE_ALLOWANCE_BYTES,
      objectCount: 0,
      checkedAt: new Date().toISOString(),
      largest: [] as Array<{ key: string; sizeBytes: number; lastModified?: string }>
    };

    try {
      storageData = await measureR2Storage();
      // Record snapshot in database
      if (admin) {
        await admin.from('storage_snapshots').insert({
          used_bytes: storageData.usedBytes,
          object_count: storageData.objectCount,
          checked_at: storageData.checkedAt
        });
      }
    } catch (r2Error) {
      console.warn('Live R2 storage measurement warning:', r2Error);
    }

    return auth.applyAuthCookies(
      NextResponse.json(
        {
          data: {
            ...storageData,
            cached: false
          }
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    );
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/storage');
  }
}
