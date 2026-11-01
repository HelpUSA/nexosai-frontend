import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeNodeRead } from '../src/lib/tenant-access.mjs';

function fakeDb({member='ACTIVE',role='VIEWER',nodeOrg='org-a',userFound=true,missingNode=false,storageError=false}={}){
  const calls=[];
  const db={
    user:{async findUnique(q){calls.push(['user',q]);if(storageError)throw Error('synthetic database unavailable');return userFound?{id:'user-a'}:null;}},
    organizationMembership:{async findUnique(q){calls.push(['membership',q]);return member?{userId:'user-a',organizationId:'org-a',role,status:member}:null;}},
    node:{async findFirst(q){calls.push(['node',q]);return missingNode?null:{id:'node-a',organizationId:nodeOrg,name:'Synthetic A',type:'LIGHT',status:'OFFLINE',lastSeenAt:null};}}
  };
  return {db,calls};
}
const query=(db,overrides={})=>authorizeNodeRead({db,email:'BOOTSTRAP@LAB.INVALID',organizationId:'org-a',nodeId:'node-a',...overrides});

test('no signed session identity always fails closed 401',async()=>{
  const f=fakeDb();assert.equal((await query(f.db,{email:null})).status,401);
  assert.equal(f.calls.length,0);
});
test('Unicode homoglyph email is denied before querying database',async()=>{
  const f=fakeDb();assert.equal((await query(f.db,{email:'bootstrap＠lab.invalid'})).status,401);
  assert.equal(f.calls.length,0);
});
test('forged organization or node identifier rejected',async()=>{
  const f=fakeDb();assert.equal((await query(f.db,{organizationId:'../../org-b'})).status,404);
  assert.equal(f.calls.length,0);
});
test('no registered user membership is forbidden 403',async()=>{
  const f=fakeDb({userFound:false});assert.equal((await query(f.db)).status,403);
  assert.equal(f.calls.filter(x=>x[0]==='node').length,0);
});
test('no membership, suspended and revoked all deny 403',async()=>{
  for(const member of [null,'SUSPENDED','REVOKED']){
    const f=fakeDb({member});assert.equal((await query(f.db)).status,403,member);
    assert.equal(f.calls.filter(x=>x[0]==='node').length,0);
  }
});
test('unsupported membership role denied 403',async()=>{
  const f=fakeDb({role:'SUPERUSER'});assert.equal((await query(f.db)).status,403);
});
test('different tenant node hidden 404 even when membership active',async()=>{
  const f=fakeDb({nodeOrg:'org-b'});assert.equal((await query(f.db)).status,404);
});
test('missing resource hidden 404',async()=>{
  const f=fakeDb({missingNode:true});assert.equal((await query(f.db)).status,404);
});
test('valid server-side membership returns only allowlisted fields',async()=>{
  const f=fakeDb();const r=await query(f.db);assert.equal(r.status,200);
  assert.equal(r.node.id,'node-a');assert.equal(r.node.name,'Synthetic A');
  assert.deepEqual(Object.keys(r.node).sort(),['id','lastSeenAt','name','organizationId','status','type']);
});
test('membership lookup uses compound identity and node query scopes both id and org',async()=>{
  const f=fakeDb();await query(f.db);
  assert.deepEqual(f.calls[0][1],{where:{email:'bootstrap@lab.invalid'},select:{id:true}});
  assert.deepEqual(f.calls[1][1].where,{userId_organizationId:{userId:'user-a',organizationId:'org-a'}});
  assert.deepEqual(f.calls[2][1].where,{id:'node-a',organizationId:'org-a'});
});
test('storage outage cannot downgrade failure to allowed',async()=>{
  const f=fakeDb({storageError:true});assert.equal((await query(f.db)).status,503);
});
test('missing DB API never authorizes a request',async()=>{
  assert.equal((await query({})).status,503);
});
