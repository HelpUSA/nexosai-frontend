// F1A Deterministic & Explainable Priority Engine + WorkItem State Machine

import { assertF1AScopeAllowed, EXECUTIVE_QUOTAS } from './executive-gate.mjs';
import { redactSecrets } from './executive-security.mjs';

const CATEGORY_IMPACT_BONUS = Object.freeze({
  SALES_REVENUE: 20,
  CLIENT_SUCCESS: 18,
  OPERATIONS_INFRA: 15,
  DEVELOPMENT: 10,
  IDEA_INNOVATION: 5,
});

const SEVERITY_BLOCKER_SCORE = Object.freeze({
  CRITICAL: 100,
  WARNING: 75,
  ATTENTION: 55,
  OPPORTUNITY: 40,
  INFO: 20,
});

export const ALLOWED_WORK_ITEM_TRANSITIONS = Object.freeze({
  BACKLOG: ['TRIAGE', 'TODAY', 'IN_PROGRESS', 'SNOOZED', 'CANCELED'],
  TRIAGE: ['BACKLOG', 'TODAY', 'IN_PROGRESS', 'WAITING_EXTERNAL', 'WAITING_APPROVAL', 'SNOOZED', 'DONE', 'CANCELED'],
  TODAY: ['IN_PROGRESS', 'WAITING_EXTERNAL', 'WAITING_APPROVAL', 'SNOOZED', 'DONE', 'BACKLOG', 'CANCELED'],
  IN_PROGRESS: ['TODAY', 'WAITING_EXTERNAL', 'WAITING_APPROVAL', 'SNOOZED', 'DONE', 'CANCELED'],
  WAITING_EXTERNAL: ['TODAY', 'IN_PROGRESS', 'SNOOZED', 'DONE', 'CANCELED'],
  WAITING_APPROVAL: ['TODAY', 'IN_PROGRESS', 'WAITING_EXTERNAL', 'SNOOZED', 'DONE', 'CANCELED'],
  SNOOZED: ['TRIAGE', 'TODAY', 'IN_PROGRESS', 'BACKLOG', 'CANCELED'],
  DONE: ['TRIAGE', 'IN_PROGRESS'],
  CANCELED: ['BACKLOG', 'TRIAGE'],
});

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

export function scoreToPriorityBand(score) {
  if (score >= 85) return 'P0_CRITICAL';
  if (score >= 65) return 'P1_HIGH';
  if (score >= 40) return 'P2_MEDIUM';
  return 'P3_LOW';
}

