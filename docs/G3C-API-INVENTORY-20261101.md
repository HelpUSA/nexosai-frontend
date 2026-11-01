# N1-B/G3C API and server-side access inventory (repository snapshot 2026-11-01)

Source inventory: recursive Git tree of commit `dd43188c70a5e9c8c19713f77c2bb28a2eaefe97` (pre-PR17 base), compared with PR17 changes.

| Route / surface | Implementation | Server authz | Release verdict |
|---|---|---|---|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth GoogleProvider with single-email signIn bootstrap | Not sufficient for organizational authorization |
| `GET /api/orgs/[organizationId]/nodes/[nodeId]` | `src/app/api/orgs/[organizationId]/nodes/[nodeId]/route.ts` | NextAuth session + Prisma membership active + composite organization scope | Draft read-only; real handler HTTP still requires validation |
| `/admin`, `/agents`, `/conversations`, `/nodes`, `/dashboard` and other `src/app/*/page.tsx` | Next.js pages; no data API exposed under `src/app/api` for these entities in snapshot | Middleware is pass-through for /admin and /dashboard, not an RBAC guard | Never infer protection or write authorization |
| Node/Agent/Conversation/Message write actions | No route/action implementation identified in recursive file-tree snapshot | No enforcement to test | Future endpoints must be deny-by-default with per-request tenant scoping |

## Required implementation controls
- Apply shared server principal resolution to every new route and server action. Never trust client-supplied email, user id, role, or tenant.
- Verify membership ACTIVE using compound `userId + organizationId` on every sensitive read/write, and require explicit role/action matrix before writes.
- For messages, derive organization through parent conversation and enforce nested relationship; never scope by message id alone.
- For admin and sensitive mutations, require authorized role and auditable actor identity; avoid permission caching in long-lived JWT.
- Explicitly define 403-vs-404 resource-disclosure policy and test same-tenant and cross-tenant cases.
- UI middleware may improve navigation but cannot replace API authorization.

## Notes
This inventory does not claim feature completeness or that UI components are secure; it records the currently observable server route surface. It is not a G3C acceptance document.
