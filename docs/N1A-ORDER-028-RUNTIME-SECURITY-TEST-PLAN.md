# N1-A — Runtime auth integration risk gates (after Order 028)

Status: **TEST PLAN ONLY**. GitHub PR #5 and independent Windows 11 QA establish that npm ci, 9 auth environment tests, Prisma generate, Next build and npm audit --audit-level=high passed. They do **not** establish OAuth/session security or authorization.

## A. First trace what NextAuth v4 actually imports
- Inspect package tree: `npm ls next-auth @auth/core cookie jose openid-client oauth4webapi`, plus module import path from `src/app/api/auth/[...nextauth]/route.ts`.
- Determine if `@auth/core` is executed by the v4 route in each tested scenario. An override fixing a package advisory does not prove that an OAuth protocol flow runs through it.
- Run `npm audit --omit=dev --json` and compare to full audit; review SBOM/dedup tree. Reports that all residual findings are dev-only need an independently verified production dependency chain.

## B. Synthetic OAuth / OIDC test matrix — must actually execute before signoff
| ID | Test | Expected behavior |
|---|---|---|
| T1 | Ephemeral loopback fake OIDC discovery, authorization redirect, JWKS, token exchange and userinfo; use disposable issuer and signed tokens | One valid callback yields a session for configured bootstrap email only |
| T2 | Same protocol fixture; second user email not equal to bootstrap address | Login denied without session cookie |
| T3 | State/PKCE/nonce checked on valid flow; tamper each cookie, swap provider, expire or reuse callback | Reject securely; do not exchange code or establish session |
| T4 | Inspect response Set-Cookie in actual HTTP tests | HttpOnly and appropriate SameSite; Secure on HTTPS only; cookie names and callback behavior verified against actual NextAuth v4 |
| T5 | Expired or tampered JWT/JWE cookie, rotated synthetic secret, malformed Authorization/Bearer | No crash/unhandled error, no session/privilege escalation |
| T6 | Email with mixed-case, Unicode normalization and homoglyph delimiter lookalikes | No bootstrap bypass or tenant access; consistent normalization from source to claim and storage |
| T7 | callback user/account/profile claims with missing email, wrong issuer/audience, invalid signature | Fail closed; no elevated role or tenant claim |
| T8 | Missing auth secret, conflicting aliases, missing Google OAuth creds | Service fails closed without fallback, no secrets logged |
| T9 | Middleware, Next server components and API entrypoints | Anonymous 401 or redirect; nonmember 403; cross-tenant resource indistinguishable 404 |
| T10 | Tenant membership from disposable DB; revoked/suspended membership; role downgrade; nested documents/messages | Deny after state changes, not just on initial token issuance |

## Implementation requirements
Use mock OIDC credentials/secret and disposable localhost servers only. No Google production authorization, no real contacts, persistent data, Node gateway, or cloud credentials. The current `makeAuthOptions` has an email bootstrap-only signIn gate; it does not implement membership. Tests must distinguish isolated unit checks from actual HTTP callback/cookie/session integration.

## Release decision
Do not merge/deploy on the strength of unit tests or next build alone. Independent QA and user authorization remain necessary. Log any known compatibility failure in Issue #4; review 17 residual advisories and document accepted exceptions separately.
