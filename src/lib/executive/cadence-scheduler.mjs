// F1A Cadence Scheduler & "Meu Dia + Radar" Snapshot Engine
// Pure read-only snapshot generation (NO mutation on GET).
// Dedicated transactional unsnooze mutator for background worker / POST jobs.
// Implements Master SuperAdmin D3 Approved Defaults in America/Fortaleza.

import { isExecutiveGlobalEnabled } from './executive-gate.mjs';

export const APPROVED_D3_CADENCE_DEFAULTS = Object.freeze({
  timezone: 'America/Fortaleza',
  morningBriefingTime: '08:00',
  afternoonRadarTime: '13:00',
  weeklyReviewDay: 1, // Monday (Segunda-feira)
  weeklyReviewTime: '08:30',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  criticalAlertThreshold: 85,
  cooldownHours: 12,
  maxDailyCriticalAlerts: 3,
  jobsEnabled: false,
});

const WEEKDAY_MAP = Object.freeze({
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
});

function parseHhMmToMinutes(hhmm) {
  const [hStr, mStr] = String(hhmm || '00:00').split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`INVALID_HHMM_TIME:${hhmm}`);
  }
  return h * 60 + m;
}

export function resolveTenantCadenceConfig(overrides = {}) {
  const merged = {
    ...APPROVED_D3_CADENCE_DEFAULTS,
    ...(overrides && typeof overrides === 'object' ? overrides : {}),
  };
  // Validate IANA timezone early
  new Intl.DateTimeFormat('en-US', { timeZone: merged.timezone });
  return Object.freeze(merged);
}

export function getLocalTimeParts(date = new Date(), timeZone = APPROVED_D3_CADENCE_DEFAULTS.timezone) {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(d);
  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  const hour = Number(map.hour || 0);
  const minute = Number(map.minute || 0);
  const hhmm = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const dayOfWeek = WEEKDAY_MAP[map.weekday] ?? 0;
  const dateKey = `${map.year}-${map.month}-${map.day}`;

  return Object.freeze({
    timeZone,
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekday: map.weekday,
    dayOfWeek,
    hour,
    minute,
    hhmm,
    minutesOfDay: hour * 60 + minute,
    dateKey,
  });
}

export function isWithinQuietHours(date = new Date(), config = {}) {
  const cfg = resolveTenantCadenceConfig(config);
  const local = getLocalTimeParts(date, cfg.timezone);
  const startMin = parseHhMmToMinutes(cfg.quietHoursStart);
  const endMin = parseHhMmToMinutes(cfg.quietHoursEnd);
  const curMin = local.minutesOfDay;

  if (startMin > endMin) {
    return curMin >= startMin || curMin < endMin;
  }
  return curMin >= startMin && curMin < endMin;
}

/**
 * Evaluates cadence slot using true UTC instant boundaries.
 * Does NOT construct bogus timestamps with Date.UTC from local civil wall-clock parts.
 */
export function evaluateCadenceSlot(date = new Date(), config = {}) {
  const cfg = resolveTenantCadenceConfig(config);
  const refDate = date instanceof Date ? date : new Date(date);
  const local = getLocalTimeParts(refDate, cfg.timezone);
  const quiet = isWithinQuietHours(refDate, cfg);

  const morningMin = parseHhMmToMinutes(cfg.morningBriefingTime);
  const radarMin = parseHhMmToMinutes(cfg.afternoonRadarTime);
  const weeklyMin = parseHhMmToMinutes(cfg.weeklyReviewTime);
  const curMin = local.minutesOfDay;

  let matchedCadence = null;
  if (
    local.dayOfWeek === cfg.weeklyReviewDay &&
    curMin >= weeklyMin &&
    curMin < weeklyMin + 30
  ) {
    matchedCadence = 'WEEKLY_REVIEW';
  } else if (curMin >= morningMin && curMin < morningMin + 30) {
    matchedCadence = 'MORNING_BRIEFING';
  } else if (curMin >= radarMin && curMin < radarMin + 30) {
    matchedCadence = 'AFTERNOON_RADAR';
  }

  // True UTC 30-minute block boundaries based on actual unix epoch
  const slotDurationMs = 30 * 60 * 1000;
  const trueEpochMs = refDate.getTime();
  const windowStartEpoch = Math.floor(trueEpochMs / slotDurationMs) * slotDurationMs;
  const slotWindowStart = new Date(windowStartEpoch);
  const slotWindowEnd = new Date(windowStartEpoch + slotDurationMs);

  // Discrete slot identifier combining IANA timezone, local civil date, cadence, and 30m slot index
  const slotIndex = Math.floor(curMin / 30);
  const slotKey = `${cfg.timezone}#${local.dateKey}#${matchedCadence || 'AD_HOC'}#slot_${slotIndex}`;

  return Object.freeze({
    timezone: cfg.timezone,
    localDateKey: local.dateKey,
    localHhMm: local.hhmm,
    dayOfWeek: local.dayOfWeek,
    isQuietHours: quiet,
    matchedCadence,
    slotKey,
    windowStart: slotWindowStart,
    windowEnd: slotWindowEnd,
    config: cfg,
  });
}

