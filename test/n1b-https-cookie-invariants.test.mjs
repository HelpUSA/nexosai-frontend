// Sandbox HTTPS cookie invariant: self-signed ephemeral certificate only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:https';
import https from 'node:https';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const require=createRequire(import.meta.url);
const authModule=require('next-auth');
const NextAuth=authModule.default||authModule;
const gp=require('next-auth/providers/google');
const GoogleProvider=gp.default||gp;
const secret='n1b-https-lab-only-ephemeral-secret-do-not-use-for-any-account';
const dir=mkdtempSync(join(tmpdir(),'n1b-https-'));
const keyfile=join(dir,'lab-key.pem'),crtfile=join(dir,'lab-cert.pem');
let server;
try{
  execFileSync('openssl',['req','-x509','-nodes','-newkey','rsa:2048','-days','1',
    '-keyout',keyfile,'-out',crtfile,'-subj','/CN=localhost',
    '-addext','subjectAltName=IP:127.0.0.1'],{stdio:'ignore',timeout:10000});
  server=createServer({key:readFileSync(keyfile),cert:readFileSync(crtfile)},(req,res)=>{
    const u=new URL(req.url,'https://127.0.0.1');
    req.query={nextauth:u.pathname.split('/').filter(Boolean).slice(2)};
    req.cookies={};
    res.status=function(code){this.statusCode=code;return this;};
    res.json=function(data){this.setHeader('content-type','application/json');this.end(JSON.stringify(data));return this;};
    res.send=function(data){this.end(typeof data==='string'?data:JSON.stringify(data));return this;};
    Promise.resolve(NextAuth(req,res,{secret,session:{strategy:'jwt'},
      providers:[GoogleProvider({clientId:'lab-client',clientSecret:'lab-secret'})]}))
      .catch(()=>{if(!res.headersSent){res.writeHead(500);res.end();}});
  });
  await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).once('error',reject));
  const port=server.address().port;
  process.env.NEXTAUTH_URL='https://127.0.0.1:'+port;
  await test('HTTPS NextAuth csrf cookie has Secure, HttpOnly, SameSite=Lax and __Host prefix',async()=>{
    const res=await new Promise((resolve,reject)=>{
      https.get({hostname:'127.0.0.1',port,path:'/api/auth/csrf',rejectUnauthorized:false},
        r=>{const chunks=[];r.on('data',x=>chunks.push(x));r.on('end',()=>resolve({
          status:r.statusCode,body:Buffer.concat(chunks).toString('utf8'),cookies:r.headers['set-cookie']||[]
        }));}).on('error',reject);
    });
    assert.equal(res.status,200,res.body.slice(0,180));
    const csrf=res.cookies.find(c=>c.includes('csrf-token'));
    assert.ok(csrf,'CSRF cookie must exist');
    assert.match(csrf,/^__Host-/i);
    assert.match(csrf,/;\s*Secure/i);
    assert.match(csrf,/;\s*HttpOnly/i);
    assert.match(csrf,/;\s*SameSite=Lax/i);
    assert.match(csrf,/;\s*Path=\//i);
    assert.ok(JSON.parse(res.body).csrfToken);
  });
}finally{
  if(server?.listening)await new Promise(r=>server.close(r));
  rmSync(dir,{recursive:true,force:true});
}
