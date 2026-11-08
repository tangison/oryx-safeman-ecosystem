/**
 * Client-side PDF credential engine (zero-cost stack: no server, no DB).
 *
 * Builds:
 *   1. A4 LANDSCAPE CERTIFICATE - double frame (outer 2.5 pt accent, inner
 *      0.75 pt hairline), three-column footer: signature | serial | HMAC QR.
 *   2. PVC WALLET PASS 85.6 x 54 mm, front + back (tear-off second page).
 *
 * Typography: true brand fonts (Radley + Inter) fetched from /fonts and
 * embedded into the jsPDF VFS; graceful Times/Helvetica fallback offline.
 * Dates: live client date `YYYY-MM-DD` for online issue (brief: quality gate).
 */
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { ENROLL_EMAIL, FOUNDER_NAME, FOUNDER_TITLE, type Track } from "./brand";
import { signPayload, type CertPayload } from "./verify";

const ACADEMY = { accent: [106, 27, 41] as [number, number, number], hairline: [217, 207, 192] as [number, number, number], brand: "ORYX SAFETY ACADEMY", org: "ORYX INSTITUTE", domain: "oryxinstitute.org", paper: [250, 244, 234] as [number, number, number] };
const SAFEMAN = { accent: [20, 83, 45] as [number, number, number], hairline: [198, 216, 200] as [number, number, number], brand: "SAFEMAN BY ORYX", org: "ORYX INSTITUTE", domain: "safeman.oryxinstitute.org", paper: [248, 249, 245] as [number, number, number] };

let fontCache: Record<string, string> | null = null;

async function loadFontB64(): Promise<Record<string, string>> {
  if (fontCache) return fontCache;
  const load = async (url: string) => {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) {
        bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)) as unknown as number[]);
      }
      return btoa(bin);
    } catch {
      return null;
    }
  };
  const [radley, radleyItalic, inter, interSemi] = await Promise.all([
    load("/fonts/Radley-Regular.ttf"),
    load("/fonts/Radley-Italic.ttf"),
    load("/fonts/Inter-Regular.ttf"),
    load("/fonts/Inter-SemiBold.ttf"),
  ]);
  fontCache = { radley: radley || "", radleyItalic: radleyItalic || "", inter: inter || "", interSemi: interSemi || "" };
  return fontCache;
}

/** Register brand fonts on THIS document instance (jsPDF VFS is per-instance). */
async function applyBrandFonts(doc: jsPDF): Promise<void> {
  const fonts = await loadFontB64();
  const add = (b64: string, file: string, name: string, style: string) => {
    if (!b64) return;
    try {
      doc.addFileToVFS(file, b64);
      doc.addFont(file, name, style);
    } catch {
      /* keep core-font fallback */
    }
  };
  add(fonts.radley, "Radley-Regular.ttf", "Radley", "normal");
  add(fonts.radleyItalic, "Radley-Italic.ttf", "Radley", "italic");
  add(fonts.inter, "Inter-Regular.ttf", "Inter", "normal");
  add(fonts.interSemi, "Inter-SemiBold.ttf", "Inter", "bold");
}

