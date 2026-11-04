export function redactSecrets(input: string): string;

export function sanitizeExternalContent(
  rawText: unknown,
  options?: { maxChars?: number; wrapDelimiter?: boolean }
): {
  readonly sanitizedText: string;
  readonly wrappedContent: string;
  readonly untrustedContent: true;
  readonly injectionAttemptDetected: boolean;
  readonly truncated: boolean;
};

export function computeSignalDedupHash(input: {
  organizationId: string;
  sourceType: string;
  externalId: string;
}): string;

export function assertUntrustedCannotTriggerDecision(input?: {
  untrustedContent?: boolean;
  hasExplicitHumanTriage?: boolean;
  riskTier?: string;
}): {
  readonly ok: boolean;
  readonly status: number;
  readonly code: string;
};
