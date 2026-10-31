import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNexosAuthEnv } from '../src/lib/auth-env.mjs';

const good = () => ({
  AUTH_SECRET: 'this-is-a-local-test-only-cryptographic-fixture-32-bytes',
  GOOGLE_CLIENT_ID: 'synthetic-oauth-client-id.apps.invalid',
  GOOGLE_CLIENT_SECRET: 'synthetic-oauth-client-secret',
  NEXOSAI_BOOTSTRAP_ADMIN_EMAIL: 'bootstrap@example.invalid'
});
test('valid synthetic env accepted', () => {
  const x = parseNexosAuthEnv(good());
  assert.equal(x.bootstrapEmail, 'bootstrap@example.invalid');
  assert.ok(Object.isFrozen(x));
});
test('missing session secret fails closed', () => {
  const x = good(); delete x.AUTH_SECRET;
  assert.throws(() => parseNexosAuthEnv(x), /NEXOS_AUTH_SECRET_REQUIRED/);
});
test('short or demo secret fails closed', () => {
  for (const s of ['short', 'demo-secret-abcdefghijklmnopqrstuvwxyz', 'change-me'])
    assert.throws(() => parseNexosAuthEnv({...good(), AUTH_SECRET:s}), /NEXOS_AUTH_SECRET_REQUIRED/);
});
test('NEXTAUTH_SECRET compatibility', () => {
  const x = good(); x.NEXTAUTH_SECRET = x.AUTH_SECRET; delete x.AUTH_SECRET;
  assert.equal(parseNexosAuthEnv(x).secret, x.NEXTAUTH_SECRET);
});
test('conflicting secret names fail closed', () => {
  const x = good(); x.NEXTAUTH_SECRET = 'different-valid-session-secret-that-is-long-enough';
  assert.throws(() => parseNexosAuthEnv(x), /NEXOS_AUTH_SECRET_CONFLICT/);
});
test('missing OAuth credentials fail closed', () => {
  for (const key of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
    const x = good(); delete x[key];
    assert.throws(() => parseNexosAuthEnv(x), /NEXOS_GOOGLE_OAUTH_CREDENTIALS_REQUIRED/);
  }
});
test('demo credentials rejected', () => {
  assert.throws(() => parseNexosAuthEnv({...good(), GOOGLE_CLIENT_ID:'demo-client-id'}), /NEXOS_GOOGLE_OAUTH_CREDENTIALS_REQUIRED/);
});
test('bootstrap email required and normalized', () => {
  assert.throws(() => parseNexosAuthEnv({...good(), NEXOSAI_BOOTSTRAP_ADMIN_EMAIL:'invalid'}), /NEXOS_BOOTSTRAP_EMAIL_REQUIRED/);
  assert.equal(parseNexosAuthEnv({...good(), NEXOSAI_BOOTSTRAP_ADMIN_EMAIL:'BOOtstrap@Example.Invalid '}).bootstrapEmail,'bootstrap@example.invalid');
});
test('caller env not mutated', () => {
  const x=good(); const snapshot={...x}; parseNexosAuthEnv(x); assert.deepEqual(x,snapshot);
});
