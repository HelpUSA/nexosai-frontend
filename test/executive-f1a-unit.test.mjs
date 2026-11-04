import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeExecutiveAccess,
  assertF1AScopeAllowed,
  isExecutiveGlobalEnabled,
  withExecutiveTenantContext,
} from '../src/lib/executive/executive-gate.mjs';
import {
  redactSecrets,
  sanitizeExternalContent,
  validateStrictIdentifier,
  validateSafeSourceUrl,
  validateAndSanitizeMetadata,
  computeSignalDedupHash,
  assertUntrustedCannotTriggerDecision,
  INTERNAL_CONNECTOR_PROVENANCE_TOKEN,
} from '../src/lib/executive/executive-security.mjs';
import {
  computeWorkItemPriority,
  validateWorkItemTransition,
  createCapturedWorkItem,
  transitionWorkItem,
} from '../src/lib/executive/priority-engine.mjs';
import {
  assertReadOnlyHttpMethod,
  ingestExecutiveSignal,
  pollGitHubRepositorySignalsReadOnly,
  pollVercelProjectSignalsReadOnly,
} from '../src/lib/executive/connectors-readonly.mjs';
import {
  APPROVED_D3_CADENCE_DEFAULTS,
  evaluateCadenceSlot,
  isWithinQuietHours,
  buildMeuDiaAndRadarSnapshot,
  executeAutoUnsnoozeMutation,
  runScheduledBriefingJob,
} from '../src/lib/executive/cadence-scheduler.mjs';

