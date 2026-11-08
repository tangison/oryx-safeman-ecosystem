/**
 * Stateless HMAC-SHA256 credential verification (zero database, zero server cost).
 *
 * The QR code on every certificate / PVC pass carries:
 *   /verify?d=<base64url payload>&sig=<base64url hmac>
 * Anyone can READ the payload; only holders of the site HMAC key can produce a
 * matching signature. The key ships via NEXT_PUBLIC_VERIFY_HMAC_KEY (a runtime
 * env var - rotate it on deploy without touching code).
 */

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function getKey(): Promise<CryptoKey> {
  const secret = process.env.NEXT_PUBLIC_VERIFY_HMAC_KEY || "oryx-institute-2026-stateless-verify";
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

export interface CertPayload {
  /** serial: ORYX-2026-NNNN / SM-2026-NNNN */
  s: string;
  /** learner full name */
  n: string;
  /** course code */
  c: string;
  /** issue date YYYY-MM-DD */
  d: string;
  /** track: a=academy, m=safeman */
  t: "a" | "m";
}

export async function signPayload(p: CertPayload): Promise<string> {
  const data = b64url(encoder.encode(JSON.stringify(p)));
  const mac = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(data));
  return `${data}.${b64url(new Uint8Array(mac))}`;
}

export interface VerifyResult {
  valid: boolean;
  reason: string;
  payload?: CertPayload;
}

export async function verifyParam(d: string | null, sig: string | null): Promise<VerifyResult> {
  if (!d || !sig) return { valid: false, reason: "Missing credential data - scan the QR code on the certificate." };
  const [data, mac] = sig.split(".");
  if (data !== d) {
    // tolerate callers that pass full signed string in d
    if (!d.includes(".")) return { valid: false, reason: "Malformed credential string." };
  }
  const body = d.includes(".") ? d.split(".")[0] : d;
  const expected = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body));
  const expectedB64 = b64url(new Uint8Array(expected));
  const providedMac = mac || (d.includes(".") ? d.split(".")[1] : "");
  if (expectedB64 !== providedMac) {
    return { valid: false, reason: "Signature mismatch - this document was not issued by Oryx Institute." };
  }
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as CertPayload;
    return { valid: true, reason: "Authentic credential issued by Oryx Institute.", payload };
  } catch {
    return { valid: false, reason: "Credential payload unreadable." };
  }
}
