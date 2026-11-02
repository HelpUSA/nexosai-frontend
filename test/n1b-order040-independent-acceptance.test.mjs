import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authorizeAdminAccess, authorizeAuditAccess } from '../src/lib/admin-access.mjs';

// Independent G3C acceptance gates, added without touching Antigravity's PR #18.
const counts={users:0,memberships:0};
const db={
  user:{findUnique:async ({where})=>{counts.users++;return where.email==='owner@example.invalid'?{id:'u-owner',email:where.email}:null;}},
  organizationMembership:{
    findUnique:async ({where})=>{
      counts.memberships++;
      const {userId,organizationId}=where.userId_organizationId;
      return userId==='u-owner'&&organizationId==='org-a'
        ? {userId,organizationId,role:'OWNER',status:'ACTIVE'} : null;
    },
    findFirst:async ()=>{counts.memberships++;return {organizationId:'org-a',role:'OWNER',status:'ACTIVE'};}
  }
};

test('G3C: admin requires explicitly bound organizationId',async()=>{
  const before={...counts};
  const res=await authorizeAdminAccess({email:'owner@example.invalid',db});
  assert.equal(res.ok,false,'No implicit organization selection even if a user is admin somewhere');
  assert.ok(res.status===400||res.status===404,'Missing tenant context must be a client error');
  assert.equal(counts.memberships,before.memberships,'Must fail before resolving an arbitrary membership');
});

test('G3C: malformed organizationId cannot select another organization',async()=>{
  const res=await authorizeAdminAccess({email:'owner@example.invalid',organizationId:'../../org-a',db});
  assert.equal(res.ok,false);
  assert.equal(res.status,404);
});

test('G3C: membership must match requested org, no cross-tenant fallback',async()=>{
  const res=await authorizeAdminAccess({email:'owner@example.invalid',organizationId:'org-b',db});
  assert.equal(res.ok,false);
  assert.equal(res.status,403);
});

test('G3C: explicit authorized admin still succeeds',async()=>{
  const res=await authorizeAdminAccess({email:'owner@example.invalid',organizationId:'org-a',db});
  assert.equal(res.ok,true);
  assert.equal(res.organizationId,'org-a');
});

test('G3C: audit access also requires explicit tenant',async()=>{
  const res=await authorizeAuditAccess({email:'owner@example.invalid',db});
  assert.equal(res.ok,false);
  assert.equal(res.status,400);
});

test('G3C: migration CI must not swallow status failures and must deploy migrations',()=>{
  const ci=readFileSync(new URL('../.github/workflows/n1b-postgres-integration-ci.yml',import.meta.url),'utf8');
  assert.doesNotMatch(ci,/prisma\s+migrate\s+status[^\n]*\|\|\s*true/,'No swallowed migration-status failures');
  assert.match(ci,/prisma\s+migrate\s+deploy/,'CI must actually execute versioned migration deploy');
});

test('G3C: authenticated PostgreSQL suite must guard against silent skip',()=>{
  const suite=readFileSync(new URL('./n1b-next-http-auth.integration.test.mjs',import.meta.url),'utf8');
  assert.match(suite,/G3C_EPHEMERAL_POSTGRES/,'Ephemeral marker required');
  assert.doesNotMatch(suite,/if\s*\(canConnect\)\s*\{/,'DB connection failure must not silently skip critical suite');
  assert.doesNotMatch(suite,/DATABASE_URL:\s*process\.env\.DATABASE_URL\s*\|\|/,'No fallback DB URL');
});
