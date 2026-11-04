// F1A Scoped Read-Only Connectors (GitHub & Vercel) + Persistent Signal Deduplication
// Requires unforgeable internal provenance symbol to ingest GITHUB/VERCEL signals.
// External clients are restricted to MANUAL source type only.

import { assertF1AScopeAllowed, EXECUTIVE_QUOTAS } from './executive-gate.mjs';
import {
  computeSignalDedupHash,
  redactSecrets,
  sanitizeExternalContent,
  validateStrictIdentifier,
  validateSafeSourceUrl,
  validateAndSanitizeMetadata,
  INTERNAL_CONNECTOR_PROVENANCE_TOKEN,
} from './executive-security.mjs';

const REPO_FULL_NAME_RX = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const VERCEL_PROJECT_ID_RX = /^[A-Za-z0-9_.-]{2,120}$/;

export function assertReadOnlyHttpMethod(method = 'GET') {
  const upper = String(method || 'GET').trim().toUpperCase();
  if (upper !== 'GET' && upper !== 'HEAD') {
    return Object.freeze({
      ok: false,
      status: 403,
      code: 'EXTERNAL_WRITE_METHOD_PROHIBITED_IN_F1A',
    });
  }
  return Object.freeze({ ok: true, status: 200, code: 'READ_ONLY_METHOD_VERIFIED' });
}

