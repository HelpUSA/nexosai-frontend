import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {listTenantAuditLogs} from '../src/lib/audit-access.mjs';

assert.equal(process.env.N1B_ALLOW_EPHEMERAL_DB_TEST,'yes');
const uri=new URL(process.env.DATABASE_URL||'postgresql://x:x@127.0.0.1:1/invalid');
assert.equal(uri.hostname,'127.0.0.1');assert.equal(uri.pathname,'/n1b_lab');assert.equal(uri.username,'n1b_lab');
const db=new PrismaClient();
const suffix=randomUUID().slice(0,8),orgA='auditorga'+suffix,orgB='auditorgb'+suffix;
try{
  await db.$connect();
  await db.organization.createMany({data:[{id:orgA,name:'Audit Lab A',slug:orgA},{id:orgB,name:'Audit Lab B',slug:orgB}]});
  await db.auditLog.createMany({data:[
    {organizationId:orgA,action:'VISIBLE_A',severity:'INFO',details:'Synthetic same-tenant record'},
    {organizationId:orgB,action:'SECRET_B',severity:'WARN',details:'Synthetic foreign-tenant record'},
    {organizationId:null,action:'GLOBAL_SECRET',severity:'INFO',details:'Synthetic unscoped system record'}
  ]});
  await test('real PostgreSQL audit query returns only organization A records',async()=>{
    const logs=await listTenantAuditLogs({organizationId:orgA,db});
    assert.equal(logs.length,1);
    assert.equal(logs[0].action,'VISIBLE_A');
    assert.ok(logs.every(log=>log.action!=='SECRET_B'&&log.action!=='GLOBAL_SECRET'));
  });
  await test('real PostgreSQL audit query cannot expose org B from org A selection',async()=>{
    const logs=await listTenantAuditLogs({organizationId:orgB,db});
    assert.equal(logs.length,1);
    assert.equal(logs[0].action,'SECRET_B');
  });
}finally{
  await db.auditLog.deleteMany({where:{action:{in:['VISIBLE_A','SECRET_B','GLOBAL_SECRET']},details:{startsWith:'Synthetic'}}});
  await db.organization.deleteMany({where:{id:{in:[orgA,orgB]}}});
  await db.$disconnect();
}
