import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg=JSON.parse(readFileSync(new URL('../package.json', import.meta.url),'utf8'));
const lock=JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url),'utf8'));

test('runtime auth pinned and root lock matches tested package versions',()=>{
  assert.equal(pkg.dependencies['next-auth'],'4.24.15');
  assert.equal(lock.packages['node_modules/next-auth'].version,'4.24.15');
  assert.equal(pkg.dependencies.next,'16.4.3');
  assert.equal(lock.packages['node_modules/next'].version,'16.4.3');
});
test('high/critical transitive remediation present in lock and manifest',()=>{
  for(const [name,expected] of Object.entries({'@auth/core':'0.41.3','deepmerge-ts':'8.0.2','zod':'4.6.7'}))
    assert.equal(lock.packages['node_modules/'+name]?.version,expected,name);
  assert.equal(pkg.overrides['@auth/core'],'0.41.3');
  assert.equal(pkg.overrides['deepmerge-ts'],'8.0.2');
});
test('do not accidentally declare synthetic integration tests as already passing',()=>{
  const doc=readFileSync(new URL('../docs/N1A-ORDER-028-RUNTIME-SECURITY-TEST-PLAN.md',import.meta.url),'utf8');
  assert.match(doc,/TEST PLAN ONLY/);
  assert.match(doc,/do not establish OAuth\/session security/i);
  assert.match(doc,/T1/);
  assert.match(doc,/T10/);
});
