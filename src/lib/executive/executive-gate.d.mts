export const ALLOWED_F1A_SIGNAL_SOURCES: readonly string[];
export const PROHIBITED_F1A_SIGNAL_SOURCES: readonly string[];
export const EXECUTIVE_QUOTAS: {
  readonly MAX_SIGNALS_PER_ORG_HOUR: number;
  readonly MAX_ACTIVE_SIGNALS_PER_ORG: number;
  readonly MAX_OPEN_WORK_ITEMS_PER_ORG: number;
};

export interface ExecutivePortfolioSummary {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  type: string;
  lifecycle: string;
  privacyScope: string;
  isProactiveEnabled: boolean;
  priorityWeight: number;
  staleAfterDays: number;
  lastActivityAt?: Date | string | null;
  repoFullName?: string | null;
}

export function isExecutiveGlobalEnabled(env?: NodeJS.ProcessEnv | Record<string, unknown>): boolean;

export function assertF1AScopeAllowed(input?: {
  privacyScope?: string;
  category?: string;
  sourceType?: string;
  portfolioType?: string;
}): {
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
};

export function withExecutiveTenantContext<T, TClient = Record<string, unknown>>(
  db: TClient,
  organizationId: string,
  callback: (tx: TClient) => Promise<T>
): Promise<T>;

export function authorizeExecutiveAccess(input: {
  email?: string | null;
  organizationId?: string | null;
  portfolioItemId?: string | null;
  requiredRoles?: string[];
  db: unknown;
  env?: NodeJS.ProcessEnv | Record<string, unknown>;
}): Promise<{
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
  readonly userId?: string;
  readonly email?: string;
  readonly organizationId?: string;
  readonly role?: string;
  readonly organization?: {
    id: string;
    name: string;
    slug: string;
    features?: unknown;
  };
  readonly portfolioItem?: ExecutivePortfolioSummary | null;
}>;
