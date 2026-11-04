import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { encode } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

// FAIL-HARD VALIDATIONS: Refuse to execute or skip silently.
if (process.env.G3C_EPHEMERAL_POSTGRES !== 'YES') {
  throw new Error('FAIL_HARD: G3C_EPHEMERAL_POSTGRES must be set to "YES" to run integration suite');
}

const dbUrl = process.env.DATABASE_URL || '';
const parsed = (() => {
  try {
    return new URL(dbUrl);
  } catch {
    return null;
  }
})();

if (
  !parsed ||
  !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
  parsed.pathname !== '/nexosai_g3c_test'
) {
  throw new Error(
    `FAIL_HARD: Refusing non-ephemeral database: require localhost/nexosai_g3c_test (got: ${dbUrl})`
  );
}

const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error('FAIL_HARD: AUTH_SECRET must be supplied and at least 32 characters');
}

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
  DATABASE_URL: dbUrl,
};

// Connect directly to ensure database is live before starting Next.js
const db = new PrismaClient();
try {
  await db.$connect();
  console.log('FAIL_HARD_CHECK: PostgreSQL ephemeral connection validated successfully.');
} catch (err) {
  throw new Error(`FAIL_HARD: Failed to connect to ephemeral database at ${dbUrl}: ${err.message}`);
}

const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
  { env, stdio: ['ignore', 'pipe', 'pipe'] }
);

