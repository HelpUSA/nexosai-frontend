const roles = new Set(['ADMIN', 'OWNER', 'OPERATOR', 'VIEWER']);

export function resolveTenantPrincipal({ userId, selectedOrganizationId, membership }) {
  if (!userId) return Object.freeze({ ok:false, status:401, code:'UNAUTHENTICATED' });
  if (!selectedOrganizationId || !membership || membership.userId !== userId ||
      membership.organizationId !== selectedOrganizationId || membership.status !== 'ACTIVE' ||
      !roles.has(membership.role)) {
    return Object.freeze({ ok:false, status:403, code:'ORG_MEMBERSHIP_REQUIRED' });
  }
  return Object.freeze({ ok:true, userId, organizationId:membership.organizationId, role:membership.role });
}

export function authorizeTenantResource(principal, resource, allowedRoles=['ADMIN','OWNER','OPERATOR','VIEWER']) {
  if (!principal?.ok) return Object.freeze({ ok:false, status:principal?.status || 401, code:'UNAUTHENTICATED' });
  if (!allowedRoles.includes(principal.role)) return Object.freeze({ ok:false, status:403, code:'INSUFFICIENT_ROLE' });
  // Generic resource authorization, including nodes, agents, conversations and documents.
  if (!resource || resource.organizationId !== principal.organizationId) {
    return Object.freeze({ ok:false, status:404, code:'NOT_FOUND' });
  }
  return Object.freeze({ ok:true, resource });
}

export function authorizeNestedResource(principal, nested, parent, allowedRoles) {
  // Message belongs to Conversation; Embedding belongs to Document. Never trust nested IDs alone.
  if (!nested || !parent || nested.parentId !== parent.id) {
    return Object.freeze({ ok:false, status:404, code:'NOT_FOUND' });
  }
  return authorizeTenantResource(principal, parent, allowedRoles);
}