/**
 * Dedicated transactional mutation to auto-unsnooze expired items.
 * Emits audit events and outbox events for every unsnoozed item.
 * Must ONLY be called by background jobs or dedicated POST endpoints, NEVER inside GET!
 */
export async function executeAutoUnsnoozeMutation(tx, { organizationId, now = new Date() }) {
  const refNow = now instanceof Date ? now : new Date(now);
  if (typeof tx?.workItem?.findMany !== 'function' || typeof tx?.workItem?.update !== 'function') {
    return Object.freeze({ ok: true, count: 0 });
  }

  const expiredSnoozes = await tx.workItem.findMany({
    where: {
      organizationId,
      status: 'SNOOZED',
      snoozedUntil: { lte: refNow },
    },
    select: { id: true, title: true, priorityScore: true },
  });

  for (const item of expiredSnoozes) {
    await tx.workItem.update({
      where: { id: item.id },
      data: {
        status: 'TODAY',
        snoozedUntil: null,
        lastTouchedAt: refNow,
      },
    });

    if (typeof tx?.workItemEvent?.create === 'function') {
      await tx.workItemEvent.create({
        data: {
          organizationId,
          workItemId: item.id,
          eventType: 'UNSNOOZED',
          fromStatus: 'SNOOZED',
          toStatus: 'TODAY',
          rationale: 'Prazo de snooze expirado; retornado automaticamente para TODAY',
        },
      });
    }

    if (typeof tx?.outboxEvent?.create === 'function') {
      await tx.outboxEvent.create({
        data: {
          organizationId,
          aggregateType: 'WorkItem',
          aggregateId: item.id,
          eventType: 'WORK_ITEM_UNSNOOZED',
          idempotencyKey: `auto-unsnooze:${organizationId}:${item.id}:${refNow.toISOString().slice(0, 13)}`,
          payload: { workItemId: item.id, organizationId, status: 'TODAY' },
        },
      });
    }
  }

  return Object.freeze({ ok: true, count: expiredSnoozes.length });
}

/**
 * Pure read-only snapshot generation.
 * STRICTLY READ-ONLY: zero inserts, zero updates, zero side-effects. Safe for HTTP GET.
 */
