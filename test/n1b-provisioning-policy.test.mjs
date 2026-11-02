import test from 'node:test';
import assert from 'node:assert/strict';
import { provisionSuspendedMembership } from '../src/lib/membership-provision.mjs';
function mockDb({exists=true,previous}={}){
  const calls=[];
  const tx={
    organization:{findUnique:async p=>(calls.push(['org',p]),exists?{id:'orgA'}:null)},
    user:{upsert:async p=>(calls.push(['user',p]),{id:'userA'})},
    organizationMembership:{upsert:async p=>(calls.push(['member',p]),previous||p.create)}
  };
  return {calls,db:{$transaction:async cb=>cb(tx)}};
}
test('rejects unverified/malformed identities without database access',async()=>{
 const f=mockDb();
 assert.equal((await provisionSuspendedMembership({verifiedEmail:null,organizationId:'orgA',db:f.db})).ok,false);
 assert.equal((await provisionSuspendedMembership({verifiedEmail:'bad',organizationId:'orgA',db:f.db})).ok,false);
 assert.equal((await provisionSuspendedMembership({verifiedEmail:'a@example.test',organizationId:'../evil',db:f.db})).ok,false);
 assert.equal(f.calls.length,0);
});
test('checks organization before creating identity',async()=>{
 const f=mockDb({exists:false});
 const result=await provisionSuspendedMembership({verifiedEmail:'a@example.test',organizationId:'orgA',db:f.db});
 assert.equal(result.code,'ORG_NOT_FOUND');assert.equal(f.calls.length,1);
});
test('creates only suspended VIEWER and does not update existing privilege state',async()=>{
 const f=mockDb({previous:{userId:'userA',organizationId:'orgA',role:'VIEWER',status:'REVOKED'}});
 const result=await provisionSuspendedMembership({verifiedEmail:'UPPER@EXAMPLE.TEST',organizationId:'orgA',db:f.db});
 assert.equal(result.membership.status,'REVOKED');
 assert.deepEqual(f.calls[1][1].where,{email:'upper@example.test'});
 assert.deepEqual(f.calls[2][1].create,{userId:'userA',organizationId:'orgA',role:'VIEWER',status:'SUSPENDED'});
 assert.deepEqual(f.calls[2][1].update,{});
});
test('storage exceptions cannot grant membership',async()=>{
 const r=await provisionSuspendedMembership({verifiedEmail:'a@example.test',organizationId:'orgA',db:{$transaction:async()=>{throw Error('db down')}}});
 assert.deepEqual(r,{ok:false,code:'STORAGE_UNAVAILABLE'});
});
