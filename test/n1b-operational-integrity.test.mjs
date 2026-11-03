import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function page(name) {
  return readFileSync(new URL('../src/app/' + name + '/page.tsx', import.meta.url), 'utf8');
}
test('Admin page must not claim OAuth verification before staging B3', () => {
  const s=page('admin');
  assert.match(s,/Google OAuth — NOT VERIFIED \(B3 pending\)/);
  assert.doesNotMatch(s,/Google Auth \(Verified\)/);
  assert.match(s,/NOT VERIFIED — actual provider credentials/);
  assert.doesNotMatch(s,/Configured \(GPT-4o\)|Configured \(R1 \/ V3\)/);
  assert.doesNotMatch(s,/>127\.0\.0\.1:8765</);
});
test('Audit DB failures cannot be presented as empty trails', () => {
  const s=page('audit');
  assert.match(s,/AUDIT_STORAGE_UNAVAILABLE/);
  assert.doesNotMatch(s,/catch\s*\([^)]*\)\s*\{\s*logs\s*=\s*\[\]/);
  assert.match(s,/where:\s*\{\s*organizationId:\s*targetOrgId\s*\}/);
  assert.match(s,/authorizeAuditAccess\(/);
});
