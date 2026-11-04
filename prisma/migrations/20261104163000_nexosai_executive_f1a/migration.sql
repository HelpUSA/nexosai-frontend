-- CreateEnum
CREATE TYPE "PortfolioItemType" AS ENUM ('APPLICATION', 'PRODUCT_IDEA', 'CLIENT_ACCOUNT', 'SALES_PIPELINE', 'OPERATIONAL_AREA', 'PERSONAL_DOMAIN');

-- CreateEnum
CREATE TYPE "PortfolioLifecycle" AS ENUM ('IDEA', 'DISCOVERY', 'ACTIVE_DEV', 'STAGING', 'PRODUCTION', 'MAINTENANCE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExecutivePrivacyScope" AS ENUM ('ORG_SHARED', 'EXECUTIVE_ONLY', 'PERSONAL_VAULT');

-- CreateEnum
CREATE TYPE "SignalSourceType" AS ENUM ('MANUAL', 'GITHUB', 'VERCEL', 'LINEAR', 'GOOGLE_CALENDAR', 'GMAIL', 'STRIPE', 'WEBHOOK', 'INTERNAL_AUDIT');

-- CreateEnum
CREATE TYPE "SignalSeverity" AS ENUM ('INFO', 'OPPORTUNITY', 'ATTENTION', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('NEW', 'LINKED_TO_WORK_ITEM', 'DISMISSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkItemCategory" AS ENUM ('DEVELOPMENT', 'IDEA_INNOVATION', 'CLIENT_SUCCESS', 'SALES_REVENUE', 'OPERATIONS_INFRA', 'PERSONAL');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('BACKLOG', 'TRIAGE', 'TODAY', 'IN_PROGRESS', 'WAITING_EXTERNAL', 'WAITING_APPROVAL', 'SNOOZED', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "WorkItemPriorityBand" AS ENUM ('P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW');

-- CreateEnum
CREATE TYPE "WorkItemEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PRIORITY_RECALCULATED', 'SNOOZED', 'UNSNOOZED', 'SIGNAL_ATTACHED', 'DECISION_REQUESTED', 'DECISION_RESOLVED', 'COMMENT_ADDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BriefingCadenceType" AS ENUM ('MORNING_BRIEFING', 'AFTERNOON_RADAR', 'EOD_CHECKIN', 'WEEKLY_REVIEW', 'CRITICAL_ALERT', 'AD_HOC');

-- CreateEnum
CREATE TYPE "BriefingDeliveryStatus" AS ENUM ('GENERATED', 'DELIVERED_IN_APP', 'ACKNOWLEDGED', 'SUPPRESSED_QUIET_HOURS', 'FAILED');

-- CreateEnum
CREATE TYPE "DecisionRiskTier" AS ENUM ('TIER_0_OBSERVE', 'TIER_1_SUGGEST', 'TIER_2_STAGE_DRAFT', 'TIER_3_EXECUTE_EXTERNAL');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'EDITED_AND_APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTED', 'EXECUTION_FAILED');

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED_RETRYABLE', 'DEAD_LETTER');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "features" JSONB;

-- CreateTable
CREATE TABLE "exec_portfolio_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PortfolioItemType" NOT NULL DEFAULT 'APPLICATION',
    "lifecycle" "PortfolioLifecycle" NOT NULL DEFAULT 'ACTIVE_DEV',
    "privacyScope" "ExecutivePrivacyScope" NOT NULL DEFAULT 'ORG_SHARED',
    "isProactiveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ownerUserId" TEXT,
    "linkedAgentId" TEXT,
    "repoFullName" TEXT,
    "productionUrl" TEXT,
    "stagingUrl" TEXT,
    "priorityWeight" INTEGER NOT NULL DEFAULT 50,
    "staleAfterDays" INTEGER NOT NULL DEFAULT 7,
    "lastActivityAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exec_portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_signals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "portfolioItemId" TEXT,
    "sourceType" "SignalSourceType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "dedupHash" TEXT NOT NULL,
    "severity" "SignalSeverity" NOT NULL DEFAULT 'INFO',
    "status" "SignalStatus" NOT NULL DEFAULT 'NEW',
    "privacyScope" "ExecutivePrivacyScope" NOT NULL DEFAULT 'ORG_SHARED',
    "untrustedContent" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sourceUrl" TEXT,
    "rawMetadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "linkedWorkItemId" TEXT,

    CONSTRAINT "exec_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_work_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "portfolioItemId" TEXT,
    "createdByUserId" TEXT,
    "ownerUserId" TEXT,
    "category" "WorkItemCategory" NOT NULL DEFAULT 'DEVELOPMENT',
    "status" "WorkItemStatus" NOT NULL DEFAULT 'TRIAGE',
    "privacyScope" "ExecutivePrivacyScope" NOT NULL DEFAULT 'ORG_SHARED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "nextAction" TEXT,
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "priorityBand" "WorkItemPriorityBand" NOT NULL DEFAULT 'P2_MEDIUM',
    "priorityReason" TEXT,
    "dueAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "staleAfterDays" INTEGER NOT NULL DEFAULT 5,
    "lastTouchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "externalRef" TEXT,
    "externalUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exec_work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_work_item_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorAgentId" TEXT,
    "eventType" "WorkItemEventType" NOT NULL,
    "fromStatus" "WorkItemStatus",
    "toStatus" "WorkItemStatus",
    "rationale" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exec_work_item_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_briefing_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "cadenceType" "BriefingCadenceType" NOT NULL,
    "deliveryStatus" "BriefingDeliveryStatus" NOT NULL DEFAULT 'GENERATED',
    "timezone" TEXT NOT NULL DEFAULT 'America/Fortaleza',
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "headline" TEXT NOT NULL,
    "summaryMarkdown" TEXT NOT NULL,
    "topWorkItemIds" JSONB NOT NULL,
    "stalePortfolioIds" JSONB,
    "pendingDecisionIds" JSONB,
    "metricsSnapshot" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "exec_briefing_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_decision_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "requestedByAgent" TEXT NOT NULL DEFAULT 'nexosai-executive-gm',
    "decidedByUserId" TEXT,
    "riskTier" "DecisionRiskTier" NOT NULL DEFAULT 'TIER_2_STAGE_DRAFT',
    "status" "DecisionStatus" NOT NULL DEFAULT 'PENDING',
    "privacyScope" "ExecutivePrivacyScope" NOT NULL DEFAULT 'ORG_SHARED',
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "proposedPayload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "editedPayload" JSONB,
    "editedPayloadHash" TEXT,
    "payloadDiffSummary" JSONB,
    "decisionNote" TEXT,
    "executionResult" JSONB,
    "expiresAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exec_decision_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_integration_cursors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "portfolioItemId" TEXT,
    "sourceType" "SignalSourceType" NOT NULL,
    "externalScopeKey" TEXT NOT NULL,
    "cursorValue" TEXT,
    "etag" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scopesGranted" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exec_integration_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exec_outbox_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exec_outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exec_portfolio_items_organizationId_type_lifecycle_idx" ON "exec_portfolio_items"("organizationId", "type", "lifecycle");

-- CreateIndex
CREATE INDEX "exec_portfolio_items_organizationId_privacyScope_idx" ON "exec_portfolio_items"("organizationId", "privacyScope");

-- CreateIndex
CREATE INDEX "exec_portfolio_items_organizationId_lastActivityAt_idx" ON "exec_portfolio_items"("organizationId", "lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "exec_portfolio_items_id_organizationId_key" ON "exec_portfolio_items"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "exec_portfolio_items_organizationId_slug_key" ON "exec_portfolio_items"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "exec_signals_organizationId_status_severity_occurredAt_idx" ON "exec_signals"("organizationId", "status", "severity", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "exec_signals_organizationId_portfolioItemId_occurredAt_idx" ON "exec_signals"("organizationId", "portfolioItemId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "exec_signals_organizationId_dedupHash_idx" ON "exec_signals"("organizationId", "dedupHash");

-- CreateIndex
CREATE UNIQUE INDEX "exec_signals_id_organizationId_key" ON "exec_signals"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "exec_signals_organizationId_sourceType_externalId_key" ON "exec_signals"("organizationId", "sourceType", "externalId");

-- CreateIndex
CREATE INDEX "exec_work_items_organizationId_status_priorityScore_idx" ON "exec_work_items"("organizationId", "status", "priorityScore" DESC);

-- CreateIndex
CREATE INDEX "exec_work_items_organizationId_ownerUserId_status_priorityS_idx" ON "exec_work_items"("organizationId", "ownerUserId", "status", "priorityScore" DESC);

-- CreateIndex
CREATE INDEX "exec_work_items_organizationId_portfolioItemId_status_idx" ON "exec_work_items"("organizationId", "portfolioItemId", "status");

-- CreateIndex
CREATE INDEX "exec_work_items_organizationId_privacyScope_status_idx" ON "exec_work_items"("organizationId", "privacyScope", "status");

-- CreateIndex
CREATE INDEX "exec_work_items_organizationId_snoozedUntil_idx" ON "exec_work_items"("organizationId", "snoozedUntil");

-- CreateIndex
CREATE INDEX "exec_work_items_organizationId_dueAt_idx" ON "exec_work_items"("organizationId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "exec_work_items_id_organizationId_key" ON "exec_work_items"("id", "organizationId");

-- CreateIndex
CREATE INDEX "exec_work_item_events_organizationId_workItemId_createdAt_idx" ON "exec_work_item_events"("organizationId", "workItemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "exec_work_item_events_organizationId_eventType_createdAt_idx" ON "exec_work_item_events"("organizationId", "eventType", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "exec_work_item_events_id_organizationId_key" ON "exec_work_item_events"("id", "organizationId");

-- CreateIndex
CREATE INDEX "exec_briefing_runs_organizationId_recipientUserId_generated_idx" ON "exec_briefing_runs"("organizationId", "recipientUserId", "generatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "exec_briefing_runs_id_organizationId_key" ON "exec_briefing_runs"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "exec_briefing_runs_organizationId_cadenceType_windowStart_w_key" ON "exec_briefing_runs"("organizationId", "cadenceType", "windowStart", "windowEnd");

-- CreateIndex
CREATE INDEX "exec_decision_requests_organizationId_status_riskTier_creat_idx" ON "exec_decision_requests"("organizationId", "status", "riskTier", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "exec_decision_requests_organizationId_workItemId_idx" ON "exec_decision_requests"("organizationId", "workItemId");

-- CreateIndex
CREATE UNIQUE INDEX "exec_decision_requests_id_organizationId_key" ON "exec_decision_requests"("id", "organizationId");

-- CreateIndex
CREATE INDEX "exec_integration_cursors_organizationId_isEnabled_lastSyncA_idx" ON "exec_integration_cursors"("organizationId", "isEnabled", "lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "exec_integration_cursors_id_organizationId_key" ON "exec_integration_cursors"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "exec_integration_cursors_organizationId_sourceType_external_key" ON "exec_integration_cursors"("organizationId", "sourceType", "externalScopeKey");

-- CreateIndex
CREATE INDEX "exec_outbox_events_status_nextRetryAt_idx" ON "exec_outbox_events"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "exec_outbox_events_organizationId_aggregateType_aggregateId_idx" ON "exec_outbox_events"("organizationId", "aggregateType", "aggregateId");

-- CreateIndex
CREATE UNIQUE INDEX "exec_outbox_events_id_organizationId_key" ON "exec_outbox_events"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "exec_outbox_events_organizationId_idempotencyKey_key" ON "exec_outbox_events"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_id_organizationId_key" ON "Agent"("id", "organizationId");

-- AddForeignKey
ALTER TABLE "exec_portfolio_items" ADD CONSTRAINT "exec_portfolio_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_portfolio_items" ADD CONSTRAINT "exec_portfolio_items_linkedAgentId_organizationId_fkey" FOREIGN KEY ("linkedAgentId", "organizationId") REFERENCES "Agent"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_signals" ADD CONSTRAINT "exec_signals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_signals" ADD CONSTRAINT "exec_signals_portfolioItemId_organizationId_fkey" FOREIGN KEY ("portfolioItemId", "organizationId") REFERENCES "exec_portfolio_items"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_signals" ADD CONSTRAINT "exec_signals_linkedWorkItemId_organizationId_fkey" FOREIGN KEY ("linkedWorkItemId", "organizationId") REFERENCES "exec_work_items"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_work_items" ADD CONSTRAINT "exec_work_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_work_items" ADD CONSTRAINT "exec_work_items_portfolioItemId_organizationId_fkey" FOREIGN KEY ("portfolioItemId", "organizationId") REFERENCES "exec_portfolio_items"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_work_items" ADD CONSTRAINT "exec_work_items_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_work_items" ADD CONSTRAINT "exec_work_items_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_work_item_events" ADD CONSTRAINT "exec_work_item_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_work_item_events" ADD CONSTRAINT "exec_work_item_events_workItemId_organizationId_fkey" FOREIGN KEY ("workItemId", "organizationId") REFERENCES "exec_work_items"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_work_item_events" ADD CONSTRAINT "exec_work_item_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_briefing_runs" ADD CONSTRAINT "exec_briefing_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_decision_requests" ADD CONSTRAINT "exec_decision_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_decision_requests" ADD CONSTRAINT "exec_decision_requests_workItemId_organizationId_fkey" FOREIGN KEY ("workItemId", "organizationId") REFERENCES "exec_work_items"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_decision_requests" ADD CONSTRAINT "exec_decision_requests_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_integration_cursors" ADD CONSTRAINT "exec_integration_cursors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_integration_cursors" ADD CONSTRAINT "exec_integration_cursors_portfolioItemId_organizationId_fkey" FOREIGN KEY ("portfolioItemId", "organizationId") REFERENCES "exec_portfolio_items"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exec_outbox_events" ADD CONSTRAINT "exec_outbox_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- NEXOSAI EXECUTIVE F1A: POSTGRESQL ROW-LEVEL SECURITY (ENABLE + FORCE RLS)
-- ============================================================================
ALTER TABLE "exec_portfolio_items"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_portfolio_items"     FORCE ROW LEVEL SECURITY;

ALTER TABLE "exec_signals"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_signals"             FORCE ROW LEVEL SECURITY;

ALTER TABLE "exec_work_items"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_work_items"          FORCE ROW LEVEL SECURITY;

ALTER TABLE "exec_work_item_events"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_work_item_events"    FORCE ROW LEVEL SECURITY;

ALTER TABLE "exec_briefing_runs"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_briefing_runs"       FORCE ROW LEVEL SECURITY;

ALTER TABLE "exec_decision_requests"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_decision_requests"   FORCE ROW LEVEL SECURITY;

ALTER TABLE "exec_integration_cursors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_integration_cursors" FORCE ROW LEVEL SECURITY;

ALTER TABLE "exec_outbox_events"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exec_outbox_events"       FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_exec_portfolio_items ON "exec_portfolio_items"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

CREATE POLICY tenant_isolation_exec_signals ON "exec_signals"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

CREATE POLICY tenant_isolation_exec_work_items ON "exec_work_items"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

CREATE POLICY tenant_isolation_exec_work_item_events ON "exec_work_item_events"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

CREATE POLICY tenant_isolation_exec_briefing_runs ON "exec_briefing_runs"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

CREATE POLICY tenant_isolation_exec_decision_requests ON "exec_decision_requests"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

CREATE POLICY tenant_isolation_exec_integration_cursors ON "exec_integration_cursors"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

CREATE POLICY tenant_isolation_exec_outbox_events ON "exec_outbox_events"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

-- Non-superuser, no-bypassrls execution role for transaction-scoped RLS enforcement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexosai_rls_tenant_enforced') THEN
    CREATE ROLE nexosai_rls_tenant_enforced NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO nexosai_rls_tenant_enforced;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexosai_rls_tenant_enforced;
