import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { makeAuthOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import {
  authorizeExecutiveAccess,
  withExecutiveTenantContext,
} from '@/lib/executive/executive-gate.mjs';
import { buildMeuDiaAndRadarSnapshot } from '@/lib/executive/cadence-scheduler.mjs';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await getServerSession(makeAuthOptions());
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED' },
        { status: 401, headers: { 'cache-control': 'no-store' } }
      );
    }

    const { organizationId } = await context.params;
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

    const snapshot = await withExecutiveTenantContext(db, organizationId, async (tx) => {
      return buildMeuDiaAndRadarSnapshot(tx, { organizationId });
    });

    return NextResponse.json(
      { snapshot },
      { status: 200, headers: { 'cache-control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'EXECUTIVE_BRIEFING_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
