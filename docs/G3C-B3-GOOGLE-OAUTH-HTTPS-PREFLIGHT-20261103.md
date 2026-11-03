# G3C B3 — Google OAuth / HTTPS acceptance protocol (no real credentials)

## Boundary
All current sandbox HTTP tests with synthetic JWT and placeholder OAuth client credentials provide **no proof of successful real Google login**. This document is not an instruction to provision production secrets. B3 remains NO-GO until a named authorized operator completes the safe staging verification below.

## Preparation by authorized operator, not ChatGPT
- Obtain authorized **staging-only** Google OAuth client, consent-screen settings and test identities through approved secret manager. Never paste client secrets, tokens, cookies, verification codes or refresh tokens in GitHub, issues, logs or chat.
- Bind explicit allowed redirect URIs, origin(s), correct `NEXTAUTH_URL`, issuer/audience policy and HTTPS host. Separate staging credentials from production. Treat tenant identities as test fixtures only.
- Confirm TLS certificate chain, HSTS and secure proxy headers. For auth cookies verify `Secure`, `HttpOnly`, `SameSite`, expiry, CSRF protections and session invalidation. Do not claim success from static config alone.

## Execution cases and expected evidence
1. Fresh Google login through browser (staging TLS), verified email, state/nonce validation where supported, correct callback and server-side user provision.
2. Invalid OAuth state, invalid/expired code, wrong audience/issuer, disabled account, unverified email, denied consent and replay must fail closed without leaking credentials.
3. Staging identity with VIEWER role must be denied sensitive Admin/Audit; ACTIVE OWNER/ADMIN allowed only in explicitly selected organization. OPERATOR access consistent with policies.
4. Membership REVOKED and SUSPENDED must take effect immediately on sensitive API requests; cross-tenant requests should not disclose another organization's records.
5. Verify successful logout, session rotation/invalidation, cookie attributes over actual HTTPS, and safe server-side audit metadata without PII.
6. Ensure preview deployments cannot accidentally use production OAuth client or enable bypassing checks.
7. Collect sanitized evidence: test ID, timestamp, SHA, staging URL *without secrets*, HTTP status, screenshot with redaction, browser/runtime versions and reviewer sign-off.

## Gate conclusion
B3 PASS requires all above cases, named security reviewer and linked sanitized evidence. Failures block G3C. The person holding credentials must execute staging steps under express authorization; this PR contains no credentials, deployments or access.