export async function ingestExecutiveSignal(
  tx,
  {
    organizationId,
    portfolioItemId = null,
    sourceType = 'MANUAL',
    externalId,
    severity = 'INFO',
    privacyScope = 'ORG_SHARED',
    title,
    summary = '',
    sourceUrl = null,
    rawMetadata = null,
    occurredAt = null,
    actorUserId = null,
    provenanceToken = null,
    now = new Date(),
  }
) {
  const scopeCheck = assertF1AScopeAllowed({ privacyScope, sourceType });
  if (!scopeCheck.ok) return scopeCheck;

  // Strict Anti-Spoofing: GITHUB, VERCEL, and INTERNAL_AUDIT require unforgeable internal provenance token
  if (['GITHUB', 'VERCEL', 'INTERNAL_AUDIT'].includes(sourceType)) {
    if (provenanceToken !== INTERNAL_CONNECTOR_PROVENANCE_TOKEN) {
      return Object.freeze({
        ok: false,
        status: 403,
        code: 'CONNECTOR_SOURCE_SPOOFING_FORBIDDEN',
        message: 'External callers cannot forge GITHUB or VERCEL signals directly via manual endpoint',
      });
    }
  }

  // Validate strict format of externalId
  const idCheck = validateStrictIdentifier(externalId, { minLen: 1, maxLen: 160 });
  if (!idCheck.ok) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_EXTERNAL_ID_FORMAT' });
  }
  const cleanExternalId = idCheck.value;

  const cleanTitle = sanitizeExternalContent(title, {
    maxChars: 240,
    wrapDelimiter: false,
  });
  if (!cleanTitle.sanitizedText || cleanTitle.sanitizedText.length < 2) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_SIGNAL_TITLE' });
  }

  let requiredUrlPrefix = null;
  if (portfolioItemId && typeof tx?.portfolioItem?.findFirst === 'function') {
    const pItem = await tx.portfolioItem.findFirst({
      where: { id: portfolioItemId, organizationId },
      select: {
        id: true,
        organizationId: true,
        privacyScope: true,
        isProactiveEnabled: true,
        repoFullName: true,
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
    if (sourceType === 'GITHUB' && pItem.repoFullName) {
      requiredUrlPrefix = `https://github.com/${pItem.repoFullName}`;
    }
  }

  // Validate safe HTTPS sourceUrl without credentials, query tokens or hashes
  const urlCheck = validateSafeSourceUrl(sourceUrl, { requiredOriginPrefix: requiredUrlPrefix });
  if (!urlCheck.ok) {
    return urlCheck;
  }
  const safeSourceUrl = urlCheck.url;

  // Validate structured metadata
  const metaCheck = validateAndSanitizeMetadata(rawMetadata);
  if (!metaCheck.ok) {
    return metaCheck;
  }
  const safeMetadata = metaCheck.metadata;

  const dedupHash = computeSignalDedupHash({
    organizationId,
    sourceType,
    externalId: cleanExternalId,
  });

  // 1. Persistent Deduplication Check
  if (typeof tx?.signal?.findFirst === 'function') {
    const existing = await tx.signal.findFirst({
      where: {
        organizationId,
        sourceType,
        externalId: cleanExternalId,
      },
    });
    if (existing) {
      return Object.freeze({
        ok: true,
        status: 200,
        code: 'SIGNAL_DEDUPLICATED',
        deduplicated: true,
        signal: existing,
      });
    }
  }

  const refNow = now instanceof Date ? now : new Date(now);

  // 2. Quota Enforcement (120 signals/org/hour and 10,000 active signals/org)
  if (typeof tx?.signal?.count === 'function') {
    const oneHourAgo = new Date(refNow.getTime() - 60 * 60 * 1000);
    const hourlyCount = await tx.signal.count({
      where: {
        organizationId,
        ingestedAt: { gte: oneHourAgo },
      },
    });
    if (hourlyCount >= EXECUTIVE_QUOTAS.MAX_SIGNALS_PER_ORG_HOUR) {
      return Object.freeze({
        ok: false,
        status: 429,
        code: 'SIGNAL_HOURLY_QUOTA_EXCEEDED',
      });
    }

    const activeCount = await tx.signal.count({
      where: {
        organizationId,
        status: { in: ['NEW', 'LINKED_TO_WORK_ITEM'] },
      },
    });
    if (activeCount >= EXECUTIVE_QUOTAS.MAX_ACTIVE_SIGNALS_PER_ORG) {
      return Object.freeze({
        ok: false,
        status: 429,
        code: 'ACTIVE_SIGNALS_QUOTA_EXCEEDED',
      });
    }
  }

  const sanitizedSummary = sanitizeExternalContent(summary || '', {
    maxChars: 2000,
    wrapDelimiter: true,
  });

  const signal = await tx.signal.create({
    data: {
      organizationId,
      portfolioItemId: portfolioItemId || null,
      sourceType,
      externalId: cleanExternalId,
      dedupHash,
      severity,
      status: 'NEW',
      privacyScope,
      untrustedContent: true,
      title: cleanTitle.sanitizedText,
      summary: sanitizedSummary.wrappedContent,
      sourceUrl: safeSourceUrl,
      rawMetadata: {
        ...safeMetadata,
        actorUserId: actorUserId || null,
        injectionAttemptDetected:
          cleanTitle.injectionAttemptDetected || sanitizedSummary.injectionAttemptDetected,
        truncated: cleanTitle.truncated || sanitizedSummary.truncated,
      },
      occurredAt: occurredAt ? new Date(occurredAt) : refNow,
      ingestedAt: refNow,
    },
  });

  if (portfolioItemId && typeof tx?.portfolioItem?.update === 'function') {
    await tx.portfolioItem.update({
      where: { id: portfolioItemId },
      data: { lastActivityAt: refNow },
    });
  }

  return Object.freeze({
    ok: true,
    status: 201,
    code: 'SIGNAL_INGESTED',
    deduplicated: false,
    signal,
  });
}

export async function pollGitHubRepositorySignalsReadOnly(
  tx,
  {
    organizationId,
    portfolioItem,
    token = null,
    fetchImpl = globalThis.fetch,
    now = new Date(),
  }
) {
  if (!portfolioItem || portfolioItem.organizationId !== organizationId) {
    return Object.freeze({ ok: false, status: 404, code: 'PORTFOLIO_ITEM_NOT_FOUND' });
  }
  if (portfolioItem.isProactiveEnabled === false) {
    return Object.freeze({ ok: false, status: 403, code: 'PORTFOLIO_PROACTIVE_DISABLED' });
  }
  const repoFullName = String(portfolioItem.repoFullName || '').trim();
  if (!REPO_FULL_NAME_RX.test(repoFullName)) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_GITHUB_REPO_SCOPE' });
  }

  const refNow = now instanceof Date ? now : new Date(now);
  const existingCursor = await tx.integrationCursor.findFirst({
    where: {
      organizationId,
      sourceType: 'GITHUB',
      externalScopeKey: repoFullName,
    },
  });

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (existingCursor?.etag) {
    headers['If-None-Match'] = existingCursor.etag;
  }

  const url = `https://api.github.com/repos/${repoFullName}/issues?state=open&per_page=10&sort=updated&direction=desc`;

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 304) {
      const cursor = await tx.integrationCursor.upsert({
        where: {
          organizationId_sourceType_externalScopeKey: {
            organizationId,
            sourceType: 'GITHUB',
            externalScopeKey: repoFullName,
          },
        },
        update: {
          lastSyncAt: refNow,
          lastSuccessAt: refNow,
          consecutiveErrors: 0,
        },
        create: {
          organizationId,
          portfolioItemId: portfolioItem.id,
          sourceType: 'GITHUB',
          externalScopeKey: repoFullName,
          etag: existingCursor?.etag || null,
          scopesGranted: 'repo:read,issues:read,pull_requests:read',
          lastSyncAt: refNow,
          lastSuccessAt: refNow,
        },
      });
      return Object.freeze({
        ok: true,
        status: 200,
        code: 'GITHUB_SYNC_NOT_MODIFIED',
        ingestedCount: 0,
        deduplicatedCount: 0,
        cursor,
      });
    }

    if (!response.ok) {
      const safeError = redactSecrets(`GitHub HTTP ${response.status}`);
      await tx.integrationCursor.upsert({
        where: {
          organizationId_sourceType_externalScopeKey: {
            organizationId,
            sourceType: 'GITHUB',
            externalScopeKey: repoFullName,
          },
        },
        update: {
          lastSyncAt: refNow,
          lastErrorCode: `HTTP_${response.status}`,
          lastErrorMessage: safeError,
          consecutiveErrors: (existingCursor?.consecutiveErrors || 0) + 1,
        },
        create: {
          organizationId,
          portfolioItemId: portfolioItem.id,
          sourceType: 'GITHUB',
          externalScopeKey: repoFullName,
          lastSyncAt: refNow,
          lastErrorCode: `HTTP_${response.status}`,
          lastErrorMessage: safeError,
          consecutiveErrors: 1,
        },
      });
      return Object.freeze({
        ok: false,
        status: 502,
        code: 'GITHUB_READONLY_FETCH_FAILED',
      });
    }

    const items = await response.json();
    const list = Array.isArray(items) ? items : [];
    let ingestedCount = 0;
    let deduplicatedCount = 0;

    for (const item of list) {
      const kind = item.pull_request ? 'PR' : 'ISSUE';
      const extId = `${repoFullName}#${item.number}`;
      const labels = Array.isArray(item.labels)
        ? item.labels.map((l) => (typeof l === 'string' ? l : l?.name)).filter(Boolean)
        : [];
      const severity = labels.some((l) => /critical|security|blocker|p0/i.test(l))
        ? 'CRITICAL'
        : labels.some((l) => /bug|high|p1/i.test(l))
        ? 'WARNING'
        : 'ATTENTION';

      const res = await ingestExecutiveSignal(tx, {
        organizationId,
        portfolioItemId: portfolioItem.id,
        sourceType: 'GITHUB',
        externalId: extId,
        severity,
        privacyScope: 'ORG_SHARED',
        title: `[GitHub ${kind} #${item.number}] ${item.title || 'Untitled'}`,
        summary: item.body || '',
        sourceUrl: item.html_url || null,
        rawMetadata: {
          kind,
          number: item.number,
          state: item.state,
          labels,
        },
        occurredAt: item.updated_at || item.created_at || refNow,
        provenanceToken: INTERNAL_CONNECTOR_PROVENANCE_TOKEN,
        now: refNow,
      });

      if (res.ok) {
        if (res.deduplicated) deduplicatedCount += 1;
        else ingestedCount += 1;
      }
    }

    const newEtag =
      typeof response.headers?.get === 'function' ? response.headers.get('etag') : null;

    const cursor = await tx.integrationCursor.upsert({
      where: {
        organizationId_sourceType_externalScopeKey: {
          organizationId,
          sourceType: 'GITHUB',
          externalScopeKey: repoFullName,
        },
      },
      update: {
        etag: newEtag || existingCursor?.etag || null,
        cursorValue: list[0]?.updated_at || existingCursor?.cursorValue || null,
        scopesGranted: 'repo:read,issues:read,pull_requests:read',
        lastSyncAt: refNow,
        lastSuccessAt: refNow,
        lastErrorCode: null,
        lastErrorMessage: null,
        consecutiveErrors: 0,
      },
      create: {
        organizationId,
        portfolioItemId: portfolioItem.id,
        sourceType: 'GITHUB',
        externalScopeKey: repoFullName,
        etag: newEtag || null,
        cursorValue: list[0]?.updated_at || null,
        scopesGranted: 'repo:read,issues:read,pull_requests:read',
        lastSyncAt: refNow,
        lastSuccessAt: refNow,
        consecutiveErrors: 0,
      },
    });

    return Object.freeze({
      ok: true,
      status: 200,
      code: 'GITHUB_SYNC_COMPLETED',
      ingestedCount,
      deduplicatedCount,
      cursor,
    });
  } catch (err) {
    const safeMsg = redactSecrets(err instanceof Error ? err.message : 'GitHub network error');
    return Object.freeze({
      ok: false,
      status: 502,
      code: 'GITHUB_READONLY_FETCH_ERROR',
      message: safeMsg,
    });
  }
}

