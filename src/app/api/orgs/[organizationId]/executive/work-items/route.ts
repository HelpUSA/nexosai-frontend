import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { makeAuthOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import {
  authorizeExecutiveAccess,
  withExecutiveTenantContext,
} from '@/lib/executive/executive-gate.mjs';
import { createCapturedWorkItem } from '@/lib/executive/priority-engine.mjs';

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

    const workItems = await withExecutiveTenantContext(db, organizationId, async (tx) => {
      return tx.workItem.findMany({
        where: {
          organizationId,
          privacyScope: { in: ['ORG_SHARED', 'EXECUTIVE_ONLY'] },
        },
        orderBy: [{ priorityScore: 'desc' }, { updatedAt: 'desc' }],
        take: 50,
      });
    });

    return NextResponse.json(
      { workItems },
      { status: 200, headers: { 'cache-control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'EXECUTIVE_STORAGE_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}

export async function POST(
  request: Request,
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
    const body = await request.json().catch(() => ({}));

    const access = await authorizeExecutiveAccess({
      email: session.user.email,
      organizationId,
      portfolioItemId: body?.portfolioItemId || undefined,
      db,
    });

    if (!access.ok) {
      return NextResponse.json(
        { error: access.code },
        { status: access.status, headers: { 'cache-control': 'no-store' } }
      );
    }

    const created = await withExecutiveTenantContext(db, organizationId, async (tx) => {
      return createCapturedWorkItem(tx, {
        organizationId,
        userId: access.userId,
        portfolioItemId: body?.portfolioItemId || null,
        title: body?.title,
        description: body?.description || null,
        nextAction: body?.nextAction || null,
        category: body?.category || 'DEVELOPMENT',
        privacyScope: body?.privacyScope || 'ORG_SHARED',
        status: body?.status || 'TRIAGE',
        dueAt: body?.dueAt || null,
        staleAfterDays: body?.staleAfterDays || 5,
      });
    });

    if (!created.ok) {
      return NextResponse.json(
        { error: created.code },
        { status: created.status, headers: { 'cache-control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { workItem: created.workItem, priority: created.priority },
      { status: 201, headers: { 'cache-control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'EXECUTIVE_STORAGE_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
