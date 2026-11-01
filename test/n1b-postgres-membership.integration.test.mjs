import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { authorizeNodeRead } from '../src/lib/tenant-access.mjs';

// Deliberately fails if somebody points this suite at a non-disposable database.
const url = process.env.DATABASE_URL || '';
const parsed = (() => { try { return new URL(url); } catch { return null; } })();
if (!parsed || !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
    parsed.pathname !== '/nexosai_g3c_test' ||
    process.env.G3C_EPHEMERAL_POSTGRES !== 'YES') {
  throw new Error('Refusing non-ephemeral database: require localhost/nexosai_g3c_test and G3C_EPHEMERAL_POSTGRES=YES');
}

test('real PostgreSQL membership is request-scoped and deny-by-default', async () => {
  const db = new PrismaClient();
  const suffix = randomUUID().replaceAll('-', '');
  const aEmail = `owner-${suffix}@example.invalid`;
  const bEmail = `outsider-${suffix}@example.invalid`;
  const orgA = await db.organization.create({ data: { name: 'Tenant A test', slug: `g3ca-${suffix}` } });
  const orgB = await db.organization.create({ data: { name: 'Tenant B test', slug: `g3cb-${suffix}` } });
  const userA = await db.user.create({ data: { email: aEmail } });
  const userB = await db.user.create({ data: { email: bEmail } });
  try {
    const nodeA = await db.node.create({data:{organizationId:orgA.id,name:'Scoped Node A'}});
    const nodeB = await db.node.create({data:{organizationId:orgB.id,name:'Private Node B'}});
    const query = (email,organizationId,nodeId) => authorizeNodeRead({email,organizationId,nodeId,db});
    assert.equal((await query(null,orgA.id,nodeA.id)).status,401);
    assert.equal((await query(aEmail,orgA.id,nodeA.id)).status,403);
    await db.organizationMembership.create({data:{userId:userA.id,organizationId:orgA.id}});
    assert.equal((await query(aEmail,orgA.id,nodeA.id)).status,403, 'suspended by default');
    await db.organizationMembership.update({
      where:{userId_organizationId:{userId:userA.id,organizationId:orgA.id}},
      data:{status:'ACTIVE',role:'VIEWER'}
    });
    let permitted = await query(aEmail.toUpperCase(),orgA.id,nodeA.id);
    assert.equal(permitted.status,200);
    assert.equal(permitted.node.organizationId,orgA.id);
    assert.deepEqual(Object.keys(permitted.node).sort(),['id','lastSeenAt','name','organizationId','status','type']);
    assert.equal((await query(aEmail,orgA.id,nodeB.id)).status,404, 'cross-tenant resource concealed');
    assert.equal((await query(aEmail,orgB.id,nodeB.id)).status,403, 'no foreign membership');
    assert.equal((await query(bEmail,orgA.id,nodeA.id)).status,403, 'second user unauthorized');
    assert.equal((await query(aEmail,orgA.id,'invalid/identifier')).status,404);
    await db.organizationMembership.update({
      where:{userId_organizationId:{userId:userA.id,organizationId:orgA.id}},data:{status:'REVOKED'}
    });
    assert.equal((await query(aEmail,orgA.id,nodeA.id)).status,403, 'revocation effective immediately');
    await db.organizationMembership.update({
      where:{userId_organizationId:{userId:userA.id,organizationId:orgA.id}},data:{status:'ACTIVE',role:'VIEWER'}
    });
    await db.organizationMembership.delete({
      where:{userId_organizationId:{userId:userA.id,organizationId:orgA.id}}
    });
    assert.equal((await query(aEmail,orgA.id,nodeA.id)).status,403, 'membership deletion effective immediately');
  } finally {
    await db.node.deleteMany({where:{organizationId:{in:[orgA.id,orgB.id]}}});
    await db.organization.deleteMany({where:{id:{in:[orgA.id,orgB.id]}}});
    await db.user.deleteMany({where:{id:{in:[userA.id,userB.id]}}});
    await db.$disconnect();
  }
});