let errorText = '';
child.stderr.on('data', (b) => {
  errorText = (errorText + String(b)).slice(-1000);
});

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

  // Test 1: Edge redirects for unauthenticated requests
  const adminUnauth = await fetch(`${host}/admin`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.equal(adminUnauth.status, 307, 'Unauthenticated /admin must redirect 307');
  assert.match(adminUnauth.headers.get('location') || '', /\/login\?callbackUrl=%2Fadmin/);

  const dashUnauth = await fetch(`${host}/dashboard`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.equal(dashUnauth.status, 307, 'Unauthenticated /dashboard must redirect 307');
  assert.match(dashUnauth.headers.get('location') || '', /\/login\?callbackUrl=%2Fdashboard/);

  const auditUnauth = await fetch(`${host}/audit`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.equal(auditUnauth.status, 307, 'Unauthenticated /audit must redirect 307');
  assert.match(auditUnauth.headers.get('location') || '', /\/login\?callbackUrl=%2Faudit/);
  console.log('VERIFIED_CASE_1: Unauthenticated edge redirects (3/3 passed)');

  // Test 2: Tampered and foreign cookies fail closed 401
  const badCookie = 'next-auth.session-token=malformed-tampered-jwe-token';
  const apiTampered = await fetch(`${host}/api/orgs/org-a/nodes/node-a`, {
    headers: { cookie: badCookie },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(apiTampered.status, 401, 'Tampered cookie must fail closed 401');

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
  console.log('VERIFIED_CASE_2: Tampered/Foreign tokens reject 401 (2/2 passed)');

  // Test 3: PostgreSQL Seed and Multi-Tenant RBAC Validation
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

  // 3.1: Active Admin A reads own node -> 200
  const nodeRes = await fetch(`${host}/api/orgs/${orgA.id}/nodes/${nodeA.id}`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(nodeRes.status, 200);
  const nodeBody = await nodeRes.json();
  assert.equal(nodeBody.node.id, nodeA.id);

  // 3.2: Cross-tenant node query is concealed -> 404
  const crossNodeRes = await fetch(`${host}/api/orgs/${orgA.id}/nodes/${nodeB.id}`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(crossNodeRes.status, 404, 'Cross-tenant resource must be concealed 404');

  // 3.3: Foreign org without membership -> 403
  const foreignOrgRes = await fetch(`${host}/api/orgs/${orgB.id}/nodes/${nodeB.id}`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(foreignOrgRes.status, 403, 'Foreign tenant request must fail 403');
  console.log('VERIFIED_CASE_3: Postgres Node Isolation (3/3 passed)');

  // 3.4: Active Viewer reads agent; systemPrompt MUST NOT be disclosed
  const agentRes = await fetch(`${host}/api/orgs/${orgA.id}/agents/${agentA.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(agentRes.status, 200);
  const agentBody = await agentRes.json();
  assert.equal('systemPrompt' in agentBody.agent, false, 'systemPrompt must never be disclosed to viewer');
  console.log('VERIFIED_CASE_4: Postgres Agent Isolation & systemPrompt suppression (1/1 passed)');


  // Agents page: real HTTP tenant isolation and systemPrompt minimization.
  const agentsPageOwn = await fetch(`${host}/agents?organizationId=${orgA.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(agentsPageOwn.status, 200, 'Active member can view own tenant agents');
  const agentsOwnHtml = await agentsPageOwn.text();
  assert.match(agentsOwnHtml, /Agent E2E A/, 'Authorized agents must render');
  assert.doesNotMatch(agentsOwnHtml, /TOP_SECRET_PROMPT|System Prompt/, 'No prompt or prompt label may render');

  const agentsPageForeign = await fetch(`${host}/agents?organizationId=${orgB.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(agentsPageForeign.status, 403, 'Foreign tenant agents must return real 403');

  const agentsPageNoOrg = await fetch(`${host}/agents`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(agentsPageNoOrg.status, 403, 'Page must require explicit organizationId');

  const agentsPageTamperedOrg = await fetch(`${host}/agents?organizationId=..%2Fsecret`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(agentsPageTamperedOrg.status, 403, 'Malformed tenant context must be denied');
  console.log('VERIFIED_AGENTS_PAGE: tenant binding, real HTTP 403, and prompt suppression (4/4 passed)');

  // 3.5: Active Viewer reads conversation 200
  const convRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(convRes.status, 200);

  // 3.6: Viewer is denied reading message content 403
  const msgViewerRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}/messages/${msgA.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(msgViewerRes.status, 403, 'Viewer must be denied reading message content');

  // 3.7: Upgrade Viewer to OPERATOR in DB -> immediate read allowed 200
  await db.organizationMembership.update({
    where: { userId_organizationId: { userId: userViewerA.id, organizationId: orgA.id } },
    data: { role: 'OPERATOR' },
  });
  const msgOpRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}/messages/${msgA.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(msgOpRes.status, 200, 'Upgraded Operator must be permitted to read message');

  // 3.8: Revoke membership in DB -> immediate denial 403
  await db.organizationMembership.update({
    where: { userId_organizationId: { userId: userViewerA.id, organizationId: orgA.id } },
    data: { status: 'REVOKED' },
  });
  const msgRevokedRes = await fetch(`${host}/api/orgs/${orgA.id}/conversations/${convA.id}/messages/${msgA.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(msgRevokedRes.status, 403, 'Revoked membership must fail closed 403');
  console.log('VERIFIED_CASE_5: Postgres Message RBAC and Dynamic Revocation (3/3 passed)');

  // 3.9: Admin Page access with ACTIVE ADMIN -> 200
  const adminPageOk = await fetch(`${host}/admin?organizationId=${orgA.id}`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(adminPageOk.status, 200, 'Active admin must receive HTTP 200 on /admin');
  const adminHtml = await adminPageOk.text();
  assert.match(adminHtml, new RegExp(adminAEmail));

  // 3.10: Admin Page access with REVOKED user -> REAL HTTP 403
  const adminPageDenied = await fetch(`${host}/admin?organizationId=${orgA.id}`, {
    headers: { cookie: cookieViewerA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(adminPageDenied.status, 403, 'Denied admin access must return real HTTP 403 status code');
  console.log('VERIFIED_CASE_6: Admin Page real HTTP 403 enforcement (2/2 passed)');

  // 3.11: Audit Page access without organizationId -> REAL HTTP 403
  const auditMissingOrg = await fetch(`${host}/audit`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(auditMissingOrg.status, 403, 'Audit access without explicit org must return real HTTP 403');

  // 3.12: Audit Page access with foreign org -> REAL HTTP 403
  const auditForeignOrg = await fetch(`${host}/audit?organizationId=${orgB.id}`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(auditForeignOrg.status, 403, 'Audit access for foreign org must return real HTTP 403');

  // 3.13: Audit Page access with ACTIVE ADMIN of own org -> HTTP 200
  const auditOwnOrg = await fetch(`${host}/audit?organizationId=${orgA.id}`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(auditOwnOrg.status, 200, 'Authorized admin must receive HTTP 200 on /audit');
  const auditHtml = await auditOwnOrg.text();
  assert.match(auditHtml, /Operational Events/);
  assert.doesNotMatch(auditHtml, /helpus\.ecommerce@gmail\.com/);
  console.log('VERIFIED_CASE_7: Audit Page real HTTP 403 and authorized 200 (3/3 passed)');


  // 3.14: Executive Page & API fail closed by default when NEXOSAI_EXECUTIVE_ENABLED is OFF
  const execUnauth = await fetch(`${host}/executive`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
  assert.equal(execUnauth.status, 307, 'Unauthenticated /executive must redirect 307');
  assert.match(execUnauth.headers.get('location') || '', /\/login\?callbackUrl=%2Fexecutive/);

  const execPageDefaultOff = await fetch(`${host}/executive?organizationId=${orgA.id}`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(execPageDefaultOff.status, 403, 'Executive page must fail closed 403 when global flag is OFF');

  const execApiDefaultOff = await fetch(`${host}/api/orgs/${orgA.id}/executive/briefing`, {
    headers: { cookie: cookieAdminA },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(execApiDefaultOff.status, 403, 'Executive API must fail closed 403 when global flag is OFF');
  const execApiDefaultOffBody = await execApiDefaultOff.json();
  assert.equal(execApiDefaultOffBody.error, 'EXECUTIVE_MODULE_DISABLED');
  console.log('VERIFIED_EXECUTIVE_FAIL_CLOSED_DEFAULT_OFF: 3/3 passed');

  console.log('ALL_POSTGRESQL_AUTHENTICATED_E2E_CASES_VERIFIED: 20/20 ASSERCOES CONFIRMADAS');

  // Isolated, reversible fault injection against the disposable PostgreSQL16 CI database only.
  // This establishes a true HTTP failure response instead of erroneously rendering an empty audit trail.
  // It does NOT certify an exact 503 response; Next.js Server Components may use HTTP 500 by default.
  await db.$executeRawUnsafe('ALTER TABLE "AuditLog" RENAME TO "AuditLog_unavailable_ci"');
  try {
    const auditOutage = await fetch(`${host}/audit?organizationId=${orgA.id}`, {
      headers: { cookie: cookieAdminA },
      signal: AbortSignal.timeout(10000),
    });
    const outageHtml = await auditOutage.text();
    assert.equal(auditOutage.status >= 500 && auditOutage.status < 600, true,
      'Audit storage outage must return a server error, not a successful empty audit trail');
    assert.doesNotMatch(outageHtml, /No execution logs recorded for this organization\./,
      'Audit database outage must not be displayed as an empty legitimate history');
    assert.doesNotMatch(outageHtml, /postgresql:\/\/|local_ci_only|127\.0\.0\.1:5432/i,
      'Audit error page must not leak database connection information');
    console.log('VERIFIED_AUDIT_STORAGE_OUTAGE_HTTP: server error, never empty trail, no DB credentials');
  } finally {
    // Never leave the disposable runner's database schema damaged, even if the assertion fails.
    await db.$executeRawUnsafe('ALTER TABLE "AuditLog_unavailable_ci" RENAME TO "AuditLog"');
  }


} finally {
  if (cleanupFn) await cleanupFn();
  if (db) await db.$disconnect();
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(2500)]);
  if (child.exitCode === null) child.kill('SIGKILL');
}
