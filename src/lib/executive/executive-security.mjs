// F1A Executive Security: Untrusted external content sanitization,
// indirect prompt injection detection, secret redaction, and deduplication hash.

import { createHash } from 'node:crypto';

const SECRET_PATTERNS = [
  /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{16,255}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,255}\b/g,
  /\bGOCSPX-[A-Za-z0-9_-]{10,120}\b/g,
  /\bsk-[A-Za-z0-9_-]{16,255}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,512}\b/gi,
  /\bpostgres(?:ql)?:\/\/[^\s"'<>]+/gi,
  /\bAIza[0-9A-Za-z_-]{20,100}\b/g,
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|system)\s+instructions/i,
  /system\s*prompt\s*:/i,
  /you\s+are\s+now\s+(?:a|an|in)\s+/i,
  /<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\]/i,
  /auto[_-\s]?approve\s+decision/i,
  /bypass\s+(?:human|hitl|approval|rls|tenant)/i,
];

export function redactSecrets(input) {
  if (typeof input !== 'string' || input.length === 0) return '';
  let out = input;
  for (const regex of SECRET_PATTERNS) {
    out = out.replace(regex, '[REDACTED_CREDENTIAL]');
  }
  return out;
}

export function sanitizeExternalContent(
  rawText,
  { maxChars = 2000, wrapDelimiter = true } = {}
) {
  const raw = typeof rawText === 'string' ? rawText : String(rawText ?? '');
  const injectionAttemptDetected = PROMPT_INJECTION_PATTERNS.some((rx) => rx.test(raw));

  // Strip script/style blocks, HTML tags, and non-printable control chars
  const withoutScripts = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const redacted = redactSecrets(withoutScripts);
  const limit = Math.max(32, Math.min(Number(maxChars) || 2000, 8000));
  const truncated = redacted.length > limit;
  const sanitizedText = truncated ? redacted.slice(0, limit) + '…[TRUNCATED]' : redacted;

  const wrappedContent = wrapDelimiter
    ? `<untrusted_external_content>${sanitizedText}</untrusted_external_content>`
    : sanitizedText;

  return Object.freeze({
    sanitizedText,
    wrappedContent,
    untrustedContent: true,
    injectionAttemptDetected,
    truncated,
  });
}

export function computeSignalDedupHash({ organizationId, sourceType, externalId }) {
  const org = String(organizationId || '').trim();
  const src = String(sourceType || '').trim().toUpperCase();
  const ext = String(externalId || '').trim();
  if (!org || !src || !ext) {
    throw new Error('INVALID_SIGNAL_DEDUP_INPUT');
  }
  return createHash('sha256').update(`${org}:${src}:${ext}`, 'utf8').digest('hex');
}

export function assertUntrustedCannotTriggerDecision({
  untrustedContent = true,
  hasExplicitHumanTriage = false,
  riskTier = 'TIER_2_STAGE_DRAFT',
} = {}) {
  if (
    untrustedContent === true &&
    hasExplicitHumanTriage !== true &&
    ['TIER_2_STAGE_DRAFT', 'TIER_3_EXECUTE_EXTERNAL'].includes(riskTier)
  ) {
    return Object.freeze({
      ok: false,
      status: 403,
      code: 'UNTRUSTED_SIGNAL_CANNOT_STAGE_OR_EXECUTE_DECISION',
    });
  }
  return Object.freeze({
    ok: true,
    status: 200,
    code: 'DECISION_TRIGGER_ALLOWED',
  });
}
