import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { provisionApprovedBootstrapLab } from '../sandbox/n1b/controlled-bootstrap.mjs';
import { allowProvisionedGoogleSignIn } from '../src/lib/google-admission.mjs';

assert.equal(process.env.N1B_ALLOW_EPHEMERAL_DB_TEST,'yes');
const u=new URL(process.env.DATABASE_URL||'postgresql://x:x@127.0.0.1:1/invalid');
assert.equal(u.hostname,'127.0.0.1');
assert.equal(u.pathname,'/n1b_lab');
const suffix=randomUUID().replace(/-/g,'').slice(0,10);
const orgId='bootstraporg'+suffix;
const email='bootstrap-'+suffix+'@lab.invalid';
const env={...process.env,NEXOSAI_BOOTSTRAP_ADMIN_EMAIL:email,N1B_APPROVED_ORG_ID:orgId};
const db=new PrismaClient();
let userId=null;
try{
  await db.$connect();
  await db.organization.create({data:{id:orgId,name:'Preapproved Synthetic Lab Org',slug:orgId}});
  await test('unapproved organization does not get created by provisioning',async()=>{
    await assert.rejects(provisionApprovedBootstrapLab(db,{...env,N1B_APPROVED_ORG_ID:'bootstraporgwrong123'}),/MUST_PREEXIST/);
  });
  await test('disposable bootstrap preprovisions user+membership exactly once',async()=>{
    const first=await provisionApprovedBootstrapLab(db,env);
    assert.equal(first.created,true);
    userId=first.userId;
    const second=await provisionApprovedBootstrapLab(db,env);
    assert.equal(second.userId,first.userId);
    assert.equal(second.created,false);
    assert.equal(await db.organizationMembership.count({where:{userId,organizationId:orgId}}),1);
  });
  await test('approved and verified Google user can sign in only after provisioning',async()=>{
    const allowed=await allowProvisionedGoogleSignIn({
      user:{email:email.toUpperCase()},account:{provider:'google'},
      profile:{email,email_verified:true}
    },db);
    assert.equal(allowed,true);
  });
  await test('revocation is not silently undone by re-running bootstrap',async()=>{
    await db.organizationMembership.update({where:{userId_organizationId:{userId,organizationId:orgId}},data:{status:'REVOKED'}});
    await assert.rejects(provisionApprovedBootstrapLab(db,env),/MANUAL_REVIEW/);
    assert.equal(await allowProvisionedGoogleSignIn({
      user:{email},account:{provider:'google'},profile:{email,email_verified:true}
    },db),false);
  });
  await test('refuses remote DB and production-style domain even with flag',async()=>{
    await assert.rejects(provisionApprovedBootstrapLab(db,{...env,DATABASE_URL:'postgresql://n1b_lab:x@cloud.example.com/n1b_lab'}),/DISPOSABLE/);
    await assert.rejects(provisionApprovedBootstrapLab(db,{...env,NEXOSAI_BOOTSTRAP_ADMIN_EMAIL:'real-admin@gmail.com'}),/SYNTHETIC/);
    await assert.rejects(provisionApprovedBootstrapLab(db,{...env,N1B_ALLOW_EPHEMERAL_DB_TEST:'no'}),/LAB_ONLY/);
  });
}finally{
  if(userId){
    await db.organizationMembership.deleteMany({where:{userId}});
    await db.user.deleteMany({where:{id:userId}});
  }
  await db.organization.deleteMany({where:{id:orgId}});
  await db.$disconnect();
}
