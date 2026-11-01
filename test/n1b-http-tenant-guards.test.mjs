import test from 'node:test';
import assert from 'node:assert/strict';
import { encode } from 'next-auth/jwt';
import { listenLab, createLabData, SECRET } from '../sandbox/n1b/http-tenant-lab.mjs';

async function cookie(user,secret=SECRET){
  const value=await encode({secret,token:{sub:user,email:user+'@synthetic.invalid'},maxAge:300});
  return 'next-auth.session-token='+value;
}
async function request(base,path,{user,rawCookie,method='GET',headers={}}={}){
  const c=rawCookie||(user?await cookie(user):null);
  const res=await fetch(base+path,{method,headers:{...(c?{cookie:c}:{}),...headers}});
  return {status:res.status,body:await res.json()};
}
const A='/v1/orgs/org-a/nodes/node-a',B='/v1/orgs/org-b/nodes/node-b';
async function fixture(fn){
  const lab=await listenLab();
  try{await fn(lab);}finally{await lab.close();}
}

test('T9 anonymous API rejects request 401',()=>fixture(async({base})=>{
  assert.equal((await request(base,A)).status,401);
}));
test('T9 tampered JWE fails with 401',()=>fixture(async({base})=>{
  assert.equal((await request(base,A,{rawCookie:'next-auth.session-token=corrupted.token.value'})).status,401);
}));
test('T9 JWT signed by foreign key cannot authenticate',()=>fixture(async({base})=>{
  assert.equal((await request(base,A,{rawCookie:await cookie('user-a','foreign-test-only-secret-must-be-32-characters')})).status,401);
}));
test('T9 forged request user and role headers cannot replace signed identity',()=>fixture(async({base})=>{
  const result=await request(base,A,{headers:{'x-user-id':'admin-a','x-role':'OWNER','x-org-id':'org-a'}});
  assert.equal(result.status,401);
}));
test('T9 active viewer sees own organization node',()=>fixture(async({base})=>{
  assert.equal((await request(base,A,{user:'user-a'})).status,200);
}));
test('T9 active viewer cannot PATCH node 403',()=>fixture(async({base})=>{
  assert.equal((await request(base,A,{user:'user-a',method:'PATCH'})).status,403);
}));
test('T9 admin can PATCH own organization node',()=>fixture(async({base})=>{
  assert.equal((await request(base,A,{user:'admin-a',method:'PATCH'})).status,200);
}));
test('T9 member cannot select second tenant where membership suspended',()=>fixture(async({base})=>{
  assert.equal((await request(base,B,{user:'user-a'})).status,403);
}));
test('T9 unprovisioned organization denies token holder 403',()=>fixture(async({base})=>{
  assert.equal((await request(base,A,{user:'user-b'})).status,403);
}));
test('T9 cross-tenant resource path masquerading is hidden 404',()=>fixture(async({base})=>{
  assert.equal((await request(base,'/v1/orgs/org-a/nodes/node-b',{user:'admin-a'})).status,404);
}));
test('T9 nested foreign conversation path masquerading is hidden 404',()=>fixture(async({base})=>{
  assert.equal((await request(base,'/v1/orgs/org-a/conversations/conv-b/messages/msg-b',{user:'admin-a'})).status,404);
}));
test('T10 forged nested parent/message ID rejected 404',()=>fixture(async({base})=>{
  assert.equal((await request(base,'/v1/orgs/org-a/conversations/conv-a/messages/msg-mismatch',{user:'admin-a'})).status,404);
}));
test('T10 same-organization message read allowed',()=>fixture(async({base})=>{
  assert.equal((await request(base,'/v1/orgs/org-a/conversations/conv-a/messages/msg-a',{user:'user-a'})).status,200);
}));
test('T10 tenant viewer denied message PATCH',()=>fixture(async({base})=>{
  assert.equal((await request(base,'/v1/orgs/org-a/conversations/conv-a/messages/msg-a',{user:'user-a',method:'PATCH'})).status,403);
}));
test('T10 role revoked after token issuance fails at next request',()=>fixture(async({base,db})=>{
  const rawCookie=await cookie('admin-a');
  assert.equal((await request(base,A,{rawCookie,method:'PATCH'})).status,200);
  db.memberships.get('admin-a:org-a').status='REVOKED';
  assert.equal((await request(base,A,{rawCookie,method:'PATCH'})).status,403);
}));
test('T10 role downgraded after token issuance takes effect instantly',()=>fixture(async({base,db})=>{
  const rawCookie=await cookie('admin-a');
  assert.equal((await request(base,A,{rawCookie,method:'PATCH'})).status,200);
  db.memberships.get('admin-a:org-a').role='VIEWER';
  assert.equal((await request(base,A,{rawCookie,method:'PATCH'})).status,403);
  assert.equal((await request(base,A,{rawCookie})).status,200);
}));
test('T10 revoked membership cannot borrow role via headers or token claims',()=>fixture(async({base,db})=>{
  db.memberships.get('admin-a:org-a').status='REVOKED';
  assert.equal((await request(base,A,{user:'admin-a',method:'PATCH',headers:{'x-role':'OWNER','x-org-id':'org-a'}})).status,403);
}));
test('T10 other organization owner allowed own resource only',()=>fixture(async({base})=>{
  assert.equal((await request(base,B,{user:'user-b',method:'PATCH'})).status,200);
  assert.equal((await request(base,A,{user:'user-b',method:'PATCH'})).status,403);
}));