function makeMockDb({
  orgFeatures = { executiveProactiveGm: true },
  membershipRole = 'OWNER',
  membershipStatus = 'ACTIVE',
  portfolioProactive = true,
  portfolioPrivacy = 'ORG_SHARED',
} = {}) {
  const workItems = [];
  const signals = [];
  const events = [];
  const outbox = [];
  const briefings = [];
  const cursors = new Map();

  const db = {
    async $transaction(callback) {
      const tx = {
        async $executeRaw() {
          return 1;
        },
        async $executeRawUnsafe() {
          return 1;
        },
        portfolioItem: db.portfolioItem,
        workItem: db.workItem,
        workItemEvent: db.workItemEvent,
        outboxEvent: db.outboxEvent,
        signal: db.signal,
        integrationCursor: db.integrationCursor,
        briefingRun: db.briefingRun,
      };
      return callback(tx);
    },
    user: {
      async findUnique({ where }) {
        if (where.email === 'owner@helpusbr.com') {
          return { id: 'usr_owner_1', email: 'owner@helpusbr.com', role: 'OWNER' };
        }
        if (where.email === 'member@helpusbr.com') {
          return { id: 'usr_member_1', email: 'member@helpusbr.com', role: 'ADMIN' };
        }
        return null;
      },
    },
    organization: {
      async findUnique({ where }) {
        if (where.id === 'org_alpha') {
          return {
            id: 'org_alpha',
            name: 'HelpUS Alpha',
            slug: 'helpus-alpha',
            features: orgFeatures,
          };
        }
        return null;
      },
    },
    organizationMembership: {
      async findUnique({ where }) {
        const key = where.userId_organizationId;
        if (key?.userId === 'usr_owner_1' && key?.organizationId === 'org_alpha') {
          return {
            userId: 'usr_owner_1',
            organizationId: 'org_alpha',
            role: membershipRole,
            status: membershipStatus,
          };
        }
        if (key?.userId === 'usr_member_1' && key?.organizationId === 'org_alpha') {
          return {
            userId: 'usr_member_1',
            organizationId: 'org_alpha',
            role: 'ADMIN',
            status: 'ACTIVE',
          };
        }
        return null;
      },
    },
    portfolioItem: {
      async findFirst({ where }) {
        if (where.id === 'port_1' && where.organizationId === 'org_alpha') {
          return {
            id: 'port_1',
            organizationId: 'org_alpha',
            slug: 'nexosai',
            name: 'NexosAI',
            type: 'APPLICATION',
            lifecycle: 'STAGING',
            privacyScope: portfolioPrivacy,
            isProactiveEnabled: portfolioProactive,
            priorityWeight: 85,
            staleAfterDays: 5,
            lastActivityAt: new Date('2026-10-25T12:00:00Z'),
            repoFullName: 'HelpUSA/nexosai-frontend',
          };
        }
        return null;
      },
      async findMany() {
        return [
          {
            id: 'port_1',
            organizationId: 'org_alpha',
            slug: 'nexosai',
            name: 'NexosAI',
            type: 'APPLICATION',
            lifecycle: 'STAGING',
            privacyScope: portfolioPrivacy,
            isProactiveEnabled: portfolioProactive,
            priorityWeight: 85,
            staleAfterDays: 5,
            lastActivityAt: new Date('2026-10-25T12:00:00Z'),
            repoFullName: 'HelpUSA/nexosai-frontend',
          },
        ];
      },
      async update({ where, data }) {
        return { id: where.id, ...data };
      },
    },
    workItem: {
      async count() {
        return workItems.filter((w) => !['DONE', 'CANCELED'].includes(w.status)).length;
      },
      async create({ data }) {
        const row = { id: `wi_${workItems.length + 1}`, ...data };
        workItems.push(row);
        return row;
      },
      async findFirst({ where }) {
        return (
          workItems.find(
            (w) => w.id === where.id && w.organizationId === where.organizationId
          ) || null
        );
      },
      async update({ where, data }) {
        const idx = workItems.findIndex((w) => w.id === where.id);
        workItems[idx] = { ...workItems[idx], ...data };
        return workItems[idx];
      },
      async findMany({ where } = {}) {
        let res = [...workItems];
        if (where?.status === 'SNOOZED') {
          res = res.filter((w) => w.status === 'SNOOZED');
        }
        return res.sort((a, b) => b.priorityScore - a.priorityScore);
      },
    },
    workItemEvent: {
      async create({ data }) {
        const ev = { id: `ev_${events.length + 1}`, ...data };
        events.push(ev);
        return ev;
      },
    },
    outboxEvent: {
      async create({ data }) {
        const ob = { id: `ob_${outbox.length + 1}`, ...data };
        outbox.push(ob);
        return ob;
      },
    },
    signal: {
      async findFirst({ where }) {
        return (
          signals.find(
            (s) =>
              s.organizationId === where.organizationId &&
              s.sourceType === where.sourceType &&
              s.externalId === where.externalId
          ) || null
        );
      },
      async count() {
        return signals.length;
      },
      async create({ data }) {
        const sig = { id: `sig_${signals.length + 1}`, ...data };
        signals.push(sig);
        return sig;
      },
      async findMany() {
        return signals;
      },
    },
    integrationCursor: {
      async findFirst({ where }) {
        return cursors.get(`${where.organizationId}:${where.sourceType}:${where.externalScopeKey}`) || null;
      },
      async upsert({ where, create, update }) {
        const k = where.organizationId_sourceType_externalScopeKey;
        const mapKey = `${k.organizationId}:${k.sourceType}:${k.externalScopeKey}`;
        const cur = cursors.get(mapKey);
        const next = cur ? { ...cur, ...update } : { id: `cur_${cursors.size + 1}`, ...create };
        cursors.set(mapKey, next);
        return next;
      },
    },
    briefingRun: {
      async findFirst({ where }) {
        return (
          briefings.find(
            (b) =>
              b.organizationId === where.organizationId &&
              b.cadenceType === where.cadenceType &&
              b.windowStart.getTime() === where.windowStart.getTime() &&
              b.windowEnd.getTime() === where.windowEnd.getTime()
          ) || null
        );
      },
      async count({ where }) {
        return briefings.filter(
          (b) =>
            b.organizationId === where.organizationId &&
            b.cadenceType === where.cadenceType
        ).length;
      },
      async create({ data }) {
        const br = { id: `br_${briefings.length + 1}`, ...data };
        briefings.push(br);
        return br;
      },
    },
    _state: { workItems, signals, events, outbox, briefings, cursors },
  };
  return db;
}

