# G3C — PR lineage reconciliation snapshot, 2026-11-03

**Repository:** HelpUSA/nexosai-frontend. **Reference candidate:** PR #21, SHA `dfaea155fe7b8f1afd988ab05e4705e0ea5a7625`. **No merges performed.**

Each row below is from GitHub compare of `base=<individual PR HEAD>` and `head=<candidate SHA>`. `behind_by=0` means the candidate contains the PR HEAD in direct commit ancestry. `behind_by>0` means **diverged**, and the candidate cannot be declared to contain all commits from that PR solely from commit ancestry. This is NOT a source code semantic diff or conflict assessment.

| PR | behind_by | ahead_by | Commit ancestry result |
|---:|---:|---:|---|
| 1 | 0 | 73 | Ancestor |
| 2 | 14 | 85 | Diverged (separate demo UI branch) |
| 3 | 6 | 74 | Diverged (membership alternative) |
| 5 | 0 | 65 | Ancestor |
| 6 | 0 | 60 | Ancestor |
| 7 | 0 | 53 | Ancestor |
| 8 | 0 | 43 | Ancestor |
| 9 | 0 | 37 | Ancestor |
| 10 | 0 | 33 | Ancestor |
| 11 | 13 | 33 | Diverged |
| 12 | 19 | 33 | Diverged |
| 13 | 22 | 33 | Diverged |
| 14 | 32 | 33 | Diverged |
| 15 | 37 | 33 | Diverged |
| 17 | 0 | 11 | Ancestor |
| 18 | 0 | 4 | Ancestor |
| 19 | 2 | 7 | Diverged, but contract test copied into PR #18 in Order 040 |
| 20 | 2 | 4 | Diverged, but migration gate workflow and doc copied into PR #21 |

## Actionable review queue

1. **Critical: PR #3** — compare membership schema, migrations and security behavior to PR #21. Do not merge parallel membership schema/migrations without field-level reconciliation.
2. **PRs #11–#15** — inspect independent features and determine if desired behaviors are absent, superseded or explicitly out of scope. Do not assume ancestors of #10 include subsequent independent #11–#15 work.
3. **PR #2** — Demo/UNKNOWN user experience is independent. Compare product scope, test UI behavior and determine if it belongs in this release.
4. **PRs #19/#20** — verify content equivalence for copied artifacts against audited original blobs; do not require merging original commits merely to achieve traceability.
5. **Repository branch correctness** — the current default branch is `master`; several older PRs target `main`. No merge order is safe without explicit branch strategy and conflict review.

## Explicit limitations

This is a source-control ancestry review, **not** approval to merge or proof that divergent work is missing: equivalent source changes can be reimplemented on the candidate without original commits. Perform file-level and behavior-level comparisons separately. The candidate remains **G3B sandbox GO; G3C NOT_AUTHORIZED**. Existing migrations, Neon DB, OAuth credentials and user data remain untouched.
