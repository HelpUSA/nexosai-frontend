import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { makeAuthOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import {
  authorizeExecutiveAccess,
  withExecutiveTenantContext,
} from '@/lib/executive/executive-gate.mjs';
import { transitionWorkItem } from '@/lib/executive/priority-engine.mjs';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string; workItemId: string }> }
) {
  try {
    const session = await getServerSession(makeAuthOptions());
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED' },
        { status: 401, headers: { 'cache-control': 'no-store' } }
      );
    }

    const { organizationId, workItemId } = await context.params;
    const access = await authorizeExecutiveAccess({
      email: session.user.email,
      organizationId,
      db,
    });

    if (!access.ok) {
      return NextResponse.json(
        { error: access.code },
        { status: access.status, headers: { 'cache-control': 'no-store' } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await withExecutiveTenantContext(db, organizationId, async (tx) => {
      return transitionWorkItem(tx, {
        organizationId,
        workItemId,
        actorUserId: access.userId,
        toStatus: body?.toStatus,
        snoozedUntil: body?.snoozedUntil || null,
        rationale: body?.rationale || null,
      });
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.code },
        { status: result.status, headers: { 'cache-control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { workItem: result.workItem, priority: result.priority },
      { status: 200, headers: { 'cache-control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'EXECUTIVE_STORAGE_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