test('Order 063 P1.1: withExecutiveTenantContext fails closed without transaction and NEVER executes callback', async () => {
  let executed = false;
  await assert.rejects(
    async () => {
      await withExecutiveTenantContext({ $transaction: null }, 'org_alpha', async () => {
        executed = true;
      });
    },
    /DATABASE_TRANSACTION_INTERFACE_UNAVAILABLE/,
    'Must throw without executing callback when $transaction is missing'
  );
  assert.equal(executed, false, 'Callback must never execute when RLS transaction cannot be established');

  await assert.rejects(
    async () => {
      await withExecutiveTenantContext(
        {
          async $transaction(cb) {
            return cb({ $executeRaw: null }); // Missing execute interface
          },
        },
        'org_alpha',
        async () => {
          executed = true;
        }
      );
    },
    /TRANSACTION_EXECUTE_INTERFACE_UNAVAILABLE/
  );
  assert.equal(executed, false);
});

test('Order 063 P1.2: buildMeuDiaAndRadarSnapshot is 100% PURE READ-ONLY (zero side effects on GET)', async () => {
  const db = makeMockDb();
  const fixedNow = new Date('2026-11-04T11:00:00Z');

  // Seed a snoozed item whose snooze has expired
  await db.workItem.create({
    data: {
      organizationId: 'org_alpha',
      title: 'Item snoozado expirado',
      status: 'SNOOZED',
      snoozedUntil: new Date('2026-11-04T10:00:00Z'),
      snoozeCount: 1,
      priorityScore: 70,
    },
  });

  const stateBefore = JSON.stringify(db._state.workItems);
  const eventsBefore = db._state.events.length;
  const outboxBefore = db._state.outbox.length;

  // Execute snapshot generation (invoked by GET endpoint)
  const snapshot = await buildMeuDiaAndRadarSnapshot(db, {
    organizationId: 'org_alpha',
    now: fixedNow,
  });

  const stateAfter = JSON.stringify(db._state.workItems);
  assert.equal(stateBefore, stateAfter, 'buildMeuDiaAndRadarSnapshot MUST NOT mutate any WorkItem in DB');
  assert.equal(db._state.events.length, eventsBefore, 'Must not emit workItemEvents on GET');
  assert.equal(db._state.outbox.length, outboxBefore, 'Must not emit outboxEvents on GET');

  // Verify dedicated mutator DOES unsnooze and emit audit events
  const unsnoozeResult = await executeAutoUnsnoozeMutation(db, {
    organizationId: 'org_alpha',
    now: fixedNow,
  });
  assert.equal(unsnoozeResult.ok, true);
  assert.equal(unsnoozeResult.count, 1);
  assert.equal(db._state.workItems[0].status, 'TODAY');
  assert.equal(db._state.events.length, 1);
  assert.equal(db._state.outbox.length, 1);
});

test('Order 063 P1.3: authorizeExecutiveAccess enforces feature flag and tenant boundaries with flag ON', async () => {
  const db = makeMockDb();
  const envOn = { NEXOSAI_EXECUTIVE_ENABLED: 'true' };

  // Authenticated Owner in same org -> 200
  const authOwner = await authorizeExecutiveAccess({
    email: 'owner@helpusbr.com',
    organizationId: 'org_alpha',
    portfolioItemId: 'port_1',
    db,
    env: envOn,
  });
  assert.equal(authOwner.ok, true);
  assert.equal(authOwner.status, 200);

  // Authenticated Admin in same org -> 200
  const authAdmin = await authorizeExecutiveAccess({
    email: 'member@helpusbr.com',
    organizationId: 'org_alpha',
    db,
    env: envOn,
  });
  assert.equal(authAdmin.ok, true);
  assert.equal(authAdmin.status, 200);

  // User from foreign organization -> 403 ORG_MEMBERSHIP_REQUIRED
  const authForeign = await authorizeExecutiveAccess({
    email: 'owner@helpusbr.com',
    organizationId: 'org_foreign_beta',
    db,
    env: envOn,
  });
  assert.equal(authForeign.status, 403);
  assert.equal(authForeign.code, 'ORG_MEMBERSHIP_REQUIRED');

  // Disabled portfolioItem cannot be bypassed
  const dbPortfolioDisabled = makeMockDb({ portfolioProactive: false });
  const authDisabledPort = await authorizeExecutiveAccess({
    email: 'owner@helpusbr.com',
    organizationId: 'org_alpha',
    portfolioItemId: 'port_1',
    db: dbPortfolioDisabled,
    env: envOn,
  });
  assert.equal(authDisabledPort.status, 403);
  assert.equal(authDisabledPort.code, 'PORTFOLIO_PROACTIVE_DISABLED');
});