async function fileToDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function hex(c: [number, number, number]): string {
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export interface CertRequest {
  learner: string;
  learnerId: string;
  courseCode: string;
  courseTitle: string;
  standards: string;
  track: Track;
  serial: string;
}

async function buildPayload(req: CertRequest): Promise<{ payload: CertPayload; signed: string }> {
  const payload: CertPayload = {
    s: req.serial,
    n: req.learner,
    c: req.courseCode,
    d: new Date().toISOString().split("T")[0],
    t: req.track === "safeman" ? "m" : "a",
  };
  const signed = await signPayload(payload);
  return { payload, signed };
}

function verifyUrl(track: Track, signed: string): string {
  const host = track === "safeman" ? "https://safeman.oryxinstitute.org" : "https://oryxinstitute.org";
  const [d, sig] = signed.split(".");
  return `${host}/verify?d=${d}&sig=${d}.${sig}`;
}

/* ---------------------------------------------------------------- certificate */
export async function downloadCertificate(req: CertRequest): Promise<void> {
  const theme = req.track === "safeman" ? SAFEMAN : ACADEMY;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await applyBrandFonts(doc);
  const W = 297, H = 210;

  const { payload, signed } = await buildPayload(req);
  const url = verifyUrl(req.track, signed);
  const qrData = await QRCode.toDataURL(url, { margin: 0, width: 480, errorCorrectionLevel: "M" });
  const sigImg = await fileToDataUrl("/assets/signatures/principal_signature.png");

  // paper
  doc.setFillColor(theme.paper[0], theme.paper[1], theme.paper[2]);
  doc.rect(0, 0, W, H, "F");

  // outer frame 2.5 pt accent (2.5pt = 0.88 mm), inner frame 0.75 pt hairline
  doc.setDrawColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.setLineWidth(0.88);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setDrawColor(theme.hairline[0], theme.hairline[1], theme.hairline[2]);
  doc.setLineWidth(0.264);
  doc.rect(14, 14, W - 28, H - 28);

  // brand mark: bordered serif initial + wordmark
  doc.setDrawColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.setLineWidth(0.7);
  doc.rect(W / 2 - 7, 22, 14, 14);
  doc.setFont("Radley", "normal");
  doc.setFontSize(15);
  doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.text(req.track === "safeman" ? "S" : "O", W / 2, 32, { align: "center" });
  doc.setFont("Inter", "bold");
  doc.setFontSize(11);
  doc.text(theme.brand, W / 2, 45, { align: "center" });
  doc.setFont("Inter", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 85, 78);
  doc.text(`${theme.org}  //  ${theme.domain}`, W / 2, 51, { align: "center" });

  // eyebrow
  doc.setFont("Inter", "bold");
  doc.setFontSize(9);
  doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.text("C E R T I F I C A T E   O F   A C H I E V E M E N T", W / 2, 68, { align: "center" });

  // recipient
  doc.setFont("Radley", "italic");
  doc.setFontSize(30);
  doc.setTextColor(24, 21, 20);
  doc.text(req.learner, W / 2, 88, { align: "center" });

  // programme
  doc.setFont("Radley", "normal");
  doc.setFontSize(13.5);
  doc.text("has completed", W / 2, 102, { align: "center" });
  doc.setFontSize(19);
  doc.text(`${req.courseCode} - ${req.courseTitle}`, W / 2, 114, { align: "center" });

  // standards line
  doc.setFont("Inter", "normal");
  doc.setFontSize(8);
  doc.setTextColor(92, 85, 78);
  const standards = req.standards.length > 120 ? req.standards.slice(0, 117) + "..." : req.standards;
  doc.text(standards, W / 2, 123, { align: "center" });

  // three-column footer
  const footY = 168;
  doc.setDrawColor(theme.hairline[0], theme.hairline[1], theme.hairline[2]);
  doc.setLineWidth(0.264);
  doc.line(24, footY - 8, W - 24, footY - 8);

  // col 1: signature
  if (sigImg) {
    try {
      doc.addImage(sigImg, "PNG", 26, footY - 4, 46, 14.2); // 240px-height plate preserved ratio ~3.25
    } catch {
      /* signature optional */
    }
  }
  doc.setDrawColor(24, 21, 20);
  doc.setLineWidth(0.35);
  doc.line(26, footY + 16, 84, footY + 16);
  doc.setFont("Inter", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(24, 21, 20);
  doc.text(FOUNDER_NAME.toUpperCase(), 26, footY + 22);
  doc.setFont("Inter", "normal");
  doc.setFontSize(7);
  doc.setTextColor(92, 85, 78);
  doc.text("Principal & Founder / Oryx Institute", 26, footY + 26);

  // col 2: serial + date
  doc.setFont("Inter", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(24, 21, 20);
  doc.text(req.serial, W / 2, footY + 8, { align: "center" });
  doc.setFont("Inter", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(92, 85, 78);
  doc.text(`ISSUED ${payload.d}`, W / 2, footY + 14, { align: "center" });
  doc.text(`LEARNER ID ${req.learnerId}`, W / 2, footY + 20, { align: "center" });
  doc.setFontSize(6.5);
  doc.text("VERIFY AT " + theme.domain.toUpperCase() + "/VERIFY", W / 2, footY + 26, { align: "center" });

  // col 3: QR (kept fully inside the inner frame; label clears it)
  doc.addImage(qrData, "PNG", W - 60, footY - 12, 32, 32);
  doc.setFontSize(6);
  doc.setTextColor(92, 85, 78);
  doc.text("SCAN TO VERIFY", W - 44, footY + 23, { align: "center" });

  doc.save(`${req.serial}_${req.learner.replace(/\s+/g, "_")}_certificate.pdf`);
}

/* ---------------------------------------------------------------- PVC card */
export async function downloadPvcPass(req: CertRequest): Promise<void> {
  const theme = req.track === "safeman" ? SAFEMAN : ACADEMY;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54] });
  await applyBrandFonts(doc);

  const { payload, signed } = await buildPayload(req);
  const url = verifyUrl(req.track, signed);
  const qrData = await QRCode.toDataURL(url, { margin: 0, width: 520, errorCorrectionLevel: "H" });
  const sigImg = await fileToDataUrl("/assets/signatures/principal_signature.png");

  /* ---- FRONT ---- */
  doc.setFillColor(250, 246, 240);
  doc.rect(0, 0, 85.6, 54, "F");
  // brand headband
  doc.setFillColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.rect(0, 0, 85.6, 11, "F");
  doc.setFont("Inter", "bold");
  doc.setFontSize(6.4);
  doc.setTextColor(255, 255, 255);
  doc.text(theme.brand, 4, 7);
  doc.setFont("Inter", "normal");
  doc.setFontSize(4.6);
  doc.text(theme.domain.toUpperCase(), 85.6 - 4, 7, { align: "right" });

  doc.setFont("Radley", "italic");
  doc.setFontSize(13.5);
  doc.setTextColor(24, 21, 20);
  doc.text(req.learner, 4, 22);

  doc.setFont("Inter", "bold");
  doc.setFontSize(6.6);
  doc.setTextColor(24, 21, 20);
  doc.text(req.serial, 4, 29);
  doc.setFont("Inter", "normal");
  doc.setFontSize(5.4);
  doc.setTextColor(92, 85, 78);
  doc.text(`ISSUED ${payload.d}   VALID THROUGH 2028-${payload.d.slice(5)}`, 4, 34);

  // endorsement badge
  doc.setDrawColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.setLineWidth(0.5);
  doc.rect(4, 38, 44, 8);
  doc.setFont("Inter", "bold");
  doc.setFontSize(5.4);
  doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.text(req.courseCode, 6, 43.2);

  // mini signature
  if (sigImg) {
    try {
      doc.addImage(sigImg, "PNG", 52, 36.4, 29.5, 9.1);
    } catch { /* optional */ }
  }
  doc.setDrawColor(24, 21, 20);
  doc.setLineWidth(0.25);
  doc.line(52, 47.4, 81.6, 47.4);
  doc.setFont("Inter", "normal");
  doc.setFontSize(4.4);
  doc.setTextColor(92, 85, 78);
  doc.text("PRINCIPAL - ORYX INSTITUTE", 52, 50.5);

  /* ---- BACK ---- */
  doc.addPage();
  doc.setFillColor(24, 21, 20);
  doc.rect(0, 0, 85.6, 54, "F");
  doc.addImage(qrData, "PNG", 4, 5, 34, 34);
  doc.setFont("Inter", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("VERIFY THIS CREDENTIAL", 44, 10);
  doc.setFont("Inter", "normal");
  doc.setFontSize(4.8);
  doc.setTextColor(210, 205, 196);
  const urlLines = doc.splitTextToSize(url.replace("https://", ""), 40);
  doc.text(urlLines.slice(0, 4), 44, 15);
  doc.setFontSize(4.6);
  doc.text(`IF FOUND: ${ENROLL_EMAIL}`, 44, 34);
  doc.setFontSize(4.2);
  doc.setTextColor(150, 142, 132);
  doc.text(`${req.serial}  -  HMAC-SHA256 SIGNED  -  NO DATABASE, STATELESS`, 44, 42);
  doc.text("PROPERTY OF ORYX INSTITUTE (PTY) LTD - NAMIBIA", 44, 46.5);

  doc.save(`${req.serial}_${req.learner.replace(/\s+/g, "_")}_pvc_pass.pdf`);
}
