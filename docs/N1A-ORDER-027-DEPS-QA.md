# N1-A — Dependency remediation verification (Order 027)

- Baseline: Antigravity QA Order 026: 34 vulnerabilities (2 low, 17 moderate, 11 high, 4 critical).
- First staged lockfile: 28 vulnerabilities (2 low, 17 moderate, 7 high, 2 critical).
- Independent Windows 11 audit Order 027 recommended Zod ^4.6.7 and targeted transitive overrides.
- Final regenerated lockfile in this sandbox branch: 17 vulnerabilities (1 low, 16 moderate, **0 high, 0 critical**) in GitHub Actions [run 41244261071](https://github.com/HelpUSA/nexosai-frontend/actions/runs/41244261071).
- **npm ci PASS**, **9/9 auth configuration tests PASS**, Prisma generate PASS, Next build PASS, **npm audit --audit-level=high PASS**.
- Locked packages include Next 16.4.3, NextAuth 4.24.15, @auth/core 0.41.3, Zod 4.6.7 and deepmerge-ts 8.0.2.
- This documentation commit triggers an additional cross-OS matrix in GitHub Actions on the committed lockfile, not the pre-regeneration lock.
- The audit checks dependency advisories, not session security: real Google OAuth callback, session token verification, role membership and cross-tenant runtime authz integration are not yet tested.
- The remaining 16 moderate and 1 low advisories need review and mitigation/explicit acceptance before production. No merge/deploy/migration/secret access authorized.
- Draft PR #5 remains stacked on Draft N1-A PR #1. N1-B server-side integration is separate and incomplete.
