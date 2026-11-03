import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (route) => readFileSync(new URL('../src/app/' + route + '/page.tsx', import.meta.url), 'utf8');

test('Status page must never advertise unverified live health', () => {
  const page=read('status');
  assert.match(page,/NOT VERIFIED/);
  assert.match(page,/UNKNOWN/);
  assert.doesNotMatch(page,/status:\s*'(Online|Connected|Running)'/);
  assert.doesNotMatch(page,/Live System Architecture/);
});

for (const route of ['nodes','conversations','projects','dashboard']) {
  test(route + ' discloses that fixtures are DEMO and unverified', () => {
    const page=read(route);
    assert.match(page,/role="status"/);
    assert.match(page,/DEMO/);
    assert.match(page,/data-demo="true"/);
    if(route==='nodes'||route==='conversations'||route==='projects') {
      assert.doesNotMatch(page,/status:\s*'(Active|active|online-ready|lease-active|observed|standby|planned)'/);
    }
  });
}
