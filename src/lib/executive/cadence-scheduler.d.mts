import type { ExecutiveWorkItemRecord } from './priority-engine.mjs';

export interface CadenceConfig {
  readonly timezone: string;
  readonly morningBriefingTime: string;
  readonly afternoonRadarTime: string;
  readonly weeklyReviewDay: number;
  readonly weeklyReviewTime: string;
  readonly quietHoursStart: string;
  readonly quietHoursEnd: string;
  readonly criticalAlertThreshold: number;
  readonly cooldownHours: number;
  readonly maxDailyCriticalAlerts: number;
  readonly jobsEnabled: boolean;
}

export interface LocalTimeParts {
  readonly timeZone: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly weekday: string;
  readonly dayOfWeek: number;
  readonly hour: number;
  readonly minute: number;
  readonly hhmm: string;
  readonly minutesOfDay: number;
  readonly dateKey: string;
}

export interface CadenceSlotEvaluation {
  readonly timezone: string;
  readonly localDateKey: string;
  readonly localHhMm: string;
  readonly dayOfWeek: number;
  readonly isQuietHours: boolean;
  readonly matchedCadence: string | null;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly config: CadenceConfig;
}

export interface StalePortfolioRadarItem {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly type: string;
  readonly lifecycle: string;
  readonly priorityWeight: number;
  readonly staleAfterDays: number;
  readonly daysIdle: number;
  readonly isStale: boolean;
}

export interface MeuDiaAndRadarSnapshot {
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly cadence: CadenceSlotEvaluation;
  readonly topPriorities: ExecutiveWorkItemRecord[];
  readonly triageQueue: ExecutiveWorkItemRecord[];
  readonly waitingExternal: ExecutiveWorkItemRecord[];
  readonly stalePortfolioRadar: StalePortfolioRadarItem[];
  readonly recentSignals: Record<string, unknown>[];
  readonly metrics: {
    readonly totalPortfolioItems: number;
    readonly stalePortfolioCount: number;
    readonly openWorkItemsCount: number;
    readonly criticalWorkItemsCount: number;
    readonly triageCount: number;
    readonly waitingExternalCount: number;
    readonly activeSignalsCount: number;
  };
}

export const APPROVED_D3_CADENCE_DEFAULTS: CadenceConfig;

export function resolveTenantCadenceConfig(overrides?: Record<string, unknown>): CadenceConfig;
export function getLocalTimeParts(date?: Date | string, timeZone?: string): LocalTimeParts;
export function isWithinQuietHours(date?: Date | string, config?: Record<string, unknown>): boolean;
export function evaluateCadenceSlot(date?: Date | string, config?: Record<string, unknown>): CadenceSlotEvaluation;

export function buildMeuDiaAndRadarSnapshot(
  tx: unknown,
  input: {
    organizationId: string;
    now?: Date | string;
    tenantCadenceConfig?: Record<string, unknown>;
  }
): Promise<MeuDiaAndRadarSnapshot>;

export function runScheduledBriefingJob(
  tx: unknown,
  input: {
    organizationId: string;
    cadenceType?: string | null;
    now?: Date | string;
    env?: NodeJS.ProcessEnv | Record<string, unknown>;
    tenantCadenceConfig?: Record<string, unknown>;
    forceRunForTest?: boolean;
  }
): Promise<{
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
  readonly deduplicated?: boolean;
  readonly briefingRun?: Record<string, unknown>;
  readonly snapshot?: MeuDiaAndRadarSnapshot;
}>;