test('Order 063 P1.4: Strict Anti-Spoofing blocks forging GITHUB/VERCEL signals without internal token', async () => {
  const db = makeMockDb();

  // Attempting to ingest GITHUB signal without internal token -> 403 CONNECTOR_SOURCE_SPOOFING_FORBIDDEN
  const spoofedGitHub = await ingestExecutiveSignal(db, {
    organizationId: 'org_alpha',
    portfolioItemId: 'port_1',
    sourceType: 'GITHUB',
    externalId: 'HelpUSA/nexosai-frontend#33',
    title: 'Spoofed GitHub PR',
    provenanceToken: null, // No internal token!
  });
  assert.equal(spoofedGitHub.ok, false);
  assert.equal(spoofedGitHub.status, 403);
  assert.equal(spoofedGitHub.code, 'CONNECTOR_SOURCE_SPOOFING_FORBIDDEN');

  // Attempting to ingest VERCEL signal without internal token -> 403
  const spoofedVercel = await ingestExecutiveSignal(db, {
    organizationId: 'org_alpha',
    portfolioItemId: 'port_1',
    sourceType: 'VERCEL',
    externalId: 'prj_123:dpl_123:READY',
    title: 'Spoofed Vercel Deploy',
    provenanceToken: null,
  });
  assert.equal(spoofedVercel.status, 403);
  assert.equal(spoofedVercel.code, 'CONNECTOR_SOURCE_SPOOFING_FORBIDDEN');

  // Legitimate manual signal with actorUserId -> 201
  const legitManual = await ingestExecutiveSignal(db, {
    organizationId: 'org_alpha',
    portfolioItemId: 'port_1',
    sourceType: 'MANUAL',
    externalId: 'user_note_1',
    title: 'Nota manual do gestor',
    actorUserId: 'usr_owner_1',
  });
  assert.equal(legitManual.ok, true);
  assert.equal(legitManual.status, 201);
  assert.equal(legitManual.signal.rawMetadata.actorUserId, 'usr_owner_1');

  // Internal poller supplying INTERNAL_CONNECTOR_PROVENANCE_TOKEN -> 201
  const legitPoller = await ingestExecutiveSignal(db, {
    organizationId: 'org_alpha',
    portfolioItemId: 'port_1',
    sourceType: 'GITHUB',
    externalId: 'HelpUSA/nexosai-frontend#33',
    title: 'Legitimate polled GitHub PR',
    provenanceToken: INTERNAL_CONNECTOR_PROVENANCE_TOKEN,
  });
  assert.equal(legitPoller.ok, true);
  assert.equal(legitPoller.status, 201);
});

test('Order 063 P1.5: Validation and sanitization of sourceUrl, metadata, and identifiers', () => {
  // URLs with credentials or query secrets are rejected
  assert.equal(validateSafeSourceUrl('http://insecure.invalid').ok, false);
  assert.equal(validateSafeSourceUrl('https://user:pass@github.com/HelpUSA/repo').ok, false);
  assert.equal(validateSafeSourceUrl('https://github.com/HelpUSA/repo?token=ghp_secret123').ok, false);

  // Legitimate HTTPS URL stripped of query/hash
  const validUrl = validateSafeSourceUrl('https://github.com/HelpUSA/nexosai-frontend/pull/33?tab=files#diff-1');
  assert.equal(validUrl.ok, true);
  assert.equal(validUrl.url, 'https://github.com/HelpUSA/nexosai-frontend/pull/33');

  // Scope check rejects URL outside authorized repository
  const outOfScope = validateSafeSourceUrl('https://github.com/Malicious/other-repo/pull/1', {
    requiredOriginPrefix: 'https://github.com/HelpUSA/nexosai-frontend',
  });
  assert.equal(outOfScope.ok, false);
  assert.equal(outOfScope.code, 'SOURCE_URL_OUTSIDE_AUTHORIZED_SCOPE');

  // Metadata prototype pollution and size checks
  assert.equal(validateAndSanitizeMetadata({ __proto__: { admin: true } }).ok, false);
  assert.equal(validateAndSanitizeMetadata({ nested: { level2: { level3: 'too deep' } } }).ok, false);
  assert.equal(validateAndSanitizeMetadata({ safeKey: 'safeVal', token: 'ghp_12345678901234567890' }).metadata.token, '[REDACTED_CREDENTIAL]');

  // Strict identifier validation
  assert.equal(validateStrictIdentifier('valid_id-123.scope').ok, true);
  assert.equal(validateStrictIdentifier('../path/traversal').ok, false);
  assert.equal(validateStrictIdentifier('spaces not allowed').ok, false);
});

