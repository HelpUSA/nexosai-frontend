// Order 030 — Ephemeral localhost OpenID Connect harness, no Google/production accounts.
// Exercises real NextAuth v4 HTTP handlers with a disposable RSA-signed OIDC issuer.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateKeyPairSync, createSign, createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const nextAuthModule = require('next-auth');
const NextAuth = nextAuthModule.default || nextAuthModule;
const CSRF_PATH = '/api/auth/csrf';
const SECRET = 'synthetic-oidc-only-unsafe-for-deployment-2026-1234567890';
const ALLOWED = 'bootstrap@integration.invalid';
const OTHER = 'outsider@integration.invalid';

function b64(value) { return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url'); }
function createIdToken(privateKey, issuer, payload) {
  const header = b64({ alg:'RS256',typ:'JWT',kid:'lab-key' });
  const claims = b64({ iss:issuer, aud:'lab-client', sub:'lab-subject', email_verified:true,
    iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300,...payload });
  const data = header + '.' + claims;
  return data + '.' + createSign('RSA-SHA256').update(data).end().sign(privateKey).toString('base64url');
}
async function listen(server) {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return 'http://127.0.0.1:' + server.address().port;
}
async function shutdown(server) { if(server.listening) await new Promise(r=>server.close(r)); }
function send(res,status,body,headers={}) {
  res.writeHead(status,{ 'content-type':'application/json',...headers });
  res.end(typeof body==='string'?body:JSON.stringify(body));
}
function collectCookies(setCookie,jar){
  for(const raw of [].concat(setCookie||[])){
    const entry=raw.split(';')[0];const idx=entry.indexOf('=');
    if(idx>0) jar.set(entry.slice(0,idx),entry.slice(idx+1));
  }
}
async function runHttp(url,jar,opts={}) {
  const headers={...(opts.headers||{})};
  if(jar.size) headers.cookie=Array.from(jar,([k,v])=>k+'='+v).join('; ');
  const res=await fetch(url,{...opts,headers,redirect:'manual'});
  collectCookies(res.headers.getSetCookie(),jar);
  return res;
}
function assertCookieFlags(headers) {
  const cookies=headers.getSetCookie();
  assert.ok(cookies.length,'Set-Cookie present');
  for(const c of cookies){
    if(/(?:session-token|pkce|state|nonce)/i.test(c)){
      assert.match(c,/HttpOnly/i);
      assert.match(c,/SameSite=Lax/i);
    }
  }
}
async function newHarness() {
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk=publicKey.export({format:'jwk'});
  Object.assign(jwk,{kid:'lab-key',alg:'RS256',use:'sig'});
  const codes=new Map();
  const state={ email:ALLOWED,authCalls:0,tokenCalls:0,pkceOk:false,issuer:null,app:null };
  const issuerServer=http.createServer(async(req,res)=>{
    const u=new URL(req.url,state.issuer);
    if(u.pathname==='/.well-known/openid-configuration')
      return send(res,200,{issuer:state.issuer,authorization_endpoint:state.issuer+'/authorize',
        token_endpoint:state.issuer+'/token',userinfo_endpoint:state.issuer+'/userinfo',
        jwks_uri:state.issuer+'/jwks',response_types_supported:['code'],
        subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256'],
        token_endpoint_auth_methods_supported:['client_secret_post']});
    if(u.pathname==='/jwks')return send(res,200,{keys:[jwk]});
    if(u.pathname==='/userinfo')return send(res,200,{sub:'lab-subject',email:state.email,email_verified:true,name:'Synthetic User'});
    if(u.pathname==='/authorize'){
      state.authCalls++;
      assert.equal(u.searchParams.get('response_type'),'code');
      const challenge=u.searchParams.get('code_challenge');
      assert.ok(challenge,'PKCE challenge was sent');
      assert.equal(u.searchParams.get('code_challenge_method'),'S256');
      const code=randomBytes(16).toString('hex');
      codes.set(code,{nonce:u.searchParams.get('nonce'),challenge,used:false});
      const callback=new URL(u.searchParams.get('redirect_uri'));
      callback.searchParams.set('code',code);
      callback.searchParams.set('state',u.searchParams.get('state'));
      return send(res,302,'',{location:callback.toString()});
    }
    if(u.pathname==='/token'){
      state.tokenCalls++;
      const parts=[];for await(const chunk of req)parts.push(chunk);
      const p=new URLSearchParams(Buffer.concat(parts).toString('utf8'));
      const rec=codes.get(p.get('code'));
      if(!rec || rec.used)return send(res,400,{error:'invalid_grant'});
      const verifier=p.get('code_verifier');
      if(!verifier || createHash('sha256').update(verifier).digest('base64url')!==rec.challenge)
        return send(res,400,{error:'invalid_grant'});
      rec.used=true;state.pkceOk=true;
      return send(res,200,{access_token:'synthetic-access-token',token_type:'Bearer',expires_in:300,
        id_token:createIdToken(privateKey,state.issuer,{email:state.email,nonce:rec.nonce})});
    }
    send(res,404,{error:'not_found'});
  });
  state.issuer=await listen(issuerServer);
  const options={
    secret:SECRET,debug:false,
    session:{strategy:'jwt',maxAge:300},
    pages:undefined,
    providers:[{
      id:'laboidc',name:'Lab Synthetic OIDC',type:'oauth',idToken:true,
      wellKnown:state.issuer+'/.well-known/openid-configuration',
      authorization:{params:{scope:'openid email profile'}},
      checks:['pkce','state','nonce'],
      clientId:'lab-client',clientSecret:'lab-secret',
      client:{token_endpoint_auth_method:'client_secret_post'},
      profile(p){return {id:p.sub,name:p.name||'Synthetic User',email:p.email,image:null};}
    }],
    callbacks:{async signIn({user}){return Boolean(user.email && user.email.toLowerCase()===ALLOWED);}}
  };
  const appServer=http.createServer((req,res)=>{
    const parsed=new URL(req.url,'http://localhost');
    req.query=Object.fromEntries(parsed.searchParams);
    req.query.nextauth=parsed.pathname.split('/').filter(Boolean).slice(2);
    // NextAuth v4 API implementation, not a mock auth decision.
    Promise.resolve(NextAuth(req,res,options)).catch(e=>{
      console.error('SYNTHETIC_NEXTAUTH_HARNESS_ERROR',e?.name,e?.message);
      if(!res.headersSent)send(res,500,{error:'auth_handler_error'});
      else res.end();
    });
  });
  state.app=await listen(appServer);
  process.env.NEXTAUTH_URL=state.app;
  return {state,issuerServer,appServer,async close(){await Promise.all([shutdown(appServer),shutdown(issuerServer)]);}};
}
async function signIn(h,{tamperState=false}={}){
  const jar=new Map();
  const csrfResp=await runHttp(h.state.app+CSRF_PATH,jar);
  assert.equal(csrfResp.status,200);
  const {csrfToken}=await csrfResp.json();
  assert.ok(csrfToken);
  const params=new URLSearchParams({csrfToken,callbackUrl:h.state.app+'/protected',json:'true'});
  const initiate=await runHttp(h.state.app+'/api/auth/signin/laboidc',jar,{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:params
  });
  const result=await initiate.text();
  let authUrl=initiate.headers.get('location');
  if(!authUrl){
    try {authUrl=JSON.parse(result).url;}catch{}
  }
  assert.ok(authUrl && authUrl.startsWith(h.state.issuer+'/authorize'), 'Provider authorization URL: '+result.slice(0,180));
  assertCookieFlags(initiate.headers);
  const authorization=await fetch(authUrl,{redirect:'manual'});
  assert.equal(authorization.status,302);
  const callback=new URL(authorization.headers.get('location'));
  if(tamperState)callback.searchParams.set('state','forged-'+randomBytes(8).toString('hex'));
  const callbackResponse=await runHttp(callback.toString(),jar);
  return {jar,initiate,callbackResponse,callback,session:async()=> {
    const r=await runHttp(h.state.app+'/api/auth/session',jar);
    return {status:r.status,body:await r.json()};
  }};
}

test('T1 authorized OIDC authorization-code PKCE+nonce yields a NextAuth session',async()=>{
  const h=await newHarness();
  try{
    const login=await signIn(h);
    assert.ok([200,302].includes(login.callbackResponse.status));
    assert.equal(h.state.pkceOk,true,'real code verifier validated by synthetic issuer');
    const s=await login.session();
    assert.equal(s.status,200);
    assert.equal(s.body.user?.email,ALLOWED);
    assert.ok([...login.jar.keys()].some(k=>k.includes('session-token')));
  }finally{await h.close();}
});
test('T2 unauthorized OIDC profile is rejected by NextAuth callback',async()=>{
  const h=await newHarness();h.state.email=OTHER;
  try{
    const login=await signIn(h);
    const s=await login.session();
    assert.equal(s.body.user,undefined);
  }finally{await h.close();}
});
test('T3 forged OAuth state is rejected before token exchange',async()=>{
  const h=await newHarness();
  try{
    const login=await signIn(h,{tamperState:true});
    assert.equal(h.state.tokenCalls,0);
    const s=await login.session();
    assert.equal(s.body.user,undefined);
  }finally{await h.close();}
});
test('T5 corrupted session token does not authenticate; malformed Bearer does not crash handler',async()=>{
  const h=await newHarness();
  try{
    const jar=new Map([['next-auth.session-token','invalid-jwe-payload']]);
    const r=await runHttp(h.state.app+'/api/auth/session',jar,{
      headers:{authorization:'Bearer invalid.invalid.invalid'}
    });
    assert.equal(r.status,200);
    const body=await r.json();
    assert.equal(body.user,undefined);
  }finally{await h.close();}
});