export function computeWorkItemPriority(input = {}, now = new Date()) {
  const refNow = now instanceof Date ? now : new Date(now);
  const nowMs = refNow.getTime();

  // 1. Urgency (U: 0..100, weight 0.35)
  let urgency = 45;
  let urgencyLabel = 'Sem prazo crítico';
  if (input.dueAt) {
    const dueMs = new Date(input.dueAt).getTime();
    if (!Number.isNaN(dueMs)) {
      const hoursUntilDue = (dueMs - nowMs) / (1000 * 60 * 60);
      if (hoursUntilDue <= 0) {
        urgency = 100;
        urgencyLabel = 'SLA vencido/atrasado';
      } else if (hoursUntilDue <= 24) {
        urgency = 95;
        urgencyLabel = 'Vence em <=24h';
      } else if (hoursUntilDue <= 72) {
        urgency = 80;
        urgencyLabel = 'Vence em <=72h';
      } else if (hoursUntilDue <= 168) {
        urgency = 65;
        urgencyLabel = 'Vence em <=7d';
      } else {
        urgency = 40;
        urgencyLabel = 'Prazo >7d';
      }
    }
  }

  // 2. Business/Portfolio Impact (I: 0..100, weight 0.30)
  const basePortfolioWeight =
    typeof input.portfolioPriorityWeight === 'number'
      ? clamp(input.portfolioPriorityWeight, 0, 100)
      : 55;
  const categoryBonus = CATEGORY_IMPACT_BONUS[input.category] ?? 10;
  const impact = clamp(basePortfolioWeight + categoryBonus, 0, 100);

  // 3. Staleness / Inactivity (S: 0..100, weight 0.20)
  const staleAfterDays = Math.max(1, Number(input.staleAfterDays) || 5);
  let daysSinceTouch = 0;
  if (input.lastTouchedAt) {
    const touchMs = new Date(input.lastTouchedAt).getTime();
    if (!Number.isNaN(touchMs) && nowMs > touchMs) {
      daysSinceTouch = (nowMs - touchMs) / (1000 * 60 * 60 * 24);
    }
  }
  const stalenessRatio = daysSinceTouch / staleAfterDays;
  const staleness = clamp(Math.round(stalenessRatio * 70), 0, 100);

  // 4. Blocker / Signal Severity (B: 0..100, weight 0.15)
  const severityKey = String(input.highestSignalSeverity || 'INFO').toUpperCase();
  const baseSeverity = SEVERITY_BLOCKER_SCORE[severityKey] ?? 20;
  const blocker = clamp(input.isBlocking ? Math.max(baseSeverity, 90) : baseSeverity, 0, 100);

  // 5. Snooze / Anti-Fatigue Penalty (F: 0..100, weight -0.10)
  const snoozeCount = Math.max(0, Number(input.snoozeCount) || 0);
  let activeSnoozePenalty = 0;
  if (input.snoozedUntil) {
    const snoozeMs = new Date(input.snoozedUntil).getTime();
    if (!Number.isNaN(snoozeMs) && snoozeMs > nowMs) {
      activeSnoozePenalty = 60;
    }
  }
  const fatiguePenalty = clamp(snoozeCount * 15 + activeSnoozePenalty, 0, 100);

  const weighted =
    0.35 * urgency +
    0.30 * impact +
    0.20 * staleness +
    0.15 * blocker -
    0.10 * fatiguePenalty;

  const priorityScore = Number(clamp(weighted, 0, 100).toFixed(2));
  const priorityBand = scoreToPriorityBand(priorityScore);

  const priorityReason = [
    `[Score ${priorityScore.toFixed(1)} -> ${priorityBand}]`,
    `Urgência(${urgencyLabel}: ${urgency}*0.35=+${(urgency * 0.35).toFixed(1)})`,
    `Impacto(${input.category || 'DEVELOPMENT'}/peso ${basePortfolioWeight}: ${impact}*0.30=+${(impact * 0.30).toFixed(1)})`,
    `Inatividade(${daysSinceTouch.toFixed(1)}d/${staleAfterDays}d: ${staleness}*0.20=+${(staleness * 0.20).toFixed(1)})`,
    `Severidade(${severityKey}: ${blocker}*0.15=+${(blocker * 0.15).toFixed(1)})`,
    fatiguePenalty > 0
      ? `Fadiga/Snooze(${snoozeCount}x: -${(fatiguePenalty * 0.10).toFixed(1)})`
      : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return Object.freeze({
    priorityScore,
    priorityBand,
    priorityReason,
    breakdown: Object.freeze({
      urgency,
      impact,
      staleness,
      blocker,
      fatiguePenalty,
    }),
  });
}

export function validateWorkItemTransition({
  fromStatus,
  toStatus,
  snoozedUntil = null,
  now = new Date(),
}) {
  const allowed = ALLOWED_WORK_ITEM_TRANSITIONS[fromStatus];
  if (!allowed || !allowed.includes(toStatus)) {
    return Object.freeze({
      ok: false,
      status: 422,
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot transition WorkItem from ${fromStatus} to ${toStatus}`,
    });
  }

  if (toStatus === 'SNOOZED') {
    if (!snoozedUntil) {
      return Object.freeze({
        ok: false,
        status: 400,
        code: 'SNOOZE_UNTIL_REQUIRED',
      });
    }
    const snoozeDate = new Date(snoozedUntil);
    const refNow = now instanceof Date ? now : new Date(now);
    if (Number.isNaN(snoozeDate.getTime()) || snoozeDate.getTime() <= refNow.getTime()) {
      return Object.freeze({
        ok: false,
        status: 400,
        code: 'SNOOZE_UNTIL_MUST_BE_FUTURE',
      });
    }
  }

  return Object.freeze({ ok: true, status: 200, code: 'VALID_TRANSITION' });
}

export async function createCapturedWorkItem(
  tx,
  {
    organizationId,
    userId = null,
    portfolioItemId = null,
    title,
    description = null,
    nextAction = null,
    category = 'DEVELOPMENT',
    privacyScope = 'ORG_SHARED',
    status = 'TRIAGE',
    dueAt = null,
    staleAfterDays = 5,
    highestSignalSeverity = 'INFO',
    isBlocking = false,
    now = new Date(),
  }
) {
  const scopeCheck = assertF1AScopeAllowed({ privacyScope, category });
  if (!scopeCheck.ok) return scopeCheck;

  const cleanTitle = redactSecrets(String(title || '').trim());
  if (!cleanTitle || cleanTitle.length < 3 || cleanTitle.length > 240) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_WORK_ITEM_TITLE' });
  }

  if (!['BACKLOG', 'TRIAGE', 'TODAY', 'IN_PROGRESS'].includes(status)) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_INITIAL_STATUS' });
  }

  // Quota check: max 2000 open work items per org
  if (typeof tx?.workItem?.count === 'function') {
    const openCount = await tx.workItem.count({
      where: {
        organizationId,
        status: { notIn: ['DONE', 'CANCELED'] },
      },
    });
    if (openCount >= EXECUTIVE_QUOTAS.MAX_OPEN_WORK_ITEMS_PER_ORG) {
      return Object.freeze({
        ok: false,
        status: 429,
        code: 'OPEN_WORK_ITEMS_QUOTA_EXCEEDED',
      });
    }
  }

  let portfolioWeight = 55;
  if (portfolioItemId && typeof tx?.portfolioItem?.findFirst === 'function') {
    const pItem = await tx.portfolioItem.findFirst({
      where: { id: portfolioItemId, organizationId },
      select: {
        id: true,
        organizationId: true,
        priorityWeight: true,
        privacyScope: true,
        isProactiveEnabled: true,
      },
    });
    if (!pItem || pItem.organizationId !== organizationId) {
      return Object.freeze({ ok: false, status: 404, code: 'PORTFOLIO_ITEM_NOT_FOUND' });
    }
    if (pItem.privacyScope === 'PERSONAL_VAULT') {
      return Object.freeze({ ok: false, status: 403, code: 'PERSONAL_VAULT_NOT_ENABLED_IN_F1' });
    }
    if (pItem.isProactiveEnabled === false) {
      return Object.freeze({ ok: false, status: 403, code: 'PORTFOLIO_PROACTIVE_DISABLED' });
    }
    portfolioWeight = pItem.priorityWeight;
  }

  const refNow = now instanceof Date ? now : new Date(now);
  const priority = computeWorkItemPriority(
    {
      dueAt,
      portfolioPriorityWeight: portfolioWeight,
      category,
      staleAfterDays,
      lastTouchedAt: refNow,
      highestSignalSeverity,
      isBlocking,
      snoozeCount: 0,
    },
    refNow
  );

  const workItem = await tx.workItem.create({
    data: {
      organizationId,
      portfolioItemId: portfolioItemId || null,
      createdByUserId: userId || null,
      ownerUserId: userId || null,
      category,
      status,
      privacyScope,
      title: cleanTitle,
      description: description ? redactSecrets(String(description).trim()) : null,
      nextAction: nextAction ? redactSecrets(String(nextAction).trim()) : null,
      priorityScore: priority.priorityScore,
      priorityBand: priority.priorityBand,
      priorityReason: priority.priorityReason,
      dueAt: dueAt ? new Date(dueAt) : null,
      snoozedUntil: null,
      snoozeCount: 0,
      staleAfterDays: Math.max(1, Number(staleAfterDays) || 5),
      lastTouchedAt: refNow,
    },
  });

  await tx.workItemEvent.create({
    data: {
      organizationId,
      workItemId: workItem.id,
      actorUserId: userId || null,
      eventType: 'CREATED',
      toStatus: status,
      rationale: priority.priorityReason,
      payload: {
        priorityScore: priority.priorityScore,
        priorityBand: priority.priorityBand,
        breakdown: priority.breakdown,
      },
    },
  });

  await tx.outboxEvent.create({
    data: {
      organizationId,
      aggregateType: 'WorkItem',
      aggregateId: workItem.id,
      eventType: 'WORK_ITEM_CREATED',
      idempotencyKey: `workitem-created:${organizationId}:${workItem.id}`,
      payload: {
        workItemId: workItem.id,
        organizationId,
        status: workItem.status,
        priorityScore: workItem.priorityScore,
        priorityBand: workItem.priorityBand,
      },
    },
  });

  return Object.freeze({
    ok: true,
    status: 201,
    code: 'WORK_ITEM_CREATED',
    workItem,
    priority,
  });
}

export async function transitionWorkItem(
  tx,
  {
    organizationId,
    workItemId,
    actorUserId = null,
    toStatus,
    snoozedUntil = null,
    rationale = null,
    now = new Date(),
  }
) {
  const existing = await tx.workItem.findFirst({
    where: { id: workItemId, organizationId },
    include: {
      portfolioItem: {
        select: { priorityWeight: true },
      },
    },
  });

  if (!existing || existing.organizationId !== organizationId) {
    return Object.freeze({ ok: false, status: 404, code: 'WORK_ITEM_NOT_FOUND' });
  }

  const validation = validateWorkItemTransition({
    fromStatus: existing.status,
    toStatus,
    snoozedUntil,
    now,
  });
  if (!validation.ok) return validation;

  const refNow = now instanceof Date ? now : new Date(now);
  const currentSnoozeCount = Number(existing.snoozeCount) || 0;
  const newSnoozeCount = toStatus === 'SNOOZED' ? currentSnoozeCount + 1 : currentSnoozeCount;
  const effectiveSnoozedUntil = toStatus === 'SNOOZED' ? new Date(snoozedUntil) : null;

  const priority = computeWorkItemPriority(
    {
      dueAt: existing.dueAt,
      portfolioPriorityWeight: existing.portfolioItem?.priorityWeight ?? 55,
      category: existing.category,
      staleAfterDays: existing.staleAfterDays,
      lastTouchedAt: refNow,
      snoozeCount: newSnoozeCount,
      snoozedUntil: effectiveSnoozedUntil,
    },
    refNow
  );

  const updated = await tx.workItem.update({
    where: { id: existing.id },
    data: {
      status: toStatus,
      snoozedUntil: effectiveSnoozedUntil,
      snoozeCount: newSnoozeCount,
      priorityScore: priority.priorityScore,
      priorityBand: priority.priorityBand,
      priorityReason: priority.priorityReason,
      lastTouchedAt: refNow,
      completedAt: toStatus === 'DONE' ? refNow : existing.completedAt,
    },
  });

  const eventType =
    toStatus === 'SNOOZED'
      ? 'SNOOZED'
      : toStatus === 'DONE'
      ? 'COMPLETED'
      : 'STATUS_CHANGED';

  const event = await tx.workItemEvent.create({
    data: {
      organizationId,
      workItemId: existing.id,
      actorUserId: actorUserId || null,
      eventType,
      fromStatus: existing.status,
      toStatus,
      rationale: rationale ? redactSecrets(String(rationale).trim()) : priority.priorityReason,
      payload: {
        snoozedUntil: effectiveSnoozedUntil ? effectiveSnoozedUntil.toISOString() : null,
        priorityScore: priority.priorityScore,
        priorityBand: priority.priorityBand,
      },
    },
  });

  await tx.outboxEvent.create({
    data: {
      organizationId,
      aggregateType: 'WorkItem',
      aggregateId: existing.id,
      eventType: `WORK_ITEM_${eventType}`,
      idempotencyKey: `workitem-transition:${organizationId}:${existing.id}:${event.id}`,
      payload: {
        workItemId: existing.id,
        organizationId,
        fromStatus: existing.status,
        toStatus,
        priorityScore: priority.priorityScore,
      },
    },
  });

  return Object.freeze({
    ok: true,
    status: 200,
    code: 'WORK_ITEM_TRANSITIONED',
    workItem: updated,
    priority,
  });
}
