import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

// This smoke test verifies the real App Router authentication endpoint never
// defaults to an open login when credentials are absent. No external hosts.
if (process.env.G3C_EPHEMERAL_POSTGRES !== 'YES' ||
    !/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost)(?::\d+)?\/nexosai_g3c_test$/.test(process.env.DATABASE_URL || '')) {
  throw new Error('Refusing to run unless disposable local PostgreSQL is configured');
}

const port=3102;
const host=`http://127.0.0.1:${port}`;
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
for (const key of ['AUTH_SECRET','NEXTAUTH_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','NEXOSAI_BOOTSTRAP_ADMIN_EMAIL']) {
  delete env[key];
}
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
  env,stdio:['ignore','pipe','pipe']
});
let errorText='';
child.stderr.on('data',b=>{errorText=(errorText+String(b)).slice(-1000)});
try {
  let ready=false;
  for(let n=0;n<80;n++){
    if(child.exitCode!==null)break;
    try {
      const response=await fetch(host+'/login',{signal:AbortSignal.timeout(1500)});
      if(response.status<500){ready=true;break;}
    }catch{}
    await sleep(400);
  }
  assert.equal(ready,true,`Next.js startup failed: ${errorText}`);
  for(const [method,path] of [['GET','/api/auth/session'],['GET','/api/auth/providers'],['POST','/api/auth/signin/google']]){
    const res=await fetch(host+path,{method,redirect:'manual',signal:AbortSignal.timeout(5000)});
    assert.equal(res.status,503,`Authentication route ${method} ${path} must fail closed without secrets`);
    assert.match(res.headers.get('cache-control')||'',/no-store/i);
    const data=await res.json();
    assert.equal(data.error,'AUTHENTICATION_UNAVAILABLE');
    console.log('AUTH_ROUTE_FAIL_CLOSED',method,path,res.status);
  }
}finally{
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(2500)]);
  if(child.exitCode===null)child.kill('SIGKILL');
}
