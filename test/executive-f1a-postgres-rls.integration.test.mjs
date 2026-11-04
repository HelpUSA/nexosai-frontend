import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { encode } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import {
  authorizeExecutiveAccess,
  withExecutiveTenantContext,
} from '../src/lib/executive/executive-gate.mjs';
import {
  createCapturedWorkItem,
  transitionWorkItem,
} from '../src/lib/executive/priority-engine.mjs';
import { ingestExecutiveSignal } from '../src/lib/executive/connectors-readonly.mjs';
import { runScheduledBriefingJob } from '../src/lib/executive/cadence-scheduler.mjs';

// Guard: Refuse to run on any non-disposable database.
const url = process.env.DATABASE_URL || '';
const parsed = (() => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
})();
if (
  !parsed ||
  !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
  parsed.pathname !== '/nexosai_g3c_test' ||
  process.env.G3C_EPHEMERAL_POSTGRES !== 'YES'
) {
  throw new Error(
    'Refusing non-ephemeral database: require localhost/nexosai_g3c_test and G3C_EPHEMERAL_POSTGRES=YES'
  );
}

const EXEC_TABLES = [
  'exec_portfolio_items',
  'exec_signals',
  'exec_work_items',
  'exec_work_item_events',
  'exec_briefing_runs',
  'exec_decision_requests',
  'exec_integration_cursors',
  'exec_outbox_events',
];