export async function buildMeuDiaAndRadarSnapshot(
  tx,
  { organizationId, now = new Date(), tenantCadenceConfig = {} }
) {
  const refNow = now instanceof Date ? now : new Date(now);
  const cadenceEval = evaluateCadenceSlot(refNow, tenantCadenceConfig);

  const rawPortfolioItems =
    typeof tx?.portfolioItem?.findMany === 'function'
      ? await tx.portfolioItem.findMany({
          where: {
            organizationId,
            privacyScope: { in: ['ORG_SHARED', 'EXECUTIVE_ONLY'] },
          },
          orderBy: [{ priorityWeight: 'desc' }, { name: 'asc' }],
        })
      : [];

  // Query open items (considers items whose snooze expired as effectively active for display without mutating DB)
  const openWorkItems =
    typeof tx?.workItem?.findMany === 'function'
      ? await tx.workItem.findMany({
          where: {
            organizationId,
            privacyScope: { in: ['ORG_SHARED', 'EXECUTIVE_ONLY'] },
            OR: [
              { status: { notIn: ['DONE', 'CANCELED', 'SNOOZED'] } },
              { status: 'SNOOZED', snoozedUntil: { lte: refNow } },
            ],
          },
          orderBy: [{ priorityScore: 'desc' }, { updatedAt: 'desc' }],
          take: 50,
          include: {
            portfolioItem: {
              select: { id: true, slug: true, name: true, type: true, lifecycle: true },
            },
          },
        })
      : [];

  const recentSignals =
    typeof tx?.signal?.findMany === 'function'
      ? await tx.signal.findMany({
          where: {
            organizationId,
            privacyScope: { in: ['ORG_SHARED', 'EXECUTIVE_ONLY'] },
            status: { in: ['NEW', 'LINKED_TO_WORK_ITEM'] },
          },
          orderBy: [{ occurredAt: 'desc' }],
          take: 20,
        })
      : [];

  // Radar de Projetos Sem Movimento
  const stalePortfolioRadar = rawPortfolioItems
    .filter((item) => item.isProactiveEnabled !== false && item.lifecycle !== 'ARCHIVED')
    .map((item) => {
      const thresholdDays = Math.max(1, Number(item.staleAfterDays) || 7);
      const refTouch = item.lastActivityAt || item.updatedAt || item.createdAt;
      const daysIdle = refTouch
        ? (refNow.getTime() - new Date(refTouch).getTime()) / (1000 * 60 * 60 * 24)
        : thresholdDays + 1;
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        type: item.type,
        lifecycle: item.lifecycle,
        priorityWeight: item.priorityWeight,
        staleAfterDays: thresholdDays,
        daysIdle: Number(Math.max(0, daysIdle).toFixed(1)),
        isStale: daysIdle >= thresholdDays,
      };
    })
    .filter((item) => item.isStale);

  const topPriorities = openWorkItems.slice(0, 5);
  const waitingExternal = openWorkItems.filter((w) => w.status === 'WAITING_EXTERNAL');
  const triageQueue = openWorkItems.filter((w) => w.status === 'TRIAGE');
  const criticalItems = openWorkItems.filter(
    (w) => w.priorityScore >= cadenceEval.config.criticalAlertThreshold
  );

  return Object.freeze({
    organizationId,
    generatedAt: refNow.toISOString(),
    cadence: cadenceEval,
    topPriorities,
    triageQueue,
    waitingExternal,
    stalePortfolioRadar,
    recentSignals,
    metrics: Object.freeze({
      totalPortfolioItems: rawPortfolioItems.length,
      stalePortfolioCount: stalePortfolioRadar.length,
      openWorkItemsCount: openWorkItems.length,
      criticalWorkItemsCount: criticalItems.length,
      triageCount: triageQueue.length,
      waitingExternalCount: waitingExternal.length,
      activeSignalsCount: recentSignals.length,
    }),
  });
}

