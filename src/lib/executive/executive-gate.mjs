// F1A Executive Gate: Quadruple Feature Flag (Fail-Closed OFF by default),
// Tenant RBAC (N1-B), Personal Vault / Non-F1A Connector Prohibition,
// and Transactional Tenant GUC (SET LOCAL) for PostgreSQL FORCE RLS.

const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const ID = /^[A-Za-z0-9_-]{1,100}$/;

export const ALLOWED_F1A_SIGNAL_SOURCES = Object.freeze([
  'MANUAL',
  'GITHUB',
  'VERCEL',
  'INTERNAL_AUDIT',
]);

export const PROHIBITED_F1A_SIGNAL_SOURCES = Object.freeze([
  'GMAIL',
  'GOOGLE_CALENDAR',
  'LINEAR',
  'STRIPE',
  'WEBHOOK',
]);

export const EXECUTIVE_QUOTAS = Object.freeze({
  MAX_SIGNALS_PER_ORG_HOUR: 120,
  MAX_ACTIVE_SIGNALS_PER_ORG: 10000,
  MAX_OPEN_WORK_ITEMS_PER_ORG: 2000,
});

const fail = (status, code, details = undefined) =>
  Object.freeze(details ? { ok: false, status, code, details } : { ok: false, status, code });

export function isExecutiveGlobalEnabled(env = process.env) {
  return String(env?.NEXOSAI_EXECUTIVE_ENABLED || '').trim().toLowerCase() === 'true';
}

export function assertF1AScopeAllowed({
  privacyScope = 'ORG_SHARED',
  category = 'DEVELOPMENT',
  sourceType = undefined,
  portfolioType = 'APPLICATION',
} = {}) {
  if (privacyScope === 'PERSONAL_VAULT') {
    return fail(403, 'PERSONAL_VAULT_NOT_ENABLED_IN_F1');
  }
  if (!['ORG_SHARED', 'EXECUTIVE_ONLY'].includes(privacyScope)) {
    return fail(400, 'INVALID_PRIVACY_SCOPE');
  }
  if (category === 'PERSONAL' || portfolioType === 'PERSONAL_DOMAIN') {
    return fail(403, 'PERSONAL_DATA_PROHIBITED_IN_F1A');
  }
  if (sourceType !== undefined && !ALLOWED_F1A_SIGNAL_SOURCES.includes(sourceType)) {
    return fail(403, 'CONNECTOR_NOT_ENABLED_IN_F1A');
  }
  return Object.freeze({ ok: true, status: 200, code: 'F1A_SCOPE_ALLOWED' });
}

export async function withExecutiveTenantContext(db, organizationId, callback) {
  if (typeof organizationId !== 'string' || !ID.test(organizationId)) {
    throw new Error('INVALID_TENANT_CONTEXT_ID');
  }
  if (typeof db?.$transaction === 'function') {
    return db.$transaction(async (tx) => {
      if (typeof tx?.$executeRawUnsafe === 'function') {
        await tx.$executeRawUnsafe('SET LOCAL ROLE nexosai_rls_tenant_enforced');
      }
      if (typeof tx?.$executeRaw === 'function') {
        await tx.$executeRaw`SELECT set_config('app.current_organization_id', ${organizationId}, true)`;
      }
      return callback(tx);
    });
  }
  return callback(db);
}

export async function authorizeExecutiveAccess({
  email,
  organizationId,
  portfolioItemId = undefined,
  requiredRoles = ['OWNER', 'ADMIN'],
  db,
  env = process.env,
}) {
  if (typeof email !== 'string') return fail(401, 'UNAUTHENTICATED');
  const canonicalEmail = email.trim().toLowerCase();
  if (!EMAIL.test(canonicalEmail)) return fail(401, 'UNAUTHENTICATED');

  if (organizationId === undefined || organizationId === null || organizationId === '') {
    return fail(400, 'ORG_ID_REQUIRED');
  }
  if (typeof organizationId !== 'string' || !ID.test(organizationId)) {
    return fail(404, 'NOT_FOUND');
  }
  if (portfolioItemId !== undefined && portfolioItemId !== null && !ID.test(String(portfolioItemId))) {
    return fail(404, 'NOT_FOUND');
  }

  // Gate 1: Global kill-switch / feature flag (OFF by default)
  if (!isExecutiveGlobalEnabled(env)) {
    return fail(403, 'EXECUTIVE_MODULE_DISABLED');
  }

  if (
    !db?.user?.findUnique ||
    !db?.organizationMembership?.findUnique ||
    !db?.organization?.findUnique
  ) {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }

  try {
    const user = await db.user.findUnique({
      where: { email: canonicalEmail },
      select: { id: true, email: true, role: true },
    });
    if (!user?.id) return fail(403, 'ORG_MEMBERSHIP_REQUIRED');

    const membership = await db.organizationMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      select: { userId: true, organizationId: true, role: true, status: true },
    });
    if (
      !membership ||
      membership.userId !== user.id ||
      membership.organizationId !== organizationId ||
      membership.status !== 'ACTIVE'
    ) {
      return fail(403, 'ORG_MEMBERSHIP_REQUIRED');
    }

    // Gate 4: Explicit role check (OWNER or ADMIN for executive operations)
    if (!requiredRoles.includes(membership.role)) {
      return fail(403, 'ROLE_FORBIDDEN');
    }

    // Gate 2: Organization-level feature flag (org.features.executiveProactiveGm === true)
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, features: true },
    });
    if (!organization || organization.id !== organizationId) {
      return fail(404, 'NOT_FOUND');
    }
    const orgFeatures =
      organization.features && typeof organization.features === 'object'
        ? organization.features
        : {};
    if (orgFeatures.executiveProactiveGm !== true) {
      return fail(403, 'EXECUTIVE_ORG_FEATURE_DISABLED');
    }

    // Gate 3: Optional PortfolioItem-level proactive check
    let portfolioItem = null;
    if (portfolioItemId) {
      portfolioItem = await withExecutiveTenantContext(db, organizationId, async (tx) => {
        if (!tx?.portfolioItem?.findFirst) return null;
        return tx.portfolioItem.findFirst({
          where: { id: portfolioItemId, organizationId },
          select: {
            id: true,
            organizationId: true,
            slug: true,
            name: true,
            type: true,
            lifecycle: true,
            privacyScope: true,
            isProactiveEnabled: true,
            priorityWeight: true,
            staleAfterDays: true,
            lastActivityAt: true,
          },
        });
      });
      if (!portfolioItem || portfolioItem.organizationId !== organizationId) {
        return fail(404, 'PORTFOLIO_ITEM_NOT_FOUND');
      }
      if (portfolioItem.privacyScope === 'PERSONAL_VAULT') {
        return fail(403, 'PERSONAL_VAULT_NOT_ENABLED_IN_F1');
      }
      if (portfolioItem.isProactiveEnabled === false) {
        return fail(403, 'PORTFOLIO_PROACTIVE_DISABLED');
      }
    }

    return Object.freeze({
      ok: true,
      status: 200,
      code: 'AUTHORIZED',
      userId: user.id,
      email: canonicalEmail,
      organizationId,
      role: membership.role,
      organization,
      portfolioItem,
    });
  } catch {
    return fail(503, 'AUTHZ_STORAGE_UNAVAILABLE');
  }
}
