# G3C B2 — Neon persistent-database preflight (planning only)

## Prohibition
No connected Neon access, SQL execution, export, snapshot or mutation is authorized by this document. The workflow here is **only a future read-only plan** requiring a separately authorized operator, defined scope and time window. Do not send database credentials or data through chat, logs, GitHub Issues or CI.

## Decision tree
1. Determine whether the target Neon project/database actually exists and whether it contains production-like data. Record project and branch identifiers in **private approved evidence storage**, never exposed credentials.
2. If empty: document actual empty state, backup policy and migration history as verified by the operator, then stage a detached disposable rehearsal.
3. If pre-existing tables or migration history exist: **do not** blindly run the new `init_baseline` migration, `migrate deploy` or `migrate resolve`. A baseline intended for a blank database may fail on an existing schema.
4. Under a separately authorized read-only session, inventory table names/types, enum definitions, constraints, indexes, migration IDs/checksums/finished_at/rolled_back_at from `_prisma_migrations`, and aggregate row counts where privacy policy permits. Avoid row-level records. Sanitize values before storing evidence.
5. Compare a schema-only, sanitized snapshot with the exact PR #21 target migration chain and `schema.prisma`; classify mismatches and migration conflicts.
6. On an isolated **synthetic or safely de-identified clone**, rehearse backup/restore, baseline reconciliation, non-destructive data migration, rollback strategy and application startup. Collect drift results and duration; no real database is to be touched by the rehearsal.
7. Block progression unless a reviewed operator-runbook, backup proof, rollback evidence, named approver, maintenance window and exact target commit are available.

## Minimal evidence manifest (no credentials)
```json
{
  "gate": "B2",
  "candidate_commit": "dfaea155fe7b8f1afd988ab05e4705e0ea5a7625",
  "inventory_authorized": false,
  "inventory_completed": false,
  "production_database_mutated": false,
  "sanitized_schema_artifact_reference": null,
  "baseline_compatibility_reviewed": false,
  "isolated_rehearsal_passed": false,
  "restore_rehearsal_passed": false,
  "risk_owner_approval_reference": null
}
```
The example above intentionally represents a **blocked** gate. Never flip a field merely because a draft document exists.

## Stop conditions
Unknown prior migration history; differences in types, indexes, foreign keys or enum variants; inability to restore backup; unapproved identifiers; unredacted personal data; missing scope approval; or CI tests performed solely against an empty ephemeral database. Any such condition is **B2 NO-GO**.
