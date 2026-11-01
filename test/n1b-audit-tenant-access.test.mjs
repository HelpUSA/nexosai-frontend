import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listTenantAuditLogs} from '../src/lib/audit-access.mjs';

test('admin audit query must include organizationId and allowlisted data only',async()=>{
  let received;const db={auditLog:{async findMany(q){received=q;return []}}};
  assert.deepEqual(await listTenantAuditLogs({organizationId:'org-a',db}),[]);
  assert.deepEqual(received.where,{organizationId:'org-a'});
  assert.ok(received.take<=15);
  assert.equal(received.select.id,true);
  assert.equal(received.select.details,true);
  assert.deepEqual(received.select.user,{select:{email:true}});
  assert.deepEqual(received.select.node,{select:{name:true}});
  assert.equal(Object.hasOwn(received,'include'),false);
});
test('no organization or invalid identifier returns no records without querying',async()=>{
  let called=false;const db={auditLog:{findMany(){called=true;return []}}};
  for(const organizationId of ['',null,'../org-b','org a'])
    assert.deepEqual(await listTenantAuditLogs({organizationId,db}),[]);
  assert.equal(called,false);
});
test('database unavailable causes fail-closed, no synthetic fallback',async()=>{
  await assert.rejects(listTenantAuditLogs({organizationId:'org-a',db:{auditLog:{findMany(){throw Error('DB OFFLINE');}}}}),/STORAGE_UNAVAILABLE/);
  await assert.rejects(listTenantAuditLogs({organizationId:'org-a',db:{}}),/STORAGE_UNAVAILABLE/);
});
test('actual sensitive audit UI requires admin/owner membership and refuses unscoped Prisma findMany',()=>{
  const file=readFileSync(new URL('../src/app/audit/page.tsx',import.meta.url),'utf8');
  const layout=readFileSync(new URL('../src/app/audit/layout.tsx',import.meta.url),'utf8');
  assert.match(file,/requireActiveTenant\(\['ADMIN','OWNER'\]\)/);
  assert.match(layout,/requireActiveTenant\(\['ADMIN','OWNER'\]\)/);
  assert.match(file,/listTenantAuditLogs\(\{organizationId,db\}\)/);
  assert.doesNotMatch(file,/db\.auditLog\.findMany/);
});
