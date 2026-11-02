/**
 * Credential assembly: turns a passed course + learner profile into a signed,
 * ledger-backed certificate record. Pure client-side (Web Crypto HMAC).
 */
import { courseCode, type SafeManCourse } from './data';
import {
  encodeAndSignPayload,
  buildVerifyUrl,
  makeSerial,
  maskId,
  type QrPayload,
} from './qr-crypto';
import { getPracticumSignoff, nextSeqForCode, addToLedger, getLedger, type CertRecord } from './storage';

export interface IssueInput {
  course: SafeManCourse;
  fullName: string;
  idNumber: string;
  company: string;
  issuedDate?: Date;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return toIsoDate(d);
}

/** Build + sign a record. Does NOT touch the ledger. */
export async function createCertificateRecord(input: IssueInput): Promise<CertRecord> {
  const { course, fullName, idNumber, company } = input;
  const issued = toIsoDate(input.issuedDate ?? new Date());
  const expires = addMonths(issued, course.cert_validity_months);
  const code = courseCode(course.id);
  const year = Number(issued.slice(0, 4));
  const serial = makeSerial(year, code, nextSeqForCode(code));

  const payload: QrPayload = {
    s: serial,
    n: fullName,
    id: maskId(idNumber),
    c: course.title,
    co: company,
    st: course.standards.join('|'),
    iss: issued,
    exp: expires,
    p: 'VERIFIED',
  };

  const { d, sig } = await encodeAndSignPayload(payload);

  return {
    serial,
    courseId: course.id,
    courseCode: code,
    courseTitle: course.title,
    name: fullName,
    idMasked: payload.id,
    company,
    standards: course.standards,
    issued,
    expires,
    d,
    sig,
  };
}

/** Create, persist to the ledger, and return the record. */
export async function issueCertificate(input: IssueInput): Promise<CertRecord> {
  const record = await createCertificateRecord(input);
  addToLedger(record);
  return record;
}

/**
 * Optional fire-and-forget relay. Never throws, never blocks issuance.
 */
export function relayToWebhook(record: CertRecord): void {
  const url = process.env.NEXT_PUBLIC_WEBHOOK_URL;
  if (!url) return;
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'safeman.certificate.issued',
        serial: record.serial,
        course: record.courseTitle,
        courseCode: record.courseCode,
        name: record.name,
        idMasked: record.idMasked,
        company: record.company,
        standards: record.standards,
        issued: record.issued,
        expires: record.expires,
        verifyUrl: buildVerifyUrl(record.d, record.sig),
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* never block on relay failures */
  }
}

export function getAssessorFor(courseId: string): {
  name: string;
  role: string;
  company: string;
} | null {
  const s = getPracticumSignoff(courseId);
  if (!s) return null;
  return { name: s.assessorName, role: s.assessorRole, company: s.company };
}

export function ledgerCount(): number {
  return getLedger().length;
}
