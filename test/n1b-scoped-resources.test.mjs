import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeScopedRead } from '../src/lib/tenant-resource-access.mjs';
const mk=(role='VIEWER',status='ACTIVE')=>{
 const trace=[];
 const db={
  user:{findUnique:async x=>(trace.push(['user',x]),{id:'u1'})},
  organizationMembership:{findUnique:async x=>(trace.push(['member',x]),{userId:'u1',organizationId:'org-a',role,status})},
  agent:{findFirst:async x=>(trace.push(['agent',x]),{id:'agent-a',organizationId:'org-a',name:'safe',model:'GPT4O',isActive:true})},
  conversation:{findFirst:async x=>(trace.push(['conversation',x]),{id:'conv-a',organizationId:'org-a',title:'safe',channel:'WEBCHAT',status:'ACTIVE'})},
  message:{findFirst:async x=>(trace.push(['message',x]),{id:'msg-a',conversationId:'conv-a',role:'USER',content:'hello',createdAt:new Date()})}
 };return {db,trace};
};
const q=(f,kind,over={})=>authorizeScopedRead({email:'A@EXAMPLE.TEST',organizationId:'org-a',resourceId:kind==='agent'?'agent-a':kind==='message'?'msg-a':'conv-a',conversationId:'conv-a',kind,db:f.db,...over});
test('incomplete or invalid request denies without DB',async()=>{
 const f=mk();
 assert.equal((await q(f,'message',{conversationId:'../x'})).status,404);
 assert.equal((await q(f,'agent',{email:null})).status,401);
 assert.equal(f.trace.length,0);
});
test('findFirst queries bind tenant scope for Agent, Conversation and parent-scoped Message',async()=>{
 for(const kind of ['agent','conversation','message']){
  const f=mk(kind==='message'?'OPERATOR':'VIEWER');
  const r=await q(f,kind);assert.equal(r.status,200);
  const find=f.trace[2][1];
  if(kind==='message')assert.deepEqual(find.where,{id:'msg-a',conversationId:'conv-a',conversation:{organizationId:'org-a'}});
  else assert.equal(find.where.organizationId,'org-a');
  assert.equal('systemPrompt' in find.select,false);
 }
});
test('VIEWER cannot read messages and revoked membership denies before resource lookup',async()=>{
 const f=mk('VIEWER');assert.equal((await q(f,'message')).status,403);assert.equal(f.trace.length,2);
 const r=mk('OPERATOR','REVOKED');assert.equal((await q(r,'message')).status,403);assert.equal(r.trace.length,2);
});
test('query errors fail closed',async()=>{
 const f=mk();f.db.agent.findFirst=async()=>{throw Error('down')};
 assert.equal((await q(f,'agent')).status,503);
});
