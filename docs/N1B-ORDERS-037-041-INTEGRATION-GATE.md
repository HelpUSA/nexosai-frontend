# N1-B Security Integration Candidate — Orders 037–041

This is a **Draft-only sandbox integration candidate**, not an authorization to merge or deploy. Its parent is Draft PR #14. It brings in the patched Babel `@babel/core@7.29.7` package manifest/lockfile from separate Draft PR #12, without merging either PR. This consolidates all changes for independent Windows and Linux QA.

## Security invariants tested

- NextAuth v4 OAuth and GoogleProvider against ephemeral synthetic OIDC only; RSA/JWKS, PKCE S256, state, callback replay and invalid audience/email.
- HTTPS cookie flags with self-signed ephemeral localhost TLS, not public production HTTPS or real Google credentials.
- Verified Google email matching and active **preprovisioned** OrganizationMembership. No callback-driven registration or automatic administrative elevation.
- Fail-closed tenant-selected App Router API and active-membership server page layouts; JWT/JWE tampering, 401/403/404, revocation and role downgrades.
- Actual Next 16 server HTTP with signed synthetic NextAuth cookie and ephemeral PostgreSQL service, validated through Prisma queries.
- Organization-scoped Agents page (no systemPrompt exposure, no unscoped fallbacks), ADMIN/OWNER-scoped audit page (no global/foreign logs) and sensitive route guards.
- Babel source-map advisory patched via committed `7.29.7`; no lockfile self-writing CI survives in this integration branch.
- No known npm production dependency advisories at test time; any high/critical advisory blocks CI.

## Unresolved blockers — cannot truthfully mark production ready

1. 16 moderate npm dev-tooling advisories in ESLint/minimatch remain, without automatic exception. A forced minimatch 11 override on ESLint 9 may break API compatibility; upgrade/downgrade requires its own tested plan.
2. Preprovisioning of the *real* initial admin and production organization requires explicit approval, migration, audited organizational identity proof, and no reactivation of revoked accounts. The helper is intentionally impossible to run except against local disposable `n1b_lab`.
3. A real Google authentication against a Google account, public TLS chain/cookies, domain policy and Google key rotation remain outside sandbox authorization.
4. Organization selection, authorization for future **write** endpoints, cross-service RBAC and live mesh integration are not complete. All new endpoints must guard data access server-side.
5. This branch is one candidate and does not resolve/merge its ancestor PRs or independent sibling PR #12; a formal branch and migration decision is necessary.
6. Independent Antigravity Windows 11 QA on this exact HEAD, institutional release gate, and explicit G3-C permission are mandatory before production.

Governance: **G3B_APPROVED_SANDBOX_ONLY / G3C_NOT_AUTHORIZED**. All PRs Draft. No production DB migrations, no real secrets, no deploy, no merge.
