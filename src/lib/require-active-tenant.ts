import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { makeAuthOptions } from '@/lib/auth-options';

type ValidRole = 'ADMIN' | 'OWNER' | 'OPERATOR' | 'VIEWER';

/**
 * Draft LAB: authorization for rendered server pages, never a substitute for
 * checks in server actions, API routes, and every tenant-scoped database query.
 */
export async function requireActiveTenant(roles: ReadonlyArray<ValidRole> = ['ADMIN','OWNER','OPERATOR','VIEWER']) {
  const session = await getServerSession(makeAuthOptions());
  const normalized = session?.user?.email?.trim().toLowerCase();
  if (!normalized) redirect('/login');
  try {
    const user = await db.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (!user) notFound();
    const membership = await db.organizationMembership.findFirst({
      where: { userId: user.id, status: 'ACTIVE', role: { in: [...roles] } },
      orderBy: { organizationId: 'asc' },
      select: { organizationId: true, role: true, userId: true },
    });
    if (!membership) notFound();
    return { userId: user.id, organizationId: membership.organizationId, role: membership.role };
  } catch (error) {
    // A closed/absent DB must never cause a public fallback to privileged content.
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    throw new Error('N1B_AUTHORIZATION_STORAGE_UNAVAILABLE');
  }
}
