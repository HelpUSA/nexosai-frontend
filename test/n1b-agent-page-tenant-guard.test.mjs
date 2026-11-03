import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authorizeAgentList, agentListQuery, AGENT_PUBLIC_LIST_SELECT } from '../src/lib/agent-list-access.mjs';

const members = new Map([
  ['owner:org-a', { organizationId: 'org-a', status: 'ACTIVE', role: 'OWNER' }],
  ['viewer:org-a', { organizationId: 'org-a', status: 'ACTIVE', role: 'VIEWER' }],
  ['operator:org-a', { organizationId: 'org-a', status: 'ACTIVE', role: 'OPERATOR' }],
  ['revoked:org-a', { organizationId: 'org-a', status: 'REVOKED', role: 'ADMIN' }],
  ['suspended:org-a', { organizationId: 'org-a', status: 'SUSPENDED', role: 'ADMIN' }],
  ['owner:org-b', { organizationId: 'org-b', status: 'ACTIVE', role: 'VIEWER' }],
]);
const calls = [];
const db = {
  user: { async findUnique({ where }) {
    calls.push(['user', where.email]);
    const id = where.email?.split('@')[0];
    return ['owner','viewer','operator','revoked','suspended'].includes(id) ? { id } : null;
  } },
  organizationMembership: { async findUnique({ where }) {
    calls.push(['membership', where.userId_organizationId]);
    const { userId, organizationId } = where.userId_organizationId;
    return members.get(userId + ':' + organizationId) || null;
  } },
};
const check = async (email, organizationId, dbOverride = db) =>
  authorizeAgentList({ email, organizationId, db: dbOverride });

test('Agents: unauthenticated and absent tenant fail closed before membership', async () => {
  assert.equal((await check(null, 'org-a')).status, 401);
  const before = calls.length;
  assert.equal((await check('owner@example.invalid', undefined)).status, 400);
  assert.equal(calls.length, before);
});
test('Agents: malformed tenant ID is not accepted', async () => {
  assert.equal((await check('owner@example.invalid', '../org-a')).status, 404);
});
test('Agents: unknown member, revoked and suspended are denied', async () => {
  assert.equal((await check('unknown@example.invalid', 'org-a')).status, 403);
  assert.equal((await check('revoked@example.invalid', 'org-a')).status, 403);
  assert.equal((await check('suspended@example.invalid', 'org-a')).status, 403);
});
test('Agents: active roles can only access explicit organization memberships', async () => {
  for (const who of ['owner','viewer','operator']) {
    assert.equal((await check(who + '@example.invalid', 'org-a')).status, 200);
  }
  assert.equal((await check('viewer@example.invalid', 'org-b')).status, 403);
  assert.equal((await check('owner@example.invalid', 'org-b')).role, 'VIEWER');
});
test('Agents: database outage fails closed', async () => {
  assert.equal((await check('owner@example.invalid', 'org-a', {
    user: { findUnique: async () => { throw new Error('database down'); } },
    organizationMembership: { findUnique: async () => null },
  })).status, 503);
});
test('Agents: tenant-filtered projection never loads systemPrompt or organization secrets', () => {
  const q = agentListQuery('org-a');
  assert.deepEqual(q.where, { organizationId: 'org-a' });
  assert.equal(q.take, 10);
  assert.equal(q.select, AGENT_PUBLIC_LIST_SELECT);
  for (const field of ['systemPrompt','apiKey','organization','credentials','user']) {
    assert.equal(Object.hasOwn(q.select, field), false, field);
  }
  assert.throws(() => agentListQuery('../../other'));
});
test('Agents: page uses server authorization and no public demo fallback or prompt rendering', () => {
  const page = readFileSync(new URL('../src/app/agents/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /authorizeAgentList\(/);
  assert.match(page, /forbidden\(\)/);
  assert.match(page, /agentListQuery\(authz\.organizationId\)/);
  assert.doesNotMatch(page, /systemPrompt\.slice|include:\s*\{\s*organization:/);
  assert.doesNotMatch(page, /if\s*\(agents\.length\s*===\s*0\)\s*\{\s*agents\s*=/);
});
