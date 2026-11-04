import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { makeAuthOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import {
  authorizeExecutiveAccess,
  withExecutiveTenantContext,
} from '@/lib/executive/executive-gate.mjs';
import { ingestExecutiveSignal } from '@/lib/executive/connectors-readonly.mjs';

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

    const signals = await withExecutiveTenantContext(db, organizationId, async (tx) => {
      return tx.signal.findMany({
        where: {
          organizationId,
          privacyScope: { in: ['ORG_SHARED', 'EXECUTIVE_ONLY'] },
        },
        orderBy: [{ occurredAt: 'desc' }],
        take: 30,
      });
    });

    return NextResponse.json(
      { signals },
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

    const ingested = await withExecutiveTenantContext(db, organizationId, async (tx) => {
      return ingestExecutiveSignal(tx, {
        organizationId,
        portfolioItemId: body?.portfolioItemId || null,
        sourceType: body?.sourceType || 'MANUAL',
        externalId: body?.externalId,
        severity: body?.severity || 'INFO',
        privacyScope: body?.privacyScope || 'ORG_SHARED',
        title: body?.title,
        summary: body?.summary || '',
        sourceUrl: body?.sourceUrl || null,
        rawMetadata: body?.rawMetadata || null,
        occurredAt: body?.occurredAt || null,
      });
    });

    if (!ingested.ok) {
      return NextResponse.json(
        { error: ingested.code },
        { status: ingested.status, headers: { 'cache-control': 'no-store' } }
      );
    }

    return NextResponse.json(
      {
        signal: ingested.signal,
        deduplicated: ingested.deduplicated,
      },
      { status: ingested.status, headers: { 'cache-control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'EXECUTIVE_STORAGE_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
