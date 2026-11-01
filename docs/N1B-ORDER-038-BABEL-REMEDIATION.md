# Order 038 — Babel 7.29.7 isolated remediation

The `@babel/core` source-map advisory GHSA-4x5r-pxfx-6jf8 affects versions up to 7.29.0 and has a 7.x patch in 7.29.6 or higher. This Draft branch pins `7.29.7` by package override and regenerates its lockfile in an isolated GitHub Actions Ubuntu job with package lifecycle scripts suppressed.

## Locked dependency outcome
- `@babel/core` locked to `7.29.7`.
- An unused `@auth/core` optional peer of NextAuth v4 is pruned by `npm install --package-lock-only`. The NextAuth v4 package does not import this peer in the runtime code paths audited in Order 029. Its override remains pinned in the manifest for explicit policy.
- `npm ci`, existing N1-A/N1-B synthetic suites and both npm audit gates were required before the lockfile writer was allowed to commit.
- The remaining moderate `minimatch` findings are NOT waived; ESLint 9's major-version dependencies cannot be blindly replaced with minimatch 11.0.1 without compatibility testing.

## Controls
The CI lock writer runs only for a dedicated private Draft branch and commits only `package-lock.json` after tests; no production secret, deployment, real database migration or G3-C.

Production dependency advisories and the full high+critical gate must remain zero on independent fresh runs. Other dev advisories remain subject to review and formal approval.
