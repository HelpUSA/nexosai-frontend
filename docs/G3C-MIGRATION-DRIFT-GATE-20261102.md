# G3C — Prisma migration-only drift gate (Order 041 preparation)

## Purpose

GitHub Actions `.github/workflows/g3c-prisma-migration-drift.yml` independently checks the **migrations as committed**, without using `prisma db push` to repair a mismatched schema. Previous lab workflows used `db push` after `migrate deploy`, which could hide unintended gaps between checked-in migrations and the Prisma datamodel.

This gate applies migrations to a **fresh, disposable PostgreSQL 16 database** with a known local-only URL and then runs:
1. `prisma migrate deploy`
2. `prisma migrate status` (no suppressed exit status)
3. `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code`
4. `prisma migrate deploy` again
5. Repeat the drift check.

In Prisma's drift command, exit 0 signifies equal schemas, exit 2 signifies detected differences, and nonzero errors fail the job. No real Neon connection is configured or accessed by this workflow.

## Scope limitation

A green result certifies only that a **fresh database created by the committed migrations** matches the schema. It **does not** demonstrate that an existing live/persistent database can be safely upgraded using the new baseline. It also does not validate Google OAuth/HTTPS, resolve dev dependency advisories, or authorize G3C.

## Persistent database preflight (documentation only)

Before any actual deployment, obtain read-only verified inventory from the target database under authorized access: `_prisma_migrations` history, present tables and indexes, constraints/enums, role and default permissions, row counts and backups. Compare a sanitized schema-only snapshot with the proposed migration chain **in a separate isolated clone**. Define a non-destructive baseline adoption approach and documented rollback, including explicit approval for any `migrate resolve` operations, before requesting an authorization decision. Do not run `prisma migrate deploy` or `prisma migrate resolve` against a real database under this draft.

## Evidence expected

Record exact PR HEAD and workflow run URL, whether the drift command returns 0, whether both deployment passes are successful, and whether Prisma reports pending migrations. Attach sanitized logs, not credentials or connection strings. Keep all relevant PRs Draft until the Master SuperAdmin authorizes a separate decision.
