# N1-B / Orders 031-035 — staged security gate and release blockers

**Scope:** Sandbox only. The HTTP server in `sandbox/n1b/http-tenant-lab.mjs` is an ephemeral, synthetic authorization contract. It is not a deployed Next.js endpoint or the actual Prisma membership repository.

## Verified predecessors

- Order 030 Antigravity Windows 11 Node 24: independent QA of Draft PR #7 at `2cce1b3366516dadce37bd256b9485a58465b74a`; 20/20 tests; zero `npm audit --omit=dev --audit-level=low` alerts; sandbox G3B only.
- NextAuth/OIDC synthetic HTTP tests exercise actual NextAuth v4 handler using a custom mock issuer; they do not validate GoogleProvider on a real account or HTTPS.
- Draft PR #5 dependency lock remediation succeeded on Linux and Windows; 17 dev-tooling audit advisories (16 moderate, one low) remain.

## Order 031 — membership and RBAC integration contract

The Node HTTP lab authenticates using `next-auth/jwt.getToken` against a signed synthetic JWE. It sources organization membership from an **in-memory server map** and applies `resolveTenantPrincipal`, `authorizeTenantResource`, and `authorizeNestedResource`. Neither caller-supplied user-id headers nor role headers are trusted.

Before real App Router integration, design and implement:
- A single authenticated server-side principal resolver from verified NextAuth session/JWT, mapped to a stable user id after canonical identity lookup.
- A scoped Prisma query to `OrganizationMembership` with compound `userId + organizationId`; verify `status === ACTIVE` on **each** sensitive request.
- A tenant-safe repository layer that includes organizationId in every query and nested parent traversal; deny resource existence leaks.
- Explicit server authorization for GET/write mutations; revocation and role changes must take effect without relying on stale token claims.
- Synthetic disposable Postgres or equivalent ephemeral test DB and migration review before any real database migration.

## Order 032 — tenant isolation matrix

Run automated HTTP tests for 401 anonymous/forged JWE, 403 nonmember/revoked or insufficient role, 404 foreign resource and nested-parent mismatch, and authorized same-tenant reads/writes. Check token signature and issuer binding, session expiration, role downgrade and replay behavior. Note 403 vs 404 for nonmembers is a deliberate policy requiring threat review.

## Order 033 — 17 residual development advisories

Current audit evidence shows 0 production npm dependency advisories at check time. The remaining 16 moderate and one low warnings were traced to devDependencies. **Do not automatically accept or ignore them**: obtain an SBOM and exact `npm audit --json` advisory paths, assess build/CI threat surface, patch nonbreaking direct/transitive dependencies, and document any approved exception with expiration. No blind `npm audit fix --force`. Security advisories can change after this snapshot.

## Order 034 — independent Windows/Linux QA

A clean checkout must pass Node 22/24 matrix `npm ci`, N1-A/N1-B suites, OIDC HTTP, production npm audit all severities, total audit high+critical, Prisma validate/generate without a real database, and static Next build. The Antigravity independent Windows Node24 QA must check exact SHAs, all JWT/cookie/tenant assertions, no external hosts, and test isolation.

## Order 035 — gated integration decision

- PRs must remain Draft and stacked in documented order until each parent dependency is reviewed.
- No merge, deploy, real Google OAuth, persistent credential, live database/migration, Cloudflare/Vercel production changes, or G3-C.
- **Cannot mark Orders 031/032 'production completed' on passing synthetic HTTP contracts.** Need additional PRs connecting session+Prisma+real REST/API and disposable DB tests, followed by security approval.
- Release gate: G3B_APPROVED_SANDBOX_ONLY; G3C_NOT_AUTHORIZED.
