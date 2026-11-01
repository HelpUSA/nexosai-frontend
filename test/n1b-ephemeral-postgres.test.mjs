// Order 037 LAB: ephemeral PostgreSQL only. Never run against live databases.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { authorizeNodeRead } from '../src/lib/tenant-access.mjs';

assert.equal(process.env.N1B_ALLOW_EPHEMERAL_DB_TEST,'yes','Explicit ephemeral DB gate required');
const uri=new URL(process.env.DATABASE_URL || 'postgresql://no:db@127.0.0.1:1/invalid');
assert.equal(uri.hostname,'127.0.0.1','DB must be loopback only');
assert.equal(uri.pathname,'/n1b_lab','DB must have dedicated ephemeral test name');
assert.equal(uri.username,'n1b_lab','DB must have dedicated synthetic test user');
const db=new PrismaClient();
const suffix=randomUUID().replace(/-/g,'').slice(0,12);
const orgA='laborgA'+suffix;
const orgB='laborgB'+suffix;
const nodeA='labnodeA'+suffix;
const nodeB='labnodeB'+suffix;
const userId='labuser'+suffix;
const email='n1b'+suffix+'@lab.invalid';
let seeded=false;
try {
  await db.$connect();
  await db.organization.createMany({data:[
    {id:orgA,name:'N1B Test Org A',slug:'n1b-a-'+suffix},
    {id:orgB,name:'N1B Test Org B',slug:'n1b-b-'+suffix}
  ]});
  await db.user.create({data:{id:userId,email}});
  await db.organizationMembership.create({data:{userId,organizationId:orgA,role:'VIEWER',status:'ACTIVE'}});
  await db.node.createMany({data:[
    {id:nodeA,organizationId:orgA,name:'Synthetic Local Node A'},
    {id:nodeB,organizationId:orgB,name:'Synthetic Local Node B'}
  ]});
  seeded=true;
  const run=(org,node)=>authorizeNodeRead({email,organizationId:org,nodeId:node,db});

  await test('real Prisma / PostgreSQL: active membership + own node passes',async()=>{
    const r=await run(orgA,nodeA);
    assert.equal(r.status,200);
    assert.equal(r.node.id,nodeA);
  });
  await test('real Prisma / PostgreSQL: foreign node ID hidden 404',async()=>{
    assert.equal((await run(orgA,nodeB)).status,404);
  });
  await test('real Prisma / PostgreSQL: no membership in org B is 403',async()=>{
    assert.equal((await run(orgB,nodeB)).status,403);
  });
  await test('real Prisma / PostgreSQL: suspended membership denied after prior success',async()=>{
    await db.organizationMembership.update({where:{userId_organizationId:{userId,organizationId:orgA}},data:{status:'SUSPENDED'}});
    assert.equal((await run(orgA,nodeA)).status,403);
  });
  await test('real Prisma / PostgreSQL: revoked membership denied',async()=>{
    await db.organizationMembership.update({where:{userId_organizationId:{userId,organizationId:orgA}},data:{status:'REVOKED'}});
    assert.equal((await run(orgA,nodeA)).status,403);
  });
  await test('real Prisma / PostgreSQL: DB availability failures do not authorize',async()=>{
    assert.equal((await authorizeNodeRead({email,organizationId:orgA,nodeId:nodeA,db:{user:{findUnique(){throw Error('injected failure');}},organizationMembership:db.organizationMembership,node:db.node}})).status,503);
  });
} finally {
  if(seeded){
    // Even with FK cascades, use explicit cleanup for repeatable ephemeral tests.
    await db.node.deleteMany({where:{organizationId:{in:[orgA,orgB]}}});
    await db.organizationMembership.deleteMany({where:{userId}});
    await db.user.deleteMany({where:{id:userId}});
    await db.organization.deleteMany({where:{id:{in:[orgA,orgB]}}});
  }
  await db.$disconnect();
}
