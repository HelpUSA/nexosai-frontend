# G3C candidate — execution, evidence, and rollback (2026-11-01)

## Scope and evidence
This branch adds PostgreSQL service-based tests only. It does not authorize a live migration, deploy, merge into master, or G3C approval. The DB is GitHub Actions' PostgreSQL 16 service container. The test refuses any connection except localhost database `nexosai_g3c_test` with `G3C_EPHEMERAL_POSTGRES=YES`. No production credentials used.

## Existing stack and dependencies
PR #3 introduces OrganizationMembership. PR #9 repeats the same schema in a separate stacked branch. Both heads were byte-identical in the independent QA report, but Git merge ancestry and migration history require reconciliation. #7 -> #8 -> #9 -> #10 -> this PR follows the lab chain; PR #3 does **not** form a direct ancestor of #9. No migration files are present in the reviewed candidate. Integrator must select exactly one canonical membership schema and generate a single reviewed migration before live use.

## Exit gates
1. Confirm integrated test passes against ephemeral PostgreSQL and reports 401, 403, 404, authorized reads, immediate revocation and tenant scoping. This does **not** prove real Next.js handler HTTP functionality.
2. Add actual HTTP handler tests and controlled GoogleProvider/HTTPS/Secure cookie tests. Never use real user credentials for the lab.
3. Audit and secure every business API and server action (admin, agents, conversations, messages and write paths). UI navigation middleware is not authorization.
4. Replace bootstrap-only email allowance with controlled, auditable multi-user onboarding; enforce verified identity and previously approved organization; never auto-approve ADMIN memberships on signin.
5. Diagnose Vercel previews #9/#10; confirm checks, latest SHA and independent security review.
6. Patch dev advisories using compatible lockfile updates, or obtain documented risk owner waiver with expiry; do not use `npm audit fix --force`.
7. Review Prisma migration against disposable copy of expected production schema and retain a tested recovery procedure.

## Deployment and rollback runbook (NOT EXECUTED)
- Obtain approved change window, named operator, deployment inventory, health endpoint baseline, and current immutable deployment identifier.
- Create a verified, access-controlled PostgreSQL backup/snapshot and rehearse restoration in a separate database. Record migration SQL, forward compatibility and rollback options; destructive schema rollback requires explicit data recovery plan.
- Deploy first to preview/staging with staged secrets; run HTTP 401/403/404, cross-tenant, revocation, negative-write and GoogleProvider flows.
- After independent green security signoff, deploy a small controlled production rollout; monitor 401/403/404/5xx rates and database connection failures, plus organization access audit events.
- If threshold crossed, stop rollout and route traffic back to preceding known-good immutable deployment; for data changes, use reviewed restore/forward-fix plan, not unreviewed `migrate reset`.
- Preserve sanitized logs and precise SHAs; only then update issue #16 / gate decision.

## Decision
G3B: sandbox only. G3C: NO-GO until all exit gates are evidenced.
