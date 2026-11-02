import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { encode } from 'next-auth/jwt';

// Verifies real App Router HTTP session enforcement, edge middleware redirect,
// and tamper-resistance against running Next.js instance on localhost.
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

  // Test 4: Authenticated session with valid signed cookie accesses /admin
  const adminCookie = await makeCookie('admin-user@example.invalid');
  const adminAuth = await fetch(`${host}/admin`, {
    headers: { cookie: adminCookie },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(adminAuth.status, 200, 'Authenticated session must access /admin');
  const adminHtml = await adminAuth.text();
  assert.match(adminHtml, /admin-user@example\.invalid/, 'Rendered page must reflect session email');
  assert.doesNotMatch(adminHtml, /helpus\.ecommerce@gmail\.com/, 'Must not leak hardcoded administrative email');
  console.log('PASS: Authenticated /admin rendered with user email and without leaks');

  // Test 5: Tampered cookie to API endpoints rejected 401
  const badCookie = 'next-auth.session-token=malformed-tampered-jwe-token';
  const apiTampered = await fetch(`${host}/api/orgs/org-a/nodes/node-a`, {
    headers: { cookie: badCookie },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(apiTampered.status, 401, 'Tampered cookie must fail closed 401');
  console.log('PASS: Tampered cookie on API endpoint rejected 401');

  // Test 6: Cookie signed with wrong key rejected 401
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

  console.log('ALL_AUTHENTICATED_HTTP_INVARIANTS_PASSED');
} finally {
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(2500)]);
  if (child.exitCode === null) child.kill('SIGKILL');
}
