// Admin page and mutation authorization helper.
// Caller MUST supply verified email from NextAuth session and explicit organizationId.
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ID = /^[A-Za-z0-9_-]{1,100}$/;

const fail = (status, code) => Object.freeze({ ok: false, status, code });

export async function authorizeAdminAccess({ email, organizationId, db }) {
  if (typeof email !== 'string') return fail(401, 'UNAUTHENTICATED');
  const canonical = email.trim().toLowerCase();
  if (!EMAIL.test(canonical)) return fail(401, 'UNAUTHENTICATED');

  // Enforce explicit organizationId; no fallback to findFirst across other organizations
  if (!organizationId) return fail(400, 'ORGANIZATION_ID_REQUIRED');
  if (!ID.test(organizationId)) return fail(404, 'NOT_FOUND');

  if (!db?.user?.findUnique || !db?.organizationMembership?.findUnique) {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }

  try {
    const user = await db.user.findUnique({
      where: { email: canonical },
      select: { id: true, email: true },
    });
    if (!user?.id) return fail(403, 'ADMIN_ACCESS_REQUIRED');

    const membership = await db.organizationMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      select: { userId: true, organizationId: true, role: true, status: true },
    });

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      !['ADMIN', 'OWNER'].includes(membership.role)
    ) {
      return fail(403, 'ADMIN_ACCESS_REQUIRED');
    }

    return {
      ok: true,
      status: 200,
      code: 'AUTHORIZED',
      user,
      organizationId,
      role: membership.role,
    };
  } catch {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }
}

export async function authorizeAuditAccess({ email, organizationId, db }) {
  if (typeof email !== 'string') return fail(401, 'UNAUTHENTICATED');
  const canonical = email.trim().toLowerCase();
  if (!EMAIL.test(canonical)) return fail(401, 'UNAUTHENTICATED');
  if (!organizationId) return fail(400, 'ORGANIZATION_ID_REQUIRED');
  if (!ID.test(organizationId)) return fail(404, 'NOT_FOUND');

  if (!db?.user?.findUnique || !db?.organizationMembership?.findUnique) {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }

  try {
    const user = await db.user.findUnique({
      where: { email: canonical },
      select: { id: true, email: true },
    });
    if (!user?.id) return fail(403, 'AUDIT_ACCESS_REQUIRED');

    const membership = await db.organizationMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      select: { userId: true, organizationId: true, role: true, status: true },
    });

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      !['ADMIN', 'OWNER', 'OPERATOR'].includes(membership.role)
    ) {
      return fail(403, 'AUDIT_ACCESS_REQUIRED');
    }

    return {
      ok: true,
      status: 200,
      code: 'AUTHORIZED',
      user,
      organizationId,
      role: membership.role,
    };
  } catch {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }
}
