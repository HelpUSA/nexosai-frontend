import type { ExecutivePortfolioSummary } from './executive-gate.mjs';

export interface SignalIngestionResult {
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
  readonly deduplicated?: boolean;
  readonly signal?: Record<string, unknown>;
  readonly message?: string;
}

export interface ConnectorSyncResult {
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
  readonly ingestedCount?: number;
  readonly deduplicatedCount?: number;
  readonly cursor?: Record<string, unknown>;
  readonly message?: string;
}

export function assertReadOnlyHttpMethod(method?: string): {
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
};

export function ingestExecutiveSignal(
  tx: unknown,
  input: {
    organizationId: string;
    portfolioItemId?: string | null;
    sourceType?: string;
    externalId: string;
    severity?: string;
    privacyScope?: string;
    title: string;
    summary?: string;
    sourceUrl?: string | null;
    rawMetadata?: Record<string, unknown> | null;
    occurredAt?: Date | string | null;
    actorUserId?: string | null;
    provenanceToken?: symbol | null;
    now?: Date | string;
  }
): Promise<SignalIngestionResult>;

export function pollGitHubRepositorySignalsReadOnly(
  tx: unknown,
  input: {
    organizationId: string;
    portfolioItem: ExecutivePortfolioSummary;
    token?: string | null;
    fetchImpl?: typeof fetch;
    now?: Date | string;
  }
): Promise<ConnectorSyncResult>;

export function pollVercelProjectSignalsReadOnly(
  tx: unknown,
  input: {
    organizationId: string;
    portfolioItem: ExecutivePortfolioSummary;
    projectId: string;
    token?: string | null;
    fetchImpl?: typeof fetch;
    now?: Date | string;
  }
): Promise<ConnectorSyncResult>;
