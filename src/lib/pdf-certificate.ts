/**
 * Client-side PDF builder (jsPDF) for the SafeMan™ credential pack:
 *
 *   ┌──────────── A4 certificate ────────────┐
 *   │  green band · shield · wordmark        │
 *   │  name, course, standards, stats        │
 *   │  assessor signature line · QR · dates  │
 *   │  mandatory non-accredited disclosure   │
 *   ├───────── dashed cut line ──────────────┤
 *   │  FRONT card      │  BACK card          │   ← 85.6 mm × 54 mm PVC
 *   │  (tickets + QR)  │  (return info)      │      Site Safety Passport
 *   └────────────────────────────────────────┘
 *
 * No server involvement — runs fully in the browser.
 */
import type { CertRecord } from './storage';
import { SAFEMAN_SYSTEM, type SafeManCourse } from './data';
import { buildVerifyUrl } from './qr-crypto';

const GREEN = { r: 20, g: 83, b: 45 };
const INK = { r: 28, g: 25, b: 23 };
const GREY = { r: 110, g: 105, b: 100 };
const HAIR = { r: 198, g: 216, b: 200 };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function legible(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => Number(n));
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

export interface CertPdfOptions {
  record: CertRecord;
  /** Active SafeMan tickets shown on the passport card (including this one). */
  tickets: CertRecord[];
  disclosure?: string;
  assessor?: { name: string; role: string; company: string } | null;
  examQuestions?: number;
  passMark?: number;
}

async function qrDataUrl(text: string, dark: string, width = 512): Promise<string> {
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width,
    color: { dark, light: '#FFFFFF' },
  });
}

type JsPdf = import('jspdf').jsPDF;

function shield(doc: JsPdf, cx: number, top: number, w: number): void {
  const bodyH = w * 0.9;
  const pointH = w * 0.45;
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.roundedRect(cx - w / 2, top, w, bodyH, w * 0.18, w * 0.18, 'F');
  doc.triangle(
    cx - w / 2,
    top + bodyH - 0.5,
    cx + w / 2,
    top + bodyH - 0.5,
    cx,
    top + bodyH + pointH,
    'F',
  );
  // white check mark
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(w * 0.13);
  doc.setLineCap('round');
  doc.line(cx - w * 0.24, top + bodyH * 0.5, cx - w * 0.05, top + bodyH * 0.72);
  doc.line(cx - w * 0.05, top + bodyH * 0.72, cx + w * 0.28, top + bodyH * 0.26);
}

