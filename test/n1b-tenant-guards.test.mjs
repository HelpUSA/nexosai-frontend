import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTenantPrincipal, authorizeTenantResource, authorizeNestedResource } from '../sandbox/n1b/tenant-guards.mjs';

const orgA = 'org-a', orgB = 'org-b';
const member = { userId:'user-a', organizationId:orgA, role:'VIEWER', status:'ACTIVE' };
const principal = () => resolveTenantPrincipal({ userId:'user-a', selectedOrganizationId:orgA, membership:member });

test('anonymous request fails closed 401', () => assert.equal(resolveTenantPrincipal({selectedOrganizationId:orgA, membership:member}).status,401));
test('unprovisioned user fails 403', () => assert.equal(resolveTenantPrincipal({userId:'user-a',selectedOrganizationId:orgA}).status,403));
test('tenant selection cannot bypass membership 403', () => assert.equal(resolveTenantPrincipal({userId:'user-a',selectedOrganizationId:orgB,membership:member}).status,403));
test('revoked or suspended membership refused', () => {
  for (const status of ['REVOKED','SUSPENDED']) assert.equal(resolveTenantPrincipal({userId:'user-a',selectedOrganizationId:orgA,membership:{...member,status}}).status,403);
});
test('foreign user cannot borrow another user membership', () => assert.equal(resolveTenantPrincipal({userId:'user-b',selectedOrganizationId:orgA,membership:member}).status,403));
test('viewer cannot mutate admin resource', () => assert.equal(authorizeTenantResource(principal(),{id:'n1',organizationId:orgA},['ADMIN']).status,403));
test('same-tenant read authorized', () => assert.equal(authorizeTenantResource(principal(),{id:'n1',organizationId:orgA}).ok,true));
test('cross-tenant resource read returns 404', () => assert.equal(authorizeTenantResource(principal(),{id:'n2',organizationId:orgB}).status,404));
test('cross-tenant resource mutation returns 404', () => assert.equal(authorizeTenantResource({...principal(),role:'ADMIN'},{id:'n2',organizationId:orgB},['ADMIN']).status,404));
test('message nested in foreign conversation is denied', () => assert.equal(authorizeNestedResource(principal(),{id:'msg',parentId:'c2'},{id:'c2',organizationId:orgB}).status,404));
test('embedding nested in foreign document is denied', () => assert.equal(authorizeNestedResource(principal(),{id:'vec',parentId:'docB'},{id:'docB',organizationId:orgB}).status,404));
test('nested resource forged parent ID rejected', () => assert.equal(authorizeNestedResource(principal(),{id:'msg',parentId:'c2'},{id:'c1',organizationId:orgA}).status,404));
test('nested same-tenant access succeeds', () => assert.equal(authorizeNestedResource(principal(),{id:'msg',parentId:'c1'},{id:'c1',organizationId:orgA}).ok,true));
