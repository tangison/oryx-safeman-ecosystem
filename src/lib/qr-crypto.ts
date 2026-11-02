/**
 * QR credential crypto — pure client-side, Web Crypto only (no Node APIs).
 *
 * Payload flow:
 *   JSON payload -> compact JSON string -> base64url  ("d" query param)
 *   sig = HMAC-SHA256(secret, d) truncated to 16 hex chars
 *   Verify URL: https://safeman.oryxinstitute.org/verify?d=<payload>&sig=<sig>
 */

export const DEV_SECRET_FALLBACK = 'oryx-safeman-dev-secret-2026';
export const SAFEMAN_VERIFY_ORIGIN = 'https://safeman.oryxinstitute.org';

export function getQrSecret(): string {
  const envSecret =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SAFEMAN_QR_SECRET : undefined;
  return envSecret && envSecret.trim().length > 0 ? envSecret.trim() : DEV_SECRET_FALLBACK;
}

/* ----------------------------- base64url ----------------------------- */

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(input: string): Uint8Array {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function utf8ToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

export function base64UrlToUtf8(input: string): string {
  return new TextDecoder().decode(base64UrlToBytes(input));
}

/* ------------------------------ HMAC -------------------------------- */

/** Full hex HMAC-SHA256 over `message`. */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret) as unknown as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message) as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Signature carried in the URL: first 16 hex chars of the HMAC. */
export async function computeSignature(d: string): Promise<string> {
  const hex = await hmacSha256Hex(getQrSecret(), d);
  return hex.slice(0, 16);
}

/** Timing-safe-ish string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* --------------------------- QR payload ----------------------------- */

export interface QrPayload {
  /** serial, e.g. SM-2026-FIRE-00481 */
  s: string;
  /** learner full name */
  n: string;
  /** masked national ID / passport */
  id: string;
  /** course title */
  c: string;
  /** company */
  co: string;
  /** standards joined with "|" */
  st: string;
  /** issued ISO date */
  iss: string;
  /** expiry ISO date */
  exp: string;
  /** status — always "VERIFIED" on a genuine payload */
  p: string;
}

export async function encodeAndSignPayload(payload: QrPayload): Promise<{ d: string; sig: string }> {
  const json = JSON.stringify(payload);
  const d = utf8ToBase64Url(json);
  const sig = await computeSignature(d);
  return { d, sig };
}

export type VerifyOutcome =
  | { status: 'valid'; payload: QrPayload }
  | { status: 'invalid'; reason: string };

export async function verifySignedPayload(d: string, sig: string): Promise<VerifyOutcome> {
  try {
    const expected = await computeSignature(d);
    if (!safeEqual(expected, sig.trim().toLowerCase())) {
      return { status: 'invalid', reason: 'Signature does not match the payload.' };
    }
    const payload = JSON.parse(base64UrlToUtf8(d)) as QrPayload;
    if (!payload || typeof payload.s !== 'string' || typeof payload.n !== 'string') {
      return { status: 'invalid', reason: 'Payload structure not recognised.' };
    }
    return { status: 'valid', payload };
  } catch {
    return { status: 'invalid', reason: 'Payload could not be decoded.' };
  }
}

export function buildVerifyUrl(d: string, sig: string): string {
  return `${SAFEMAN_VERIFY_ORIGIN}/verify?d=${d}&sig=${sig}`;
}

/** Local (same-origin) verify link for on-device testing. */
export function buildLocalVerifyPath(d: string, sig: string): string {
  return `/verify/?d=${encodeURIComponent(d)}&sig=${encodeURIComponent(sig)}`;
}

/**
 * Accepts a full verify URL, "d=...&sig=..." or a bare base64url payload
 * (signature-less input verifies as invalid).
 */
export function parseVerifyInput(raw: string): { d?: string; sig?: string } {
  const text = raw.trim();
  if (!text) return {};
  const byUrl = (() => {
    try {
      return new URL(text);
    } catch {
      return null;
    }
  })();
  const params = byUrl ? byUrl.searchParams : new URLSearchParams(text.replace(/^\?/, ''));
  const d = params.get('d') ?? undefined;
  const sig = params.get('sig') ?? undefined;
  if (d) return { d, sig };
  // Bare payload pasted without signature.
  if (/^[A-Za-z0-9_-]+$/.test(text)) return { d: text };
  return {};
}

/* ------------------------------ helpers ----------------------------- */

/** Mask a national ID / passport: keep first+last 4, asterisk the middle. */
export function maskId(id: string): string {
  const s = id.trim();
  if (s.length >= 12) return `${s.slice(0, 4)}****${s.slice(-4)}`;
  if (s.length >= 8) return `${s.slice(0, 3)}****${s.slice(-2)}`;
  if (s.length >= 4) return `${s.slice(0, 2)}****`;
  return '*'.repeat(Math.max(s.length, 3));
}

/** SM-{year}-{COURSE}-{seq5}, e.g. SM-2026-FIRE-00481 */
export function makeSerial(year: number, courseCode: string, seq: number): string {
  return `SM-${year}-${courseCode.toUpperCase()}-${String(Math.max(seq, 1)).padStart(5, '0')}`;
}