export async function generateCertificatePdf(opts: CertPdfOptions): Promise<string> {
  const { record } = opts;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const disclosure = opts.disclosure ?? SAFEMAN_SYSTEM.disclosure;

  /* ------------------------------------------- QR assets (async first) */
  const verifyUrl = buildVerifyUrl(record.d, record.sig);
  const certQr = await qrDataUrl(verifyUrl, '#14532D');
  const cardQr = await qrDataUrl(verifyUrl, '#000000', 640);

  /* ------------------------------------------------ header band ------ */
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.rect(0, 0, 210, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SAFEMAN\u2122 \u2014 SITE SAFETY PASSPORT SYSTEM', 12, 7.6, { charSpace: 0.3 });
  doc.setFont('helvetica', 'normal');
  doc.text('ORYX INSTITUTE', 198, 7.6, { align: 'right' });

  /* ------------------------------------------------ emblem / wordmark - */
  shield(doc, 105, 22, 17);
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  doc.setFont('times', 'bold');
  doc.setFontSize(27);
  doc.text('CERTIFICATE', 105, 58, { align: 'center', charSpace: 1.2 });
  doc.setFont('times', 'italic');
  doc.setFontSize(14.5);
  doc.text('of Competency & Attendance', 105, 66, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text('SafeMan\u2122 corporate competency benchmark \u00B7 safeman.oryxinstitute.org', 105, 72.5, {
    align: 'center',
  });

  /* ------------------------------------------------ learner block ----- */
  doc.setFontSize(9);
  doc.text('This certifies that', 105, 84, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(INK.r, INK.g, INK.b);
  const nameLines = doc.splitTextToSize(record.name || '\u2014', 170) as string[];
  doc.text(nameLines.slice(0, 2), 105, 92, { align: 'center' });
  let cursorY = 92 + (nameLines.length > 1 ? 14 : 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  const companyShort =
    record.company.length > 44 ? `${record.company.slice(0, 43)}\u2026` : record.company;
  doc.text(`National ID ${record.idMasked}  \u00B7  ${companyShort}`, 105, cursorY, {
    align: 'center',
  });
  cursorY += 7;

  doc.setFontSize(9);
  doc.text('has been assessed as competent in the SafeMan\u2122 course', 105, cursorY, {
    align: 'center',
  });
  cursorY += 6.5;
  doc.setFont('times', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  const courseLines = doc.splitTextToSize(record.courseTitle, 172) as string[];
  doc.text(courseLines.slice(0, 2), 105, cursorY, { align: 'center' });
  cursorY += courseLines.length > 1 ? 11 : 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(INK.r, INK.g, INK.b);
  const stdLines = doc.splitTextToSize(
    `Aligned standards:  ${record.standards.join('  \u00B7  ')}`,
    172,
  ) as string[];
  doc.text(stdLines.slice(0, 3), 105, cursorY, { align: 'center' });
  cursorY += Math.max(stdLines.filter(Boolean).length, 1) * 4 + 2;

  /* ------------------------------------------------ stats grid -------- */
  const stats: { label: string; value: string }[] = [
    { label: 'PASS MARK', value: `${opts.passMark ?? 70}%` },
    { label: 'KNOWLEDGE CHECK', value: `${opts.examQuestions ?? 0} questions` },
    { label: 'ISSUED', value: legible(record.issued) },
    { label: 'EXPIRES', value: legible(record.expires) },
  ];
  const gx = 24;
  const gy = cursorY + 4;
  stats.forEach((s, i) => {
    const x = gx + (i % 2) * 62;
    const y = gy + Math.floor(i / 2) * 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(GREY.r, GREY.g, GREY.b);
    doc.text(s.label, x, y, { charSpace: 0.4 });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(s.value, x, y + 5.5);
    doc.setDrawColor(HAIR.r, HAIR.g, HAIR.b);
    doc.setLineWidth(0.25);
    doc.line(x, y + 8.4, x + 52, y + 8.4);
  });

  /* ------------------------------------------------ QR + serial ------- */
  const qrX = 152;
  const qrY = gy - 6;
  doc.addImage(certQr, 'PNG', qrX, qrY, 34, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text('SCAN TO VERIFY', qrX + 17, qrY + 37.5, { align: 'center', charSpace: 0.5 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.6);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(record.serial, qrX + 17, qrY + 42.5, { align: 'center' });

  /* ------------------------------------------------ assessor line ----- */
  const signY = Math.max(gy + 32, qrY + 48);
  doc.setDrawColor(INK.r, INK.g, INK.b);
  doc.setLineWidth(0.3);
  doc.line(24, signY, 108, signY);
  const assessor = opts.assessor;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(assessor?.name || ' ', 26, signY + 4.6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text(
    assessor
      ? `Authorised Assessor \u00B7 ${assessor.role || '\u2014'} \u00B7 ${assessor.company || '\u2014'}`
      : 'Authorised Assessor \u00B7 signature and details on the practicum record',
    24,
    signY + 8.6,
  );

  /* ------------------------------------------------ disclosure -------- */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  const discLines = doc.splitTextToSize(`Mandatory disclosure \u2014 ${disclosure}`, 178) as string[];
  doc.text(discLines, 105, signY + 16, { align: 'center' });

  /* ------------------------------------------------ cut line ---------- */
  const cutY = 205;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text('CUT ALONG THIS LINE', 105, cutY - 2, { align: 'center', charSpace: 0.8 });
  doc.setDrawColor(GREY.r, GREY.g, GREY.b);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([1.6, 1.6], 0);
  doc.line(12, cutY, 198, cutY);
  doc.setLineDashPattern([], 0);

  /* ------------------------------------------------ PVC cards --------- */
  const cardW = 85.6;
  const cardH = 54;
  const cardY = 216;
  const frontX = (210 - (cardW * 2 + 6)) / 2;
  const backX = frontX + cardW + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text('FRONT \u2014 SITE SAFETY PASSPORT', frontX, cardY - 2.5, { charSpace: 0.6 });
  doc.text('BACK', backX, cardY - 2.5, { charSpace: 0.6 });

  const activeTickets = [
    record,
    ...opts.tickets.filter((t) => t.serial !== record.serial),
  ];
  drawFrontCard(doc, frontX, cardY, cardW, cardH, record, activeTickets, cardQr);
  drawBackCard(doc, backX, cardY, cardW, cardH, record);

  /* ------------------------------------------------ print note -------- */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text(
    'Print at 100% scale on A4. PVC card zone: 85.6 mm \u00D7 54 mm \u2014 print duplex and cut on the rounded border.',
    105,
    278,
    { align: 'center' },
  );

  const filename = `SafeMan-Certificate-${record.serial}.pdf`;
  doc.save(filename);
  return filename;
}

/* -------------------------------------------------------------------- */

function drawFrontCard(
  doc: JsPdf,
  x: number,
  y: number,
  w: number,
  h: number,
  record: CertRecord,
  tickets: CertRecord[],
  cardQr: string,
): void {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(INK.r, INK.g, INK.b);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, w, h, 2.4, 2.4, 'FD');

  // header band
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.roundedRect(x, y, w, 9, 2.4, 2.4, 'F');
  doc.rect(x, y + 5.5, w, 3.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.text('SAFEMAN\u2122', x + 4, y + 5.9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.text('SITE SAFETY PASSPORT', x + w - 4, y + 5.8, { align: 'right', charSpace: 0.4 });

  // learner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(INK.r, INK.g, INK.b);
  const nm = record.name.length > 34 ? `${record.name.slice(0, 33)}\u2026` : record.name;
  doc.text(nm, x + 4, y + 16.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  const co = record.company.length > 38 ? `${record.company.slice(0, 37)}\u2026` : record.company;
  doc.text(`ID ${record.idMasked}  \u00B7  ${co}`, x + 4, y + 21.5);

  // tickets
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.text('ACTIVE SAFEMAN TICKETS', x + 4, y + 26.5, { charSpace: 0.5 });
  doc.setDrawColor(HAIR.r, HAIR.g, HAIR.b);
  doc.setLineWidth(0.2);
  doc.line(x + 4, y + 28, x + w - 4, y + 28);

  const maxRows = 5;
  const rows = tickets.slice(0, maxRows);
  rows.forEach((t, i) => {
    const ry = y + 31.6 + i * 3.6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(t.courseCode, x + 4, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(GREY.r, GREY.g, GREY.b);
    doc.text(`valid to ${t.expires}`, x + w - 4, ry, { align: 'right' });
    if (i < rows.length - 1) {
      doc.setDrawColor(HAIR.r, HAIR.g, HAIR.b);
      doc.setLineWidth(0.12);
      doc.line(x + 4, ry + 1.1, x + w - 26, ry + 1.1);
    }
  });
  if (tickets.length > maxRows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.6);
    doc.setTextColor(GREY.r, GREY.g, GREY.b);
    doc.text(`+ ${tickets.length - maxRows} more on the register`, x + 4, y + 31.6 + maxRows * 3.6);
  }

  // serial + high-contrast QR
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text(record.serial, x + 4, y + h - 3.4);
  doc.addImage(cardQr, 'PNG', x + w - 21, y + h - 21.5, 17, 17);
  doc.setFontSize(4.4);
  doc.text('SCAN', x + w - 12.5, y + h - 2.8, { align: 'center', charSpace: 0.4 });
}

function drawBackCard(
  doc: JsPdf,
  x: number,
  y: number,
  w: number,
  h: number,
  record: CertRecord,
): void {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(INK.r, INK.g, INK.b);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, w, h, 2.4, 2.4, 'FD');

  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.roundedRect(x, y, w, 9, 2.4, 2.4, 'F');
  doc.rect(x, y + 5.5, w, 3.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.text('SAFEMAN\u2122', x + 4, y + 5.9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.text('ORYX INSTITUTE', x + w - 4, y + 5.8, { align: 'right' });

  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('This passport belongs to the named worker.', x + 4, y + 15.5);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text('If found, please contact the holder or:', x + 4, y + 20.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  doc.text(SAFEMAN_SYSTEM.contact, x + 4, y + 26.5);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFontSize(8);
  doc.text('safeman.oryxinstitute.org/verify', x + 4, y + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(GREY.r, GREY.g, GREY.b);
  doc.text(`Issued ${record.issued}  \u00B7  Expires ${record.expires}`, x + 4, y + 38);
  doc.text(`ID ${record.idMasked}  \u00B7  ${record.serial}`, x + 4, y + 42);

  const mini = doc.splitTextToSize(
    'SafeMan\u2122 is a proprietary non-accredited corporate competency benchmark of Oryx Institute. Verify every credential at the address above.',
    w - 8,
  ) as string[];
  doc.setFontSize(5.4);
  doc.text(mini, x + 4, y + h - 4 - (mini.length - 1) * 2.4);
}

/** Convenience wrapper used by the issuer to re-download a ledger record. */
export async function regenerateCertificatePdf(
  record: CertRecord,
  course: SafeManCourse,
  tickets: CertRecord[],
): Promise<string> {
  const { getAssessorFor } = await import('./credential');
  return generateCertificatePdf({
    record,
    tickets,
    assessor: getAssessorFor(record.courseId),
    examQuestions: course.questions_in_exam,
    passMark: course.pass_mark,
  });
}