test('Order 063 P1.6: Cadence evaluation with true UTC epoch slot boundaries & DST transition safety', () => {
  // America/Fortaleza (UTC-3 constantly, no DST)
  const refFortaleza = new Date('2026-11-04T11:15:00Z'); // 08:15 Fortaleza
  const slotFortaleza = evaluateCadenceSlot(refFortaleza, { timezone: 'America/Fortaleza' });
  assert.equal(slotFortaleza.matchedCadence, 'MORNING_BRIEFING');
  assert.equal(slotFortaleza.windowStart.toISOString(), '2026-11-04T11:00:00.000Z');
  assert.equal(slotFortaleza.windowEnd.toISOString(), '2026-11-04T11:30:00.000Z');
  assert.match(slotFortaleza.slotKey, /America\/Fortaleza#2026-11-04#MORNING_BRIEFING#slot_16/);

  // America/New_York on US Fall Back DST transition Sunday (2026-11-01)
  // At 01:15 EDT (05:15 UTC), then at 01:15 EST (06:15 UTC)
  const dt1 = new Date('2026-11-01T05:15:00Z');
  const dt2 = new Date('2026-11-01T06:15:00Z');
  const slotNy1 = evaluateCadenceSlot(dt1, { timezone: 'America/New_York' });
  const slotNy2 = evaluateCadenceSlot(dt2, { timezone: 'America/New_York' });

  // Both have true discrete UTC epoch boundaries that do NOT collide!
  assert.notEqual(slotNy1.windowStart.getTime(), slotNy2.windowStart.getTime());
  assert.equal(slotNy1.windowStart.toISOString(), '2026-11-01T05:00:00.000Z');
  assert.equal(slotNy2.windowStart.toISOString(), '2026-11-01T06:00:00.000Z');
});

test('Order 063 P1.7: Marking DONE requires verifiable evidence & Outbox blocks external dispatch in F1A', async () => {
  const db = makeMockDb();
  const captured = await createCapturedWorkItem(db, {
    organizationId: 'org_alpha',
    title: 'Ajuste de teste P1.7',
    status: 'IN_PROGRESS',
  });
  assert.equal(captured.ok, true);

  // Transitioning to DONE without evidence/rationale must fail
  const doneNoEvidence = await transitionWorkItem(db, {
    organizationId: 'org_alpha',
    workItemId: captured.workItem.id,
    toStatus: 'DONE',
    rationale: '',
    verificationEvidence: '',
  });
  assert.equal(doneNoEvidence.ok, false);
  assert.equal(doneNoEvidence.status, 422);
  assert.equal(doneNoEvidence.code, 'COMPLETION_VERIFICATION_EVIDENCE_REQUIRED');

  // Transitioning to DONE with explicit verification evidence succeeds
  const doneWithEvidence = await transitionWorkItem(db, {
    organizationId: 'org_alpha',
    workItemId: captured.workItem.id,
    toStatus: 'DONE',
    verificationEvidence: 'Testes de integração 100% aprovados em PostgreSQL efêmero',
  });
  assert.equal(doneWithEvidence.ok, true);
  assert.equal(doneWithEvidence.workItem.status, 'DONE');

  // Verify that Outbox events have f1aExternalExecutionBlocked: true
  const lastOutbox = db._state.outbox[db._state.outbox.length - 1];
  assert.equal(lastOutbox.payload.f1aExternalExecutionBlocked, true);
});
