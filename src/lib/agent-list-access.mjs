// Server-side authorization helper for the Agents listing, never client-trusted.
// An explicit tenant is mandatory: NEVER pick the first active membership.
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ID = /^[A-Za-z0-9_-]{1,100}$/;

function deny(status, code) {
  return Object.freeze({ ok: false, status, code });
}

export async function authorizeAgentList({ email, organizationId, db }) {
  if (typeof email !== 'string' || !EMAIL.test(email.trim().toLowerCase())) {
    return deny(401, 'UNAUTHENTICATED');
  }
  if (!organizationId) return deny(400, 'ORGANIZATION_ID_REQUIRED');
  if (typeof organizationId !== 'string' || !ID.test(organizationId)) {
    return deny(404, 'NOT_FOUND');
  }
  if (!db?.user?.findUnique || !db?.organizationMembership?.findUnique) {
    return deny(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }
  try {
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    if (!user?.id) return deny(403, 'TENANT_ACCESS_REQUIRED');
    const membership = await db.organizationMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      select: { organizationId: true, status: true, role: true },
    });
    if (
      !membership || membership.status !== 'ACTIVE' ||
      !['VIEWER', 'OPERATOR', 'ADMIN', 'OWNER'].includes(membership.role)
    ) {
      return deny(403, 'TENANT_ACCESS_REQUIRED');
    }
    return { ok: true, status: 200, organizationId, role: membership.role };
  } catch {
    return deny(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }
}

// The only allowed fields for the page: systemPrompt, credentials and tenant metadata
// must never be read by the server component, even if hidden from JSX.
export const AGENT_PUBLIC_LIST_SELECT = Object.freeze({
  id: true,
  name: true,
  description: true,
  model: true,
  isActive: true,
  temperature: true,
});
export function agentListQuery(organizationId) {
  if (typeof organizationId !== 'string' || !ID.test(organizationId)) {
    throw new Error('INVALID_ORGANIZATION_ID');
  }
  return {
    where: { organizationId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: AGENT_PUBLIC_LIST_SELECT,
  };
}
