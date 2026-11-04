// F1A Executive Security: Untrusted external content sanitization,
// structured validation of URLs/metadata/identifiers, indirect prompt injection detection,
// secret redaction, and unforgeable connector provenance symbol.

import { createHash } from 'node:crypto';

export const INTERNAL_CONNECTOR_PROVENANCE_TOKEN = Symbol.for(
  'nexosai.executive.f1a.internal_connector_provenance'
);

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

const STRICT_EXTERNAL_ID_RX = /^[A-Za-z0-9_.:/#-]{1,160}$/;
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const SENSITIVE_URL_PARAM_RX =
  /(?:^|[?&])(?:access_token|token|auth|key|secret|password|sig|signature|code|client_secret)=/i;

export function redactSecrets(input) {
  if (typeof input !== 'string' || input.length === 0) return '';
  let out = input;
  for (const regex of SECRET_PATTERNS) {
    out = out.replace(regex, '[REDACTED_CREDENTIAL]');
  }
  return out;
}

export function validateStrictIdentifier(value, { minLen = 1, maxLen = 160 } = {}) {
  if (typeof value !== 'string') {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_IDENTIFIER_TYPE' });
  }
  const trimmed = value.trim();
  if (
    trimmed.length < minLen ||
    trimmed.length > maxLen ||
    !STRICT_EXTERNAL_ID_RX.test(trimmed) ||
    trimmed.includes('..') ||
    trimmed.includes('\\')
  ) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_IDENTIFIER_FORMAT' });
  }
  return Object.freeze({ ok: true, status: 200, value: trimmed });
}

export function validateSafeSourceUrl(rawUrl, { requiredOriginPrefix = null } = {}) {
  if (rawUrl === null || rawUrl === undefined || rawUrl === '') {
    return Object.freeze({ ok: true, status: 200, url: null });
  }
  if (typeof rawUrl !== 'string' || rawUrl.length > 512) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_SOURCE_URL_LENGTH' });
  }
  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_SOURCE_URL_FORMAT' });
  }
  if (parsed.protocol !== 'https:') {
    return Object.freeze({ ok: false, status: 400, code: 'SOURCE_URL_HTTPS_REQUIRED' });
  }
  if (parsed.username || parsed.password) {
    return Object.freeze({ ok: false, status: 400, code: 'SOURCE_URL_CREDENTIALS_FORBIDDEN' });
  }
  if (SENSITIVE_URL_PARAM_RX.test(parsed.search)) {
    return Object.freeze({
      ok: false,
      status: 400,
      code: 'SOURCE_URL_SENSITIVE_QUERY_OR_HASH_FORBIDDEN',
    });
  }
  // Strip any query string or fragment to prevent token reflection in URLs
  const cleanUrl = `${parsed.origin}${parsed.pathname}`;
  if (SECRET_PATTERNS.some((rx) => rx.test(cleanUrl))) {
    return Object.freeze({ ok: false, status: 400, code: 'SOURCE_URL_SECRET_DETECTED' });
  }
  if (requiredOriginPrefix && !cleanUrl.startsWith(requiredOriginPrefix)) {
    return Object.freeze({
      ok: false,
      status: 403,
      code: 'SOURCE_URL_OUTSIDE_AUTHORIZED_SCOPE',
    });
  }
  return Object.freeze({ ok: true, status: 200, url: cleanUrl });
}

export function validateAndSanitizeMetadata(
  rawMetadata,
  { maxDepth = 2, maxKeys = 15, maxStringLen = 256, maxSerializedBytes = 4096 } = {}
) {
  if (rawMetadata === null || rawMetadata === undefined) {
    return Object.freeze({ ok: true, status: 200, metadata: {} });
  }
  if (typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
    return Object.freeze({ ok: false, status: 400, code: 'INVALID_METADATA_ROOT_TYPE' });
  }

  let totalKeys = 0;

  function sanitizeNode(node, depth) {
    if (depth > maxDepth) {
      throw new Error('METADATA_MAX_DEPTH_EXCEEDED');
    }
    if (node === null || node === undefined) return null;
    if (typeof node === 'boolean') return node;
    if (typeof node === 'number') {
      if (!Number.isFinite(node)) throw new Error('METADATA_NON_FINITE_NUMBER');
      return node;
    }
    if (typeof node === 'string') {
      const cleaned = redactSecrets(
        node.replace(/[\u0000-\u001F\u007F]/g, ' ').trim()
      );
      return cleaned.length > maxStringLen ? cleaned.slice(0, maxStringLen) : cleaned;
    }
    if (Array.isArray(node)) {
      if (node.length > maxKeys) throw new Error('METADATA_ARRAY_TOO_LARGE');
      return node.map((item) => sanitizeNode(item, depth + 1));
    }
    if (typeof node === 'object') {
      const proto = Object.getPrototypeOf(node);
      if (proto !== Object.prototype && proto !== null) {
        throw new Error('METADATA_PROTOTYPE_INVALID');
      }
      const keys = Object.keys(node);
      totalKeys += keys.length;
      if (totalKeys > maxKeys) {
        throw new Error('METADATA_MAX_KEYS_EXCEEDED');
      }
      const out = {};
      for (const k of keys) {
        if (DANGEROUS_KEYS.has(k) || k.length > 64 || !/^[A-Za-z0-9_.-]+$/.test(k)) {
          throw new Error('METADATA_INVALID_KEY');
        }
        out[k] = sanitizeNode(node[k], depth + 1);
      }
      return out;
    }
    throw new Error('METADATA_UNSUPPORTED_VALUE_TYPE');
  }

  try {
    const sanitized = sanitizeNode(rawMetadata, 0);
    const serialized = JSON.stringify(sanitized);
    if (Buffer.byteLength(serialized, 'utf8') > maxSerializedBytes) {
      return Object.freeze({ ok: false, status: 400, code: 'METADATA_SIZE_LIMIT_EXCEEDED' });
    }
    return Object.freeze({ ok: true, status: 200, metadata: sanitized });
  } catch (err) {
    return Object.freeze({
      ok: false,
      status: 400,
      code: err instanceof Error ? err.message : 'INVALID_METADATA_STRUCTURE',
    });
  }
}

export function sanitizeExternalContent(
  rawText,
  { maxChars = 2000, wrapDelimiter = true } = {}
) {
  const raw = typeof rawText === 'string' ? rawText : String(rawText ?? '');
  const injectionAttemptDetected = PROMPT_INJECTION_PATTERNS.some((rx) => rx.test(raw));

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
