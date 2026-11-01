# Order 039 — Verified Google admission and controlled bootstrap (Draft only)

## Security decision

The previous NextAuth v4 sign-in callback accepted the configured bootstrap email only. This was not sufficient to authorize a user in any organization, and automatically creating an ADMIN on first authentication could re-elevate a revoked identity.

In this Draft branch, the Google sign-in callback checks:
- Provider exactly `google`; `profile.email_verified === true` as a boolean.
- `user.email` and `profile.email` match after strict ASCII lowercasing; rejects malformed/homograph addresses.
- A database `User` already exists, and `OrganizationMembership` contains at least one `ACTIVE` association.
- Any database failure denies sign-in; no token claim or request header supplies a role or organization.

**This is NOT a live Google OAuth verification.** It is a patched Draft callback with unit tests and Next.js build checks. Subsequent sensitive API requests must independently check membership and scope data access by organization ID.

## Provisioning gate

The helper `sandbox/n1b/controlled-bootstrap.mjs` is **lab-only**: it requires explicit `N1B_ALLOW_EPHEMERAL_DB_TEST=yes`, a loopback PostgreSQL database named `n1b_lab`, a synthetic `@lab.invalid` bootstrap address and pre-existing approved organization ID. In a transaction it creates a single User and ADMIN membership for that pre-approved organization, and it is idempotent. **It refuses to reactivate or promote an existing SUSPENDED/REVOKED membership.**

The helper is not imported by NextAuth, not called on HTTP requests, and cannot run with a Neon production URL. The production provisioning procedure remains an independent institutional decision: identify organization and first admin through an authenticated out-of-band approval, review the database migration and audit trail, and never infer ADMIN privilege from email or a Google hosted-domain claim.

## Pre-deployment blockers

- Independent Antigravity audit against exact HEAD and reproduced tests.
- Integration test through the *actual GoogleProvider* with synthetic OIDC network configuration; current synthetic OIDC suite uses a custom test provider.
- CI and ephemeral Postgres verification of the lab-only provisioner.
- Real production DB migration approval (not authorized), session expiry/revocation design, audit trail, and multi-organization switcher behavior.
- Branch coordination with parallel Babel Draft PR #12 and previously stacked PRs.

All changes remain Draft with G3B sandbox only; G3-C not authorized.
