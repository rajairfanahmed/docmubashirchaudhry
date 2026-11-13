import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/env';

export type UserRole = 'admin' | 'user';

/**
 * Resolves the authenticated user's role.
 * Reads publicMetadata.role from sessionClaims (configured via Clerk Dashboard session token template).
 * Falls back to inspecting currentUser and the admin email allow-list to ensure authorized administrators
 * are never locked out while session token template propagation takes effect.
 */
export async function getRole(): Promise<UserRole> {
  try {
    const { sessionClaims, userId } = await auth();
    if (!userId) return 'user';

    // 1. Primary path: Read role from session claims (Clerk session token template)
    const tokenRole = (
      sessionClaims?.publicMetadata as { role?: string } | undefined
    )?.role;
    if (tokenRole === 'admin') return 'admin';

    // 2. Fallback check: inspect currentUser publicMetadata and allow-list
    const user = await currentUser();
    if (!user) return 'user';

    const metaRole = (user.publicMetadata as { role?: string } | undefined)?.role;
    if (metaRole === 'admin') return 'admin';

    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;

    if (primaryEmail && isAdminEmail(primaryEmail)) {
      return 'admin';
    }

    return 'user';
  } catch {
    return 'user';
  }
}

