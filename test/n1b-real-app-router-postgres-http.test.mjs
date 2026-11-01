// Order 037: Next.js production build HTTP against a disposable local PostgreSQL CI service.
// Does not use Google, real credentials, persistent databases or live deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

assert.equal(process.env.N1B_ALLOW_EPHEMERAL_DB_TEST,'yes');
const dbUrl=new URL(process.env.DATABASE_URL||'postgresql://x:x@127.0.0.1/x');
assert.equal(dbUrl.hostname,'127.0.0.1');
assert.equal(dbUrl.pathname,'/n1b_lab');
assert.equal(dbUrl.username,'n1b_lab');
const secret=process.env.AUTH_SECRET;
assert.ok(secret && secret.length>=32);

async function availablePort(){
  const s=createServer();
  await new Promise((resolve,reject)=>s.listen(0,'127.0.0.1',resolve).once('error',reject));
  const port=s.address().port;await new Promise(r=>s.close(r));return port;
}
async function startNext(port){
  const env={...process.env,NEXTAUTH_URL:'http://127.0.0.1:'+port,PORT:String(port),HOSTNAME:'127.0.0.1',NODE_ENV:'production'};
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
    cwd:process.cwd(),env,stdio:['ignore','pipe','pipe'],windowsHide:true
  });
  let log='';
  child.stdout.on('data',v=>log+=String(v).slice(-200));
  child.stderr.on('data',v=>log+=String(v).slice(-300));
  for(let n=0;n<100;n++){
    if(child.exitCode!==null)throw Error('Synthetic Next.js exited: '+log.slice(-500));
    try{
      const r=await fetch('http://127.0.0.1:'+port+'/api/orgs/invalid/nodes/invalid',{signal:AbortSignal.timeout(1000)});
      if(r.status)return child;
    }catch{}
    await delay(200);
  }
  child.kill();throw Error('Synthetic Next.js did not boot: '+log.slice(-500));
}
async function closeChild(child){
  if(child.exitCode!==null)return;
  child.kill();
  await Promise.race([new Promise(r=>child.once('exit',r)),delay(4000)]);
}
async function cookie(email){
  const token=await encode({secret,token:{sub:'lab-user',email,name:'Synthetic CI User'},maxAge:600});
  return 'next-auth.session-token='+token;
}
const db=new PrismaClient();
const suffix=randomUUID().slice(0,8);
const orgA='httporga'+suffix,orgB='httporgb'+suffix;
const nodeA='httpnodea'+suffix,nodeB='httpnodeb'+suffix;
const userId='httpuser'+suffix;
const email='http-'+suffix+'@lab.invalid';
let seeded=false,child;
try{
  await db.$connect();
  await db.organization.createMany({data:[{id:orgA,name:'HTTP Lab A',slug:orgA},{id:orgB,name:'HTTP Lab B',slug:orgB}]});
  await db.user.create({data:{id:userId,email}});
  await db.organizationMembership.create({data:{userId,organizationId:orgA,status:'ACTIVE',role:'VIEWER'}});
  await db.node.createMany({data:[{id:nodeA,organizationId:orgA,name:'HTTP Node A'},{id:nodeB,organizationId:orgB,name:'HTTP Node B'}]});
  seeded=true;
  const port=await availablePort();
  child=await startNext(port);
  const origin='http://127.0.0.1:'+port;
  async function request(path,cookieValue){
    const r=await fetch(origin+path,{redirect:'manual',headers:cookieValue?{cookie:cookieValue}:{}});
    return {status:r.status,body:await r.text()};
  }
  const own='/api/orgs/'+orgA+'/nodes/'+nodeA;

  await test('actual Next App Router HTTP refuses anonymous requests 401',async()=>{
    const r=await request(own);assert.equal(r.status,401);
  });
  await test('actual Next App Router HTTP refuses tampered JWE',async()=>{
    const r=await request(own,'next-auth.session-token=forged.payload');assert.equal(r.status,401);
  });
  await test('actual Next App Router HTTP allows preprovisioned ACTIVE member on own node',async()=>{
    const r=await request(own,await cookie(email));assert.equal(r.status,200,r.body.slice(0,150));
    assert.equal(JSON.parse(r.body).node.id,nodeA);
  });
  await test('actual Next App Router HTTP hides foreign org node 404',async()=>{
    const r=await request('/api/orgs/'+orgA+'/nodes/'+nodeB,await cookie(email));assert.equal(r.status,404);
  });
  await test('actual Next App Router HTTP rejects membership-less org 403',async()=>{
    const r=await request('/api/orgs/'+orgB+'/nodes/'+nodeB,await cookie(email));assert.equal(r.status,403);
  });
  await test('actual Next App Router HTTP rejects revoked membership on next request',async()=>{
    const c=await cookie(email);
    assert.equal((await request(own,c)).status,200);
    await db.organizationMembership.update({where:{userId_organizationId:{userId,organizationId:orgA}},data:{status:'REVOKED'}});
    assert.equal((await request(own,c)).status,403);
  });
  await test('guarded agents HTML does not expose data anonymously',async()=>{
    const r=await request('/agents');assert.ok([302,303,307,308,401,403,404].includes(r.status),r.status);
  });
  await test('guarded admin HTML does not expose data anonymously',async()=>{
    const r=await request('/admin');assert.ok([302,303,307,308,401,403,404].includes(r.status),r.status);
  });
}finally{
  if(child)await closeChild(child);
  if(seeded){
    await db.node.deleteMany({where:{organizationId:{in:[orgA,orgB]}}});
    await db.organizationMembership.deleteMany({where:{userId}});
    await db.user.deleteMany({where:{id:userId}});
    await db.organization.deleteMany({where:{id:{in:[orgA,orgB]}}});
  }
  await db.$disconnect();
}
