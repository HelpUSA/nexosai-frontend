import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

// Only runs against Next.js server on localhost, with synthetic environment and ephemeral DB.
if (process.env.G3C_EPHEMERAL_POSTGRES !== 'YES' ||
    !(process.env.DATABASE_URL || '').includes('@127.0.0.1:5432/nexosai_g3c_test')) {
  throw new Error('Real route smoke test requires ephemeral local Postgres only');
}
const port=3101;
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
 stdio:['ignore','pipe','pipe'],
 env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}
});
let stderr='';
child.stderr.on('data',chunk=>{stderr+=String(chunk).slice(0,250);});
try {
 let ready=false;
 for(let i=0;i<80;i++){
  if(child.exitCode!==null)break;
  try {const res=await fetch(origin+'/login',{signal:AbortSignal.timeout(1500)});if(res.status<500){ready=true;break;}} catch {}
  await sleep(400);
 }
 assert.equal(ready,true,`Next server could not start: ${stderr.slice(-500)}`);
 for(const route of [
  '/api/orgs/org-a/nodes/node-a',
  '/api/orgs/org-a/agents/agent-a',
  '/api/orgs/org-a/conversations/conv-a',
  '/api/orgs/org-a/conversations/conv-a/messages/msg-a'
 ]){
  const result=await fetch(origin+route,{redirect:'manual',signal:AbortSignal.timeout(5000)});
  assert.equal(result.status,401,`Expected unsigned request to ${route} to be rejected`);
  assert.match(result.headers.get('cache-control')||'',/no-store/i);
  const body=await result.json();
  assert.equal(body.error,'UNAUTHENTICATED');
  console.log('HTTP_UNAUTH_DENIED',route,result.status);
 }
}finally {
 child.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(2500)]);
 if(child.exitCode===null)child.kill('SIGKILL');
}
