# NexosAI N1-A — Auth security sandbox patch

Ref: HelpUSA/nexosai-frontend main b73bc1353175ee85c3110f5eaaf73f9a2a09cd5a.
Governance: Draft PR ONLY. No merge or deploy. Issue HelpUSA/hub#10.

- Standardize NextAuth v4 already pinned by lockfile, rather than the incompatible v5 style previously present in src/auth.ts.
- Remove insecure signing-secret fallback and demo Google OAuth credentials; fail closed with incomplete variables. Support NEXTAUTH_SECRET as a compatibility alias. Reject conflicting AUTH_SECRET vs NEXTAUTH_SECRET.
- NEXOSAI_BOOTSTRAP_ADMIN_EMAIL is a temporary single-user login gate, NOT per-organization authorization. No tenant/data API may trust it as sufficient permission.
- N1-B must add membership and server-side authorization prior to real data usage. No real credentials/keys should be added to tests or GitHub.
- A later explicitly authorized deployment must inventory and rotate any session signing key previously used in exposed environments. No rotation or deployment is performed by this Draft.
