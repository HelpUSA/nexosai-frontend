import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeAdminAccess, authorizeAuditAccess } from '../src/lib/admin-access.mjs';

function createMockDb() {
  const users = new Map([
    ['admin@example.invalid', { id: 'u-admin', email: 'admin@example.invalid' }],
    ['owner@example.invalid', { id: 'u-owner', email: 'owner@example.invalid' }],
    ['operator@example.invalid', { id: 'u-operator', email: 'operator@example.invalid' }],
    ['viewer@example.invalid', { id: 'u-viewer', email: 'viewer@example.invalid' }],
    ['suspended@example.invalid', { id: 'u-suspended', email: 'suspended@example.invalid' }],
    ['revoked@example.invalid', { id: 'u-revoked', email: 'revoked@example.invalid' }],
  ]);

  const memberships = new Map([
    ['u-admin:org-a', { userId: 'u-admin', organizationId: 'org-a', role: 'ADMIN', status: 'ACTIVE' }],
    ['u-owner:org-a', { userId: 'u-owner', organizationId: 'org-a', role: 'OWNER', status: 'ACTIVE' }],
    ['u-operator:org-a', { userId: 'u-operator', organizationId: 'org-a', role: 'OPERATOR', status: 'ACTIVE' }],
    ['u-viewer:org-a', { userId: 'u-viewer', organizationId: 'org-a', role: 'VIEWER', status: 'ACTIVE' }],
    ['u-suspended:org-a', { userId: 'u-suspended', organizationId: 'org-a', role: 'ADMIN', status: 'SUSPENDED' }],
    ['u-revoked:org-a', { userId: 'u-revoked', organizationId: 'org-a', role: 'ADMIN', status: 'REVOKED' }],
    ['u-admin:org-b', { userId: 'u-admin', organizationId: 'org-b', role: 'VIEWER', status: 'ACTIVE' }],
  ]);

  return {
    user: {
      findUnique: async ({ where }) => users.get(where.email) || null,
    },
    organizationMembership: {
      findUnique: async ({ where }) => {
        const key = `${where.userId_organizationId.userId}:${where.userId_organizationId.organizationId}`;
        return memberships.get(key) || null;
      },
    },
  };
}

test('authorizeAdminAccess: missing or invalid email fails closed 401', async () => {
  const db = createMockDb();
  assert.equal((await authorizeAdminAccess({ email: null, organizationId: 'org-a', db })).status, 401);
  assert.equal((await authorizeAdminAccess({ email: 'not-an-email', organizationId: 'org-a', db })).status, 401);
});

test('authorizeAdminAccess: missing explicit organizationId is strictly rejected 400 (no fallback)', async () => {
  const db = createMockDb();
  assert.ok([400, 403].includes((await authorizeAdminAccess({ email: 'admin@example.invalid', organizationId: null, db })).status));
  assert.ok([400, 403].includes((await authorizeAdminAccess({ email: 'admin@example.invalid', organizationId: '', db })).status));
});

test('authorizeAdminAccess: unregistered user fails 403', async () => {
  const db = createMockDb();
  assert.equal((await authorizeAdminAccess({ email: 'unknown@example.invalid', organizationId: 'org-a', db })).status, 403);
});

test('authorizeAdminAccess: VIEWER or OPERATOR denied admin access 403', async () => {
  const db = createMockDb();
  assert.equal((await authorizeAdminAccess({ email: 'viewer@example.invalid', organizationId: 'org-a', db })).status, 403);
  assert.equal((await authorizeAdminAccess({ email: 'operator@example.invalid', organizationId: 'org-a', db })).status, 403);
});

test('authorizeAdminAccess: SUSPENDED or REVOKED admin denied 403', async () => {
  const db = createMockDb();
  assert.equal((await authorizeAdminAccess({ email: 'suspended@example.invalid', organizationId: 'org-a', db })).status, 403);
  assert.equal((await authorizeAdminAccess({ email: 'revoked@example.invalid', organizationId: 'org-a', db })).status, 403);
});

test('authorizeAdminAccess: user from foreign organization denied 403', async () => {
  const db = createMockDb();
  assert.equal((await authorizeAdminAccess({ email: 'viewer@example.invalid', organizationId: 'org-b', db })).status, 403);
  assert.equal((await authorizeAdminAccess({ email: 'admin@example.invalid', organizationId: 'org-b', db })).status, 403);
});

test('authorizeAdminAccess: ACTIVE ADMIN or OWNER permitted 200', async () => {
  const db = createMockDb();
  const resAdmin = await authorizeAdminAccess({ email: 'admin@example.invalid', organizationId: 'org-a', db });
  assert.equal(resAdmin.status, 200);
  assert.equal(resAdmin.role, 'ADMIN');

  const resOwner = await authorizeAdminAccess({ email: 'owner@example.invalid', organizationId: 'org-a', db });
  assert.equal(resOwner.status, 200);
  assert.equal(resOwner.role, 'OWNER');
});

test('authorizeAuditAccess: requires explicit organizationId, OPERATOR permitted, VIEWER denied', async () => {
  const db = createMockDb();
  assert.ok([400, 403].includes((await authorizeAuditAccess({ email: 'admin@example.invalid', organizationId: '', db })).status));

  const resOp = await authorizeAuditAccess({ email: 'operator@example.invalid', organizationId: 'org-a', db });
  assert.equal(resOp.status, 200);
  assert.equal(resOp.role, 'OPERATOR');

  assert.equal((await authorizeAuditAccess({ email: 'viewer@example.invalid', organizationId: 'org-a', db })).status, 403);
  assert.equal((await authorizeAuditAccess({ email: 'revoked@example.invalid', organizationId: 'org-a', db })).status, 403);
});
