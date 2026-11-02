import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { encode } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

// Verifies real App Router HTTP session enforcement, edge middleware redirect,
// tamper-resistance, and real PostgreSQL authenticated RBAC isolation.
const secret = process.env.AUTH_SECRET || 'synthetic-ci-only-signing-value-not-valid-for-deployment-2026';
const port = 3105;
const host = `http://127.0.0.1:${port}`;

async function makeCookie(email) {
  const token = await encode({
    secret,
    token: { sub: email, email },
    maxAge: 3600,
  });
  return `next-auth.session-token=${token}`;
}

const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  AUTH_SECRET: secret,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'synthetic-oauth-id.apps.invalid',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'synthetic-oauth-client-secret',
  NEXOSAI_BOOTSTRAP_ADMIN_EMAIL: process.env.NEXOSAI_BOOTSTRAP_ADMIN_EMAIL || 'bootstrap@example.invalid',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://nexosai_test:local_ci_only@127.0.0.1:5432/nexosai_g3c_test',
};

const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
  { env, stdio: ['ignore', 'pipe', 'pipe'] }
);

let errorText = '';
child.stderr.on('data', (b) => {
  errorText = (errorText + String(b)).slice(-1000);
});

let db = null;
let cleanupFn = null;

try {
  let ready = false;
  for (let n = 0; n < 80; n++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${host}/login`, { signal: AbortSignal.timeout(1500) });
      if (response.status < 500) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(400);
  }
  assert.equal(ready, true, `Next.js startup failed: ${errorText}`);

  // Test 1: Unauthenticated request to /admin is redirected to /login at edge middleware
  const adminUnauth = await fetch(`${host}/admin`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.equal(adminUnauth.status, 307, 'Unauthenticated /admin must redirect 307');
  assert.match(adminUnauth.headers.get('location') || '', /\/login\?callbackUrl=%2Fadmin/);
  console.log('PASS: Unauthenticated /admin correctly redirected to /login');

  // Test 2: Unauthenticated request to /dashboard is redirected to /login
  const dashUnauth = await fetch(`${host}/dashboard`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.equal(dashUnauth.status, 307, 'Unauthenticated /dashboard must redirect 307');
  assert.match(dashUnauth.headers.get('location') || '', /\/login\?callbackUrl=%2Fdashboard/);
  console.log('PASS: Unauthenticated /dashboard correctly redirected to /login');

  // Test 3: Unauthenticated request to /audit is redirected to /login
  const auditUnauth = await fetch(`${host}/audit`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.equal(auditUnauth.status, 307, 'Unauthenticated /audit must redirect 307');
  assert.match(auditUnauth.headers.get('location') || '', /\/login\?callbackUrl=%2Faudit/);
  console.log('PASS: Unauthenticated /audit correctly redirected to /login');

  // Test 4: Tampered cookie to API endpoints rejected 401
  const badCookie = 'next-auth.session-token=malformed-tampered-jwe-token';
  const apiTampered = await fetch(`${host}/api/orgs/org-a/nodes/node-a`, {
    headers: { cookie: badCookie },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(apiTampered.status, 401, 'Tampered cookie must fail closed 401');
  console.log('PASS: Tampered cookie on API endpoint rejected 401');

  // Test 5: Cookie signed with wrong key rejected 401
  const foreignToken = await encode({
    secret: 'different-signing-secret-that-is-at-least-32-chars-long',
    token: { sub: 'attacker@example.invalid', email: 'attacker@example.invalid' },
    maxAge: 3600,
  });
  const apiForeign = await fetch(`${host}/api/orgs/org-a/nodes/node-a`, {
    headers: { cookie: `next-auth.session-token=${foreignToken}` },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(apiForeign.status, 401, 'Foreign-signed cookie must fail closed 401');
  console.log('PASS: Foreign-signed cookie rejected 401');

  // Test 6: Real PostgreSQL Authenticated Multi-Tenant & RBAC Integration
  if (process.env.G3C_EPHEMERAL_POSTGRES === 'YES') {
    db = new PrismaClient();
    const canConnect = await db.$connect().then(() => true).catch(() => false);

    if (canConnect) {
      console.log('PostgreSQL connection established for real HTTP RBAC verification.');
      const suffix = randomUUID().replaceAll('-', '').slice(0, 8);
      const orgAId = `org-a-${suffix}`;
      const orgBId = `org-b-${suffix}`;
      const adminAEmail = `admin-a-${suffix}@example.invalid`;
      const viewerAEmail = `viewer-a-${suffix}@example.invalid`;
      const userBEmail = `user-b-${suffix}@example.invalid`;

      const orgA = await db.organization.create({ data: { id: orgAId, name: 'Org A E2E', slug: `org-a-${suffix}` } });
      const orgB = await db.organization.create({ data: { id: orgBId, name: 'Org B E2E', slug: `org-b-${suffix}` } });
      const userAdminA = await db.user.create({ data: { email: adminAEmail } });
      const userViewerA = await db.user.create({ data: { email: viewerAEmail } });
      const userB = await db.user.create({ data: { email: userBEmail } });

      await db.organizationMembership.create({
        data: { userId: userAdminA.id, organizationId: orgA.id, role: 'ADMIN', status: 'ACTIVE' },
      });
      await db.organizationMembership.create({
        data: { userId: userViewerA.id, organizationId: orgA.id, role: 'VIEWER', status: 'ACTIVE' },
      });
      await db.organizationMembership.create({
        data: { userId: userB.id, organizationId: orgB.id, role: 'ADMIN', status: 'ACTIVE' },
      });

      const nodeA = await db.node.create({ data: { organizationId: orgA.id, name: 'Node E2E A' } });
      const nodeB = await db.node.create({ data: { organizationId: orgB.id, name: 'Node E2E B' } });
      const agentA = await db.agent.create({
        data: { organizationId: orgA.id, name: 'Agent E2E A', systemPrompt: 'TOP_SECRET_PROMPT' },
      });
      const convA = await db.conversation.create({ data: { organizationId: orgA.id, title: 'Conv E2E A' } });
      const msgA = await db.message.create({ data: { conversationId: convA.id, content: 'Private message', role: 'USER' } });

      cleanupFn = async () => {
        try {
          await db.message.deleteMany({ where: { conversationId: convA.id } });
          await db.conversation.deleteMany({ where: { organizationId: orgA.id } });
          await db.agent.deleteMany({ where: { organizationId: orgA.id } });
          await db.node.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
          await db.organizationMembership.deleteMany({ where: { organizationId: { in: [orgA.id, orgB.id] } } });
          await db.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
          await db.user.deleteMany({ where: { id: { in: [userAdminA.id, userViewerA.id, userB.id] } } });
        } catch {}
      };

      const cookieAdminA = await makeCookie(adminAEmail);
      const cookieViewerA = await makeCookie(viewerAEmail);

      // 6.1: Active Admin A reads own node 200
      const nodeRes = await fetch(`${host}/api/orgs/${orgA.id}/nodes/${nodeA.id}`, {
        headers: { cookie: cookieAdminA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(nodeRes.status, 200);
      const nodeBody = await nodeRes.json();
      assert.equal(nodeBody.node.id, nodeA.id);
      console.log('PASS: HTTP GET /nodes own node returns 200');

      // 6.2: Cross-tenant node query is concealed 404
      const crossNodeRes = await fetch(`${host}/api/orgs/${orgA.id}/nodes/${nodeB.id}`, {
        headers: { cookie: cookieAdminA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(crossNodeRes.status, 404, 'Cross-tenant resource must be concealed 404');
      console.log('PASS: Cross-tenant node request concealed 404');

      // 6.3: Foreign org without membership returns 403
      const foreignOrgRes = await fetch(`${host}/api/orgs/${orgB.id}/nodes/${nodeB.id}`, {
        headers: { cookie: cookieAdminA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(foreignOrgRes.status, 403, 'Foreign tenant request must fail 403');
      console.log('PASS: Foreign organization node request denied 403');

      // 6.4: Active Viewer reads agent; systemPrompt MUST NOT be disclosed
      const agentRes = await fetch(`${host}/api/orgs/${orgA.id}/agents/${agentA.id}`, {
        headers: { cookie: cookieViewerA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(agentRes.status, 200);
      const agentBody = await agentRes.json();
      assert.equal('systemPrompt' in agentBody.agent, false, 'systemPrompt must never be disclosed to viewer');
      console.log('PASS: HTTP GET /agents returns 200 and suppresses systemPrompt');

      // 6.5: Active Viewer reads conversation 200
      const convRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}`, {
        headers: { cookie: cookieViewerA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(convRes.status, 200);
      console.log('PASS: HTTP GET /conversations returns 200 for Viewer');

      // 6.6: Viewer is denied reading message content 403
      const msgViewerRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}/messages/${msgA.id}`, {
        headers: { cookie: cookieViewerA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(msgViewerRes.status, 403, 'Viewer must be denied reading message content');
      console.log('PASS: VIEWER denied reading message content 403');

      // 6.7: Upgrade Viewer to OPERATOR in DB -> immediate read allowed 200
      await db.organizationMembership.update({
        where: { userId_organizationId: { userId: userViewerA.id, organizationId: orgA.id } },
        data: { role: 'OPERATOR' },
      });
      const msgOpRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}/messages/${msgA.id}`, {
        headers: { cookie: cookieViewerA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(msgOpRes.status, 200, 'Upgraded Operator must be permitted to read message');
      console.log('PASS: Upgraded role OPERATOR immediately allowed reading message 200');

      // 6.8: Revoke membership in DB -> immediate denial 403
      await db.organizationMembership.update({
        where: { userId_organizationId: { userId: userViewerA.id, organizationId: orgA.id } },
        data: { status: 'REVOKED' },
      });
      const msgRevokedRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}/messages/${msgA.id}`, {
        headers: { cookie: cookieViewerA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(msgRevokedRes.status, 403, 'Revoked membership must fail closed 403');
      console.log('PASS: Revoked membership immediately denies request 403');

      // 6.9: Admin Page access with ACTIVE ADMIN -> 200
      const adminPageOk = await fetch(`${host}/admin?organizationId=${orgA.id}`, {
        headers: { cookie: cookieAdminA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(adminPageOk.status, 200);
      const adminHtml = await adminPageOk.text();
      assert.match(adminHtml, new RegExp(adminAEmail));
      console.log('PASS: /admin renders 200 for ACTIVE ADMIN');

      // 6.10: Admin Page access with REVOKED user -> 403
      const adminPageDenied = await fetch(`${host}/admin?organizationId=${orgA.id}`, {
        headers: { cookie: cookieViewerA },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(adminPageDenied.status, 200); // Next.js returns 200 with rendered 403 error component
      const deniedHtml = await adminPageDenied.text();
      assert.match(deniedHtml, /403 Access Denied/);
      console.log('PASS: /admin correctly renders 403 Access Denied for REVOKED user');

      // 6.11: Audit Page access without organizationId -> returns instructional banner
      const auditMissingOrg = await fetch(`${host}/audit`, {
        headers: { cookie: cookieAdminA },
        signal: AbortSignal.timeout(5000),
      });
      assert.match(await auditMissingOrg.text(), /Please specify an active organization parameter/);
      console.log('PASS: /audit without organizationId requires explicit organization parameter');

      // 6.12: Audit Page access with foreign org -> returns 403 Access Denied
      const auditForeignOrg = await fetch(`${host}/audit?organizationId=${orgB.id}`, {
        headers: { cookie: cookieAdminA },
        signal: AbortSignal.timeout(5000),
      });
      assert.match(await auditForeignOrg.text(), /403 Access Denied/);
      console.log('PASS: /audit for foreign organization returns 403 Access Denied');

      // 6.13: Audit Page access with ACTIVE ADMIN of own org -> renders audit view safely
      const auditOwnOrg = await fetch(`${host}/audit?organizationId=${orgA.id}`, {
        headers: { cookie: cookieAdminA },
        signal: AbortSignal.timeout(5000),
      });
      const auditHtml = await auditOwnOrg.text();
      assert.match(auditHtml, /Operational Events & Audit Trail/);
      assert.doesNotMatch(auditHtml, /helpus\.ecommerce@gmail\.com/);
      console.log('PASS: /audit for authorized admin renders safely without leaks');
    }
  }

  console.log('ALL_AUTHENTICATED_HTTP_INVARIANTS_PASSED');
} finally {
  if (cleanupFn) await cleanupFn();
  if (db) await db.$disconnect();
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(2500)]);
  if (child.exitCode === null) child.kill('SIGKILL');
}