export async function pollVercelProjectSignalsReadOnly(
  tx,
  {
    organizationId,
    portfolioItem,
    projectId,
    token = null,
    fetchImpl = globalThis.fetch,
    now = new Date(),
  }
) {
  if (!portfolioItem || portfolioItem.organizationId !== organizationId) {
    return Object.freeze({ ok: false, status: 404, code: 'PORTFOLIO_ITEM_NOT_FOUND' });
  }
  if (portfolioItem.isProactiveEnabled === false) {
    return Object.freeze({ ok: false, status: 403, code: 'PORTFOLIO_PROACTIVE_DISABLED' });
  }
  const cleanProjectId = String(projectId || '').trim();
  if (!VERCEL_PROJECT_ID_RX.test(cleanProjectId)) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_VERCEL_PROJECT_SCOPE' });
  }

  const refNow = now instanceof Date ? now : new Date(now);
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(cleanProjectId)}&limit=5`;

  try {
    const response = await fetchImpl(url, { method: 'GET', headers });
    if (!response.ok) {
      return Object.freeze({
        ok: false,
        status: 502,
        code: 'VERCEL_READONLY_FETCH_FAILED',
      });
    }
    const body = await response.json();
    const deployments = Array.isArray(body?.deployments) ? body.deployments : [];
    let ingestedCount = 0;
    let deduplicatedCount = 0;

    for (const dpl of deployments) {
      const uid = String(dpl.uid || dpl.id || '').trim();
      if (!uid) continue;
      const state = String(dpl.state || dpl.readyState || 'UNKNOWN').toUpperCase();
      const severity =
        state === 'ERROR'
          ? 'CRITICAL'
          : state === 'CANCELED'
          ? 'WARNING'
          : 'INFO';

      const res = await ingestExecutiveSignal(tx, {
        organizationId,
        portfolioItemId: portfolioItem.id,
        sourceType: 'VERCEL',
        externalId: `${cleanProjectId}:${uid}:${state}`,
        severity,
        privacyScope: 'ORG_SHARED',
        title: `[Vercel Deploy ${state}] ${portfolioItem.name} (${uid.slice(0, 12)})`,
        summary: dpl.meta?.githubCommitMessage || `Deployment ${uid} state=${state}`,
        sourceUrl: dpl.url ? `https://${dpl.url}` : null,
        rawMetadata: {
          deploymentId: uid,
          state,
          target: dpl.target || 'preview',
        },
        occurredAt: dpl.created ? new Date(dpl.created) : refNow,
        provenanceToken: INTERNAL_CONNECTOR_PROVENANCE_TOKEN,
        now: refNow,
      });

      if (res.ok) {
        if (res.deduplicated) deduplicatedCount += 1;
        else ingestedCount += 1;
      }
    }

    const cursor = await tx.integrationCursor.upsert({
      where: {
        organizationId_sourceType_externalScopeKey: {
          organizationId,
          sourceType: 'VERCEL',
          externalScopeKey: cleanProjectId,
        },
      },
      update: {
        cursorValue: deployments[0]?.uid || null,
        scopesGranted: 'deployments:read',
        lastSyncAt: refNow,
        lastSuccessAt: refNow,
        lastErrorCode: null,
        lastErrorMessage: null,
        consecutiveErrors: 0,
      },
      create: {
        organizationId,
        portfolioItemId: portfolioItem.id,
        sourceType: 'VERCEL',
        externalScopeKey: cleanProjectId,
        cursorValue: deployments[0]?.uid || null,
        scopesGranted: 'deployments:read',
        lastSyncAt: refNow,
        lastSuccessAt: refNow,
        consecutiveErrors: 0,
      },
    });

    return Object.freeze({
      ok: true,
      status: 200,
      code: 'VERCEL_SYNC_COMPLETED',
      ingestedCount,
      deduplicatedCount,
      cursor,
    });
  } catch (err) {
    return Object.freeze({
      ok: false,
      status: 502,
      code: 'VERCEL_READONLY_FETCH_ERROR',
      message: redactSecrets(err instanceof Error ? err.message : 'Vercel network error'),
    });
  }
}