export async function runScheduledBriefingJob(
  tx,
  {
    organizationId,
    cadenceType = null,
    now = new Date(),
    env = process.env,
    tenantCadenceConfig = {},
    forceRunForTest = false,
  }
) {
  if (!isExecutiveGlobalEnabled(env)) {
    return Object.freeze({
      ok: false,
      status: 403,
      code: 'EXECUTIVE_MODULE_DISABLED',
    });
  }

  const cfg = resolveTenantCadenceConfig(tenantCadenceConfig);
  if (!forceRunForTest && cfg.jobsEnabled !== true) {
    return Object.freeze({
      ok: false,
      status: 403,
      code: 'BACKGROUND_JOBS_DISABLED_IN_F1A',
    });
  }

  const refNow = now instanceof Date ? now : new Date(now);
  const slotEval = evaluateCadenceSlot(refNow, cfg);
  const effectiveCadence = cadenceType || slotEval.matchedCadence || 'AD_HOC';

  // Check idempotency first using discrete window boundaries
  if (typeof tx?.briefingRun?.findFirst === 'function') {
    const existing = await tx.briefingRun.findFirst({
      where: {
        organizationId,
        cadenceType: effectiveCadence,
        windowStart: slotEval.windowStart,
        windowEnd: slotEval.windowEnd,
      },
    });
    if (existing) {
      return Object.freeze({
        ok: true,
        status: 200,
        code: 'BRIEFING_ALREADY_GENERATED_IDEMPOTENT',
        deduplicated: true,
        briefingRun: existing,
      });
    }
  }

  // Quiet hours enforcement
  if (slotEval.isQuietHours) {
    const suppressedRun = await tx.briefingRun.create({
      data: {
        organizationId,
        cadenceType: effectiveCadence,
        deliveryStatus: 'SUPPRESSED_QUIET_HOURS',
        timezone: cfg.timezone,
        windowStart: slotEval.windowStart,
        windowEnd: slotEval.windowEnd,
        headline: `[Silêncio ${cfg.quietHoursStart}–${cfg.quietHoursEnd} ${cfg.timezone}] Briefing suprimido`,
        summaryMarkdown: `Execução proativa suprimida durante janela de silêncio (${slotEval.localHhMm} ${cfg.timezone}).`,
        topWorkItemIds: [],
        stalePortfolioIds: [],
        pendingDecisionIds: [],
        metricsSnapshot: { suppressedByQuietHours: true, slotKey: slotEval.slotKey },
        generatedAt: refNow,
      },
    });
    return Object.freeze({
      ok: true,
      status: 200,
      code: 'BRIEFING_SUPPRESSED_QUIET_HOURS',
      deduplicated: false,
      briefingRun: suppressedRun,
    });
  }

  // Auto-unsnooze during active background job
  await executeAutoUnsnoozeMutation(tx, { organizationId, now: refNow });

  // Critical alerts daily cap
  if (effectiveCadence === 'CRITICAL_ALERT' && typeof tx?.briefingRun?.count === 'function') {
    const startOfDay = new Date(refNow.getTime() - 24 * 60 * 60 * 1000);
    const recentAlerts = await tx.briefingRun.count({
      where: {
        organizationId,
        cadenceType: 'CRITICAL_ALERT',
        generatedAt: { gte: startOfDay },
      },
    });
    if (recentAlerts >= cfg.maxDailyCriticalAlerts) {
      return Object.freeze({
        ok: false,
        status: 429,
        code: 'DAILY_CRITICAL_ALERT_CAP_REACHED',
      });
    }
  }

  const snapshot = await buildMeuDiaAndRadarSnapshot(tx, {
    organizationId,
    now: refNow,
    tenantCadenceConfig: cfg,
  });

  const headline = `[${effectiveCadence} ${slotEval.localHhMm} ${cfg.timezone}] ${snapshot.metrics.criticalWorkItemsCount} P0 Críticos | ${snapshot.metrics.openWorkItemsCount} Ativos | ${snapshot.metrics.stalePortfolioCount} Projetos Sem Movimento`;
  const summaryLines = [
    `# ${headline}`,
    `- **Fuso Horário:** \`${cfg.timezone}\` (${slotEval.localDateKey} ${slotEval.localHhMm})`,
    `- **Slot Key:** \`${slotEval.slotKey}\``,
    `- **Top Prioridades:** ${snapshot.topPriorities.map((w) => `${w.title} (${w.priorityBand}: ${w.priorityScore})`).join('; ') || 'Nenhuma pendência crítica'}`,
    `- **Radar Sem Movimento:** ${snapshot.stalePortfolioRadar.map((p) => `${p.name} (${p.daysIdle}d sem atividade)`).join('; ') || 'Portfólio em dia'}`,
  ];

  const briefingRun = await tx.briefingRun.create({
    data: {
      organizationId,
      cadenceType: effectiveCadence,
      deliveryStatus: 'GENERATED',
      timezone: cfg.timezone,
      windowStart: slotEval.windowStart,
      windowEnd: slotEval.windowEnd,
      headline,
      summaryMarkdown: summaryLines.join('\n'),
      topWorkItemIds: snapshot.topPriorities.map((w) => w.id),
      stalePortfolioIds: snapshot.stalePortfolioRadar.map((p) => p.id),
      pendingDecisionIds: [],
      metricsSnapshot: snapshot.metrics,
      generatedAt: refNow,
    },
  });

  return Object.freeze({
    ok: true,
    status: 201,
    code: 'BRIEFING_GENERATED',
    deduplicated: false,
    briefingRun,
    snapshot,
  });
}
