// Admin page and mutation authorization helper.
// Caller MUST supply verified email from NextAuth session.
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ID = /^[A-Za-z0-9_-]{1,100}$/;

const fail = (status, code) => Object.freeze({ ok: false, status, code });

export async function authorizeAdminAccess({ email, organizationId, db }) {
  if (typeof email !== 'string') return fail(401, 'UNAUTHENTICATED');
  const canonical = email.trim().toLowerCase();
  if (!EMAIL.test(canonical)) return fail(401, 'UNAUTHENTICATED');

  if (!db?.user?.findUnique || !db?.organizationMembership) {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }

  try {
    const user = await db.user.findUnique({
      where: { email: canonical },
      select: { id: true, email: true },
    });
    if (!user?.id) return fail(403, 'ADMIN_ACCESS_REQUIRED');

    // If an organizationId is specified, verify that the user has an ACTIVE ADMIN/OWNER role in that org.
    if (organizationId) {
      if (!ID.test(organizationId)) return fail(404, 'NOT_FOUND');

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
    }

    // If no organizationId is specified, verify if user has at least one ACTIVE ADMIN/OWNER membership anywhere.
    const activeAdminMembership = await db.organizationMembership.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        role: { in: ['ADMIN', 'OWNER'] },
      },
      select: { organizationId: true, role: true },
    });

    if (!activeAdminMembership) {
      return fail(403, 'ADMIN_ACCESS_REQUIRED');
    }

    return {
      ok: true,
      status: 200,
      code: 'AUTHORIZED',
      user,
      organizationId: activeAdminMembership.organizationId,
      role: activeAdminMembership.role,
    };
  } catch {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }
}

export async function authorizeAuditAccess({ email, organizationId, db }) {
  if (typeof email !== 'string') return fail(401, 'UNAUTHENTICATED');
  const canonical = email.trim().toLowerCase();
  if (!EMAIL.test(canonical)) return fail(401, 'UNAUTHENTICATED');
  if (!organizationId || !ID.test(organizationId)) return fail(400, 'ORGANIZATION_ID_REQUIRED');

  if (!db?.user?.findUnique || !db?.organizationMembership) {
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
