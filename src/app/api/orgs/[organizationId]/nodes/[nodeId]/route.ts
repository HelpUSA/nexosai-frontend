import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { makeAuthOptions } from '@/lib/auth-options';
import { authorizeNodeRead } from '@/lib/tenant-access.mjs';
import { db } from '@/lib/db';

// Draft N1-B: read-only scoped example, not a production release authorization.
export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string; nodeId: string }> }
) {
  try {
    const session = await getServerSession(makeAuthOptions());
    if (!session?.user?.email)
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401, headers: { 'cache-control': 'no-store' } });

    const { organizationId, nodeId } = await context.params;
    const result = await authorizeNodeRead({
      email: session.user.email,
      organizationId,
      nodeId,
      db,
    });
    if (!result.ok)
      return NextResponse.json({ error: result.code }, { status: result.status, headers: { 'cache-control': 'no-store' } });

    return NextResponse.json({ node: result.node }, { status: 200, headers: { 'cache-control': 'private, no-store' } });
  } catch {
    // Server configuration failure is not authorization success.
    return NextResponse.json({ error: 'AUTHENTICATION_UNAVAILABLE' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