test('F1A PostgreSQL FORCE RLS, Composite FKs, Pooled GUC Isolation, Rollback & HTTP E2E', async () => {
  const db = new PrismaClient();
  const suffix = randomUUID().replaceAll('-', '').slice(0, 10);

  const orgA = await db.organization.create({
    data: {
      name: `Exec Tenant A ${suffix}`,
      slug: `exec-a-${suffix}`,
      features: { executiveProactiveGm: true },
    },
  });
  const orgB = await db.organization.create({
    data: {
      name: `Exec Tenant B ${suffix}`,
      slug: `exec-b-${suffix}`,
      features: { executiveProactiveGm: true },
    },
  });
  const orgDisabled = await db.organization.create({
    data: {
      name: `Exec Disabled ${suffix}`,
      slug: `exec-off-${suffix}`,
      features: { executiveProactiveGm: false },
    },
  });

  const userA = await db.user.create({
    data: { email: `exec-owner-a-${suffix}@example.invalid`, role: 'OWNER' },
  });
  const userB = await db.user.create({
    data: { email: `exec-owner-b-${suffix}@example.invalid`, role: 'OWNER' },
  });

  await db.organizationMembership.create({
    data: {
      userId: userA.id,
      organizationId: orgA.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });
  await db.organizationMembership.create({
    data: {
      userId: userB.id,
      organizationId: orgB.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });
  await db.organizationMembership.create({
    data: {
      userId: userA.id,
      organizationId: orgDisabled.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  try {
    // 1. Verify pg_class has relrowsecurity=true AND relforcerowsecurity=true on all 8 exec_* tables
    const rlsRows = await db.$queryRawUnsafe(`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname IN (${EXEC_TABLES.map((t) => `'${t}'`).join(', ')})
      ORDER BY relname ASC
    `);
    assert.equal(rlsRows.length, 8, 'All 8 exec_* tables must exist in pg_class');
    for (const row of rlsRows) {
      assert.equal(
        row.relrowsecurity,
        true,
        `ENABLE ROW LEVEL SECURITY must be true on ${row.relname}`
      );
      assert.equal(
        row.relforcerowsecurity,
        true,
        `FORCE ROW LEVEL SECURITY must be true on ${row.relname}`
      );
    }

    // 2. Verify authorizeExecutiveAccess against real PostgreSQL
    const envEnabled = { NEXOSAI_EXECUTIVE_ENABLED: 'true' };
    const envDisabled = { NEXOSAI_EXECUTIVE_ENABLED: 'false' };

    assert.equal(
      (
        await authorizeExecutiveAccess({
          email: userA.email,
          organizationId: orgA.id,
          db,
          env: envDisabled,
        })
      ).code,
      'EXECUTIVE_MODULE_DISABLED'
    );
    assert.equal(
      (
        await authorizeExecutiveAccess({
          email: userA.email,
          organizationId: orgDisabled.id,
          db,
          env: envEnabled,
        })
      ).code,
      'EXECUTIVE_ORG_FEATURE_DISABLED'
    );
    assert.equal(
      (
        await authorizeExecutiveAccess({
          email: userA.email,
          organizationId: orgB.id,
          db,
          env: envEnabled,
        })
      ).code,
      'ORG_MEMBERSHIP_REQUIRED'
    );
    assert.equal(
      (
        await authorizeExecutiveAccess({
          email: userA.email,
          organizationId: orgA.id,
          db,
          env: envEnabled,
        })
      ).code,
      'AUTHORIZED'
    );

    // 3. Seed Org A and Org B inside their respective RLS tenant contexts
    const seedA = await withExecutiveTenantContext(db, orgA.id, async (tx) => {
      const portfolioA = await tx.portfolioItem.create({
        data: {
          organizationId: orgA.id,
          slug: 'nexosai',
          name: 'NexosAI App A',
          type: 'APPLICATION',
          lifecycle: 'STAGING',
          priorityWeight: 90,
          staleAfterDays: 5,
          lastActivityAt: new Date('2026-10-20T12:00:00Z'),
        },
      });
      const capturedA = await createCapturedWorkItem(tx, {
        organizationId: orgA.id,
        userId: userA.id,
        portfolioItemId: portfolioA.id,
        title: 'Validar gate F1A no tenant A',
        category: 'DEVELOPMENT',
        status: 'TODAY',
        dueAt: new Date('2026-11-05T12:00:00Z'),
      });
      const signalA = await ingestExecutiveSignal(tx, {
        organizationId: orgA.id,
        portfolioItemId: portfolioA.id,
        sourceType: 'GITHUB',
        externalId: 'HelpUSA/nexosai-frontend#32',
        severity: 'CRITICAL',
        title: 'PR #32 Executive Co-Design',
        summary: 'Conteudo externo <script>bad()</script>',
      });
      return { portfolioA, workItemA: capturedA.workItem, signalA: signalA.signal };
    });

    const seedB = await withExecutiveTenantContext(db, orgB.id, async (tx) => {
      const portfolioB = await tx.portfolioItem.create({
        data: {
          organizationId: orgB.id,
          slug: 'helpus-fit',
          name: 'HelpUS Fit App B',
          type: 'APPLICATION',
          lifecycle: 'PRODUCTION',
          priorityWeight: 75,
        },
      });
      const capturedB = await createCapturedWorkItem(tx, {
        organizationId: orgB.id,
        userId: userB.id,
        portfolioItemId: portfolioB.id,
        title: 'Segredo exclusivo do Tenant B',
        category: 'SALES_REVENUE',
        status: 'TODAY',
      });
      return { portfolioB, workItemB: capturedB.workItem };
    });

    // 4. Verify RLS blocks unscoped SELECT when app.current_organization_id is missing/empty
    const rowsWithoutGuc = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE nexosai_rls_tenant_enforced');
      await tx.$executeRawUnsafe("SELECT set_config('app.current_organization_id', '', true)");
      return tx.workItem.findMany();
    });
    assert.equal(
      rowsWithoutGuc.length,
      0,
      'Without app.current_organization_id GUC, PostgreSQL RLS must return 0 rows'
    );

    // 5. Verify RLS blocks INSERT when app.current_organization_id is missing
    await assert.rejects(
      async () => {
        await db.$transaction(async (tx) => {
          await tx.$executeRawUnsafe('SET LOCAL ROLE nexosai_rls_tenant_enforced');
          await tx.$executeRawUnsafe("SELECT set_config('app.current_organization_id', '', true)");
          await tx.workItem.create({
            data: {
              organizationId: orgA.id,
              title: 'Must fail RLS without GUC',
            },
          });
        });
      },
      /row-level security policy/i,
      'INSERT without tenant GUC must be rejected by PostgreSQL RLS policy'
    );

    // 6. Verify FORCE ROW LEVEL SECURITY also binds the table owner when owner is NOSUPERUSER NOBYPASSRLS
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexosai_rls_table_owner_test') THEN
            CREATE ROLE nexosai_rls_table_owner_test NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
          END IF;
        END $$;
      `);
      await tx.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO nexosai_rls_table_owner_test');
      await tx.$executeRawUnsafe(
        'GRANT ALL ON TABLE "exec_work_items" TO nexosai_rls_table_owner_test'
      );
      await tx.$executeRawUnsafe(
        'ALTER TABLE "exec_work_items" OWNER TO nexosai_rls_table_owner_test'
      );
      await tx.$executeRawUnsafe('SET LOCAL ROLE nexosai_rls_table_owner_test');
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.current_organization_id', '${orgA.id}', true)`
      );
      const visibleToOwner = await tx.$queryRawUnsafe(
        'SELECT id, "organizationId" FROM "exec_work_items"'
      );
      assert.equal(
        visibleToOwner.length,
        1,
        'FORCE ROW LEVEL SECURITY must restrict even the table owner to current tenant only'
      );
      assert.equal(visibleToOwner[0].organizationId, orgA.id);
      await tx.$executeRawUnsafe('RESET ROLE');
      await tx.$executeRawUnsafe('ALTER TABLE "exec_work_items" OWNER TO CURRENT_USER');
    });

    // 7. Verify Cross-Tenant Isolation: unscoped findMany() inside Org A never sees Org B
    await withExecutiveTenantContext(db, orgA.id, async (tx) => {
      const allVisibleWorkItems = await tx.workItem.findMany();
      assert.equal(allVisibleWorkItems.length, 1);
      assert.equal(allVisibleWorkItems[0].id, seedA.workItemA.id);
      assert.equal(allVisibleWorkItems[0].organizationId, orgA.id);

      // Attempting to update Org B's WorkItem from Org A context affects 0 rows
      const updateForeign = await tx.workItem.updateMany({
        where: { id: seedB.workItemB.id },
        data: { title: 'CROSS_TENANT_TAMPER' },
      });
      assert.equal(updateForeign.count, 0, 'RLS must conceal foreign tenant row on UPDATE');

      // Attempting to insert a row for Org B while inside Org A context must fail RLS WITH CHECK
      await assert.rejects(
        async () => {
          await tx.workItem.create({
            data: {
              organizationId: orgB.id,
              title: 'Spoofed foreign tenant insert',
            },
          });
        },
        /row-level security policy/i,
        'RLS WITH CHECK must block inserting a row with mismatched organizationId'
      );
    });

    // 8. Verify Composite Foreign Key blocks linking Org A WorkItem to Org B PortfolioItem
    await assert.rejects(
      async () => {
        await withExecutiveTenantContext(db, orgA.id, async (tx) => {
          await tx.workItem.create({
            data: {
              organizationId: orgA.id,
              portfolioItemId: seedB.portfolioB.id, // Foreign tenant PortfolioItem!
              title: 'Cross-tenant composite FK violation',
            },
          });
        });
      },
      /Foreign key constraint|violates foreign key constraint/i,
      'Composite FK (portfolioItemId, organizationId) must reject cross-tenant parent reference'
    );

    // 9. Verify Connection Pooling Safety (no GUC leakage after transaction completes) & Rollback
    await assert.rejects(async () => {
      await withExecutiveTenantContext(db, orgA.id, async (tx) => {
        await createCapturedWorkItem(tx, {
          organizationId: orgA.id,
          userId: userA.id,
          title: 'WorkItem that will be rolled back',
        });
        throw new Error('SIMULATED_ROLLBACK_ERROR');
      });
    }, /SIMULATED_ROLLBACK_ERROR/);

    const gucAfterTx = await db.$queryRawUnsafe(
      "SELECT current_setting('app.current_organization_id', true) AS guc"
    );
    assert.equal(
      !gucAfterTx[0]?.guc,
      true,
      'SET LOCAL tenant GUC must not leak onto pooled connection after transaction ends'
    );

    await withExecutiveTenantContext(db, orgA.id, async (tx) => {
      const itemsAfterRollback = await tx.workItem.findMany();
      assert.equal(itemsAfterRollback.length, 1, 'Rolled back WorkItem must not persist');

      const transitioned = await transitionWorkItem(tx, {
        organizationId: orgA.id,
        workItemId: seedA.workItemA.id,
        actorUserId: userA.id,
        toStatus: 'IN_PROGRESS',
        rationale: 'Iniciando execucao validada em Postgres efemero',
      });
      assert.equal(transitioned.ok, true);
      assert.equal(transitioned.workItem.status, 'IN_PROGRESS');

      const briefing = await runScheduledBriefingJob(tx, {
        organizationId: orgA.id,
        now: new Date('2026-11-04T11:00:00Z'), // 08:00 America/Fortaleza
        env: envEnabled,
        forceRunForTest: true,
      });
      assert.equal(briefing.ok, true);
      assert.equal(briefing.briefingRun.timezone, 'America/Fortaleza');
      assert.equal(briefing.briefingRun.cadenceType, 'MORNING_BRIEFING');
    });

    // 10. Optional HTTP E2E verification when Next.js build exists (.next/BUILD_ID)
    const { existsSync } = await import('node:fs');
    if (existsSync(new URL('../.next/BUILD_ID', import.meta.url))) {
      const port = 3109;
      const host = `http://127.0.0.1:${port}`;
      const secret =
        process.env.AUTH_SECRET ||
        'synthetic-ci-only-signing-value-not-valid-for-deployment-2026';
      const child = spawn(
        process.execPath,
        ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
        {
          env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: '1',
            AUTH_SECRET: secret,
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'synthetic-oauth-id.apps.invalid',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'synthetic-oauth-client-secret',
            NEXOSAI_BOOTSTRAP_ADMIN_EMAIL:
              process.env.NEXOSAI_BOOTSTRAP_ADMIN_EMAIL || 'bootstrap@example.invalid',
            NEXOSAI_EXECUTIVE_ENABLED: 'true',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );
      try {
        let ready = false;
        for (let i = 0; i < 60; i++) {
          if (child.exitCode !== null) break;
          try {
            const r = await fetch(`${host}/login`, { signal: AbortSignal.timeout(1500) });
            if (r.status < 500) {
              ready = true;
              break;
            }
          } catch {}
          await sleep(300);
        }
        assert.equal(ready, true, 'Next.js server must start for Executive HTTP E2E');

        const tokenA = await encode({
          secret,
          token: { sub: userA.email, email: userA.email },
          maxAge: 3600,
        });
        const cookieA = `next-auth.session-token=${tokenA}`;

        // 10.1: Capture WorkItem via HTTP POST -> 201
        const postWi = await fetch(`${host}/api/orgs/${orgA.id}/executive/work-items`, {
          method: 'POST',
          headers: { cookie: cookieA, 'content-type': 'application/json' },
          body: JSON.stringify({
            portfolioItemId: seedA.portfolioA.id,
            title: 'Acompanhar proposta B2B cliente estratégico',
            category: 'SALES_REVENUE',
            status: 'TODAY',
          }),
        });
        assert.equal(postWi.status, 201);
        const postWiBody = await postWi.json();
        assert.equal(postWiBody.workItem.organizationId, orgA.id);

        // 10.2: Reject PERSONAL_VAULT via HTTP POST -> 403
        const postVault = await fetch(`${host}/api/orgs/${orgA.id}/executive/work-items`, {
          method: 'POST',
          headers: { cookie: cookieA, 'content-type': 'application/json' },
          body: JSON.stringify({
            title: 'Item pessoal proibido na F1A',
            privacyScope: 'PERSONAL_VAULT',
          }),
        });
        assert.equal(postVault.status, 403);

        // 10.3: Reject GMAIL connector via HTTP POST -> 403
        const postGmail = await fetch(`${host}/api/orgs/${orgA.id}/executive/signals/ingest`, {
          method: 'POST',
          headers: { cookie: cookieA, 'content-type': 'application/json' },
          body: JSON.stringify({
            sourceType: 'GMAIL',
            externalId: 'msg-1',
            title: 'Email bloqueado na F1A',
          }),
        });
        assert.equal(postGmail.status, 403);

        // 10.4: Foreign tenant transition attempt concealed -> 404
        const crossTransition = await fetch(
          `${host}/api/orgs/${orgA.id}/executive/work-items/${seedB.workItemB.id}/transition`,
          {
            method: 'POST',
            headers: { cookie: cookieA, 'content-type': 'application/json' },
            body: JSON.stringify({ toStatus: 'DONE' }),
          }
        );
        assert.equal(crossTransition.status, 404);

        // 10.5: Executive Meu Dia page renders 200 for authorized Owner A
        const execPage = await fetch(`${host}/executive?organizationId=${orgA.id}`, {
          headers: { cookie: cookieA },
        });
        assert.equal(execPage.status, 200);
        const execHtml = await execPage.text();
        assert.match(execHtml, /America\/Fortaleza/);
        assert.match(execHtml, /Acompanhar proposta B2B cliente estratégico/);
        assert.match(execHtml, /Validar gate F1A no tenant A/);
        assert.doesNotMatch(execHtml, /Segredo exclusivo do Tenant B/);
      } finally {
        child.kill('SIGTERM');
        await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(2000)]);
        if (child.exitCode === null) child.kill('SIGKILL');
      }
    }
  } finally {
    await db.organization.deleteMany({
      where: { id: { in: [orgA.id, orgB.id, orgDisabled.id] } },
    });
    await db.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });
    await db.$disconnect();
  }
});
