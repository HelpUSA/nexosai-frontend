export const INTERNAL_CONNECTOR_PROVENANCE_TOKEN: symbol;

export function redactSecrets(input: string): string;

export function validateStrictIdentifier(
  value: unknown,
  options?: { minLen?: number; maxLen?: number }
): {
  readonly ok: boolean;
  readonly status: number;
  readonly code?: string;
  readonly value?: string;
};

export function validateSafeSourceUrl(
  rawUrl: unknown,
  options?: { requiredOriginPrefix?: string | null }
): {
  readonly ok: boolean;
  readonly status: number;
  readonly code?: string;
  readonly url?: string | null;
};

export function validateAndSanitizeMetadata(
  rawMetadata: unknown,
  options?: {
    maxDepth?: number;
    maxKeys?: number;
    maxStringLen?: number;
    maxSerializedBytes?: number;
  }
): {
  readonly ok: boolean;
  readonly status: number;
  readonly code?: string;
  readonly metadata?: Record<string, unknown>;
};

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
