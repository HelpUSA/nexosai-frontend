# N1-B — Membership design and pure authorization guards

This stacked Draft branch depends on the N1-A auth PR. It is a proposal for the data model and a pure, dependency-free authorization kernel with synthetic tests.

- Prisma OrganizationMembership adds composite key (userId, organizationId), role per organization, and status default SUSPENDED. Users are not implicitly active members; global User.role is NOT organization membership.
- Pure guards require a trusted caller to supply an authenticated user ID and an independently verified membership. The selected organization ID cannot authorize access without a matching ACTIVE membership.
- Resource authorization checks the organization of the underlying resource. Nested Message/Conversation or Embedding/Document requires parent authorization.
- The guards are **NOT** yet wired to any NextAuth cookie, HTTP route or Prisma query. No database has been migrated or opened. This PR DOES NOT represent functioning user-organization RBAC.
- Before any release: use authenticated NextAuth session and database-backed membership lookup, pagination-safe tenant filters, review migrations against disposable PostgreSQL, secure server pages/API routes, and integration tests for read/write and session expiry.
- Gate remains blocked by N1-A dependency audit/lockfile findings and no independent Windows QA. Draft only; no merge/deploy.
