# Order 033 — Development-tooling vulnerability triage (not an exception)

## Audited state
Prior independent Antigravity Windows 11 Order 029 reported **0 npm advisories in runtime dependencies** using `npm audit --omit=dev --json`. Full dependency tree after Order 027 remediation had **16 moderate and one low** findings, concentrated in ESLint/minimatch and Babel tooling. These numbers are a snapshot, not a guarantee about future advisories.

## What this PR does
- Read-only advisory classification for current committed lockfile, outputting exact vulnerable package paths and `fixAvailable` from npm audit.
- Blocking gates: **zero known production advisories at any severity**, and zero high/critical anywhere in the full dependency tree.
- The development findings remain visible, without `continue-on-error` bypass on the actual production/high-severity gates.
- No `npm audit fix --force`, no implicit major-version upgrades, no migration or deploy.

## Security decision required
Development/build tooling is not necessarily harmless: CI/build input, source maps and scripts may process untrusted artifacts. Review exact vulnerable package versions and dependency edges; patch via independently tested nonbreaking versions when available. For any remaining finding, record affected build jobs, mitigations, issue tracking, accountable reviewer, expiration date and formal exception decision **before release**.

## Release dependencies
Orders 031/032 JWT/tenant HTTP lab, Order 034 matrix, independent Windows/Node24 Antigravity QA, genuine App Router+Prisma tests with ephemeral DB, reconciliation with prior Draft PR #3's membership schema, and governance approval. No G3-C.
