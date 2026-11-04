export const ALLOWED_WORK_ITEM_TRANSITIONS: Readonly<Record<string, readonly string[]>>;

export type PriorityBand = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export interface PriorityCalculationResult {
  readonly priorityScore: number;
  readonly priorityBand: PriorityBand;
  readonly priorityReason: string;
  readonly breakdown: {
    readonly urgency: number;
    readonly impact: number;
    readonly staleness: number;
    readonly blocker: number;
    readonly fatiguePenalty: number;
  };
}

export interface ExecutiveWorkItemRecord {
  id: string;
  organizationId: string;
  portfolioItemId?: string | null;
  title: string;
  description?: string | null;
  nextAction?: string | null;
  category: string;
  status: string;
  privacyScope: string;
  priorityScore: number;
  priorityBand: string;
  priorityReason?: string | null;
  snoozeCount: number;
  snoozedUntil?: Date | string | null;
  dueAt?: Date | string | null;
}

export interface WorkItemMutationResult {
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
  readonly workItem?: ExecutiveWorkItemRecord;
  readonly priority?: PriorityCalculationResult;
}

export function scoreToPriorityBand(score: number): PriorityBand;

export function computeWorkItemPriority(
  input?: {
    dueAt?: Date | string | null;
    portfolioPriorityWeight?: number;
    category?: string;
    staleAfterDays?: number;
    lastTouchedAt?: Date | string | null;
    highestSignalSeverity?: string;
    isBlocking?: boolean;
    snoozeCount?: number;
    snoozedUntil?: Date | string | null;
  },
  now?: Date | string
): PriorityCalculationResult;

export function validateWorkItemTransition(input: {
  fromStatus: string;
  toStatus: string;
  snoozedUntil?: Date | string | null;
  now?: Date | string;
}): {
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
  readonly message?: string;
};

export function createCapturedWorkItem(
  tx: unknown,
  input: {
    organizationId: string;
    userId?: string | null;
    portfolioItemId?: string | null;
    title: string;
    description?: string | null;
    nextAction?: string | null;
    category?: string;
    privacyScope?: string;
    status?: string;
    dueAt?: Date | string | null;
    staleAfterDays?: number;
    highestSignalSeverity?: string;
    isBlocking?: boolean;
    now?: Date | string;
  }
): Promise<WorkItemMutationResult>;

export function transitionWorkItem(
  tx: unknown,
  input: {
    organizationId: string;
    workItemId: string;
    actorUserId?: string | null;
    toStatus: string;
    snoozedUntil?: Date | string | null;
    rationale?: string | null;
    now?: Date | string;
  }
): Promise<WorkItemMutationResult>;
