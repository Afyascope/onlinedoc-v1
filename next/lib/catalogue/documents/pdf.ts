import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type {
  ClinicalDocument,
  ClinicalReportDocument,
  DiagnosisDocumentItem,
  FacesheetDocument,
  PrescriptionDocument,
  PrescriptionDocumentItem,
  RequestDocument,
  RequestDocumentItem,
} from "./data";
import { formatPrescription } from "../../prescriptions/display";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const BRAND = rgb(0.173, 0.694, 0.737);
const BRAND_DARK = rgb(0.078, 0.569, 0.607);
const TEXT = rgb(0.122, 0.161, 0.216);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.85, 0.87, 0.89);
const LIGHT = rgb(0.95, 0.98, 0.98);

function sanitizePdfText(value: string): string {
  return value
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toISOString().slice(0, 10)}`;
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`;
}

class PdfLayout {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  page!: PDFPage;
  y = 0;
  pageNumber = 0;

  private constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
  }

  static async create(): Promise<PdfLayout> {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const layout = new PdfLayout(doc, regular, bold);
    layout.addPage();
    return layout;
  }

  addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNumber += 1;
    this.y = PAGE_HEIGHT - MARGIN;
    return this.page;
  }

  ensureSpace(height: number) {
    if (this.y - height < MARGIN + 30) this.addPage();
  }

  text(
    value: string,
    options: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; lineHeight?: number } = {},
  ) {
    const size = options.size ?? 10;
    const font = options.bold ? this.bold : this.regular;
    const color = options.color ?? TEXT;
    const x = options.x ?? MARGIN;
    const lineHeight = options.lineHeight ?? size * 1.35;
    const text = sanitizePdfText(value);
    for (const line of text.split(/\r?\n/)) {
      const wrapped = this.wrap(line, font, size, CONTENT_WIDTH - (x - MARGIN));
      for (const part of wrapped) {
        this.ensureSpace(lineHeight);
        this.page.drawText(part, { x, y: this.y - size, size, font, color });
        this.y -= lineHeight;
      }
    }
  }

  wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const safe = sanitizePdfText(text);
    if (!safe) return [""];
    const words = safe.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word;
      } else {
        let chunk = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(chunk + char, size) > maxWidth) {
            lines.push(chunk);
            chunk = char;
          } else {
            chunk += char;
          }
        }
        current = chunk;
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [""];
  }

  header(title: string, subtitle: string) {
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: BRAND });
    this.y = PAGE_HEIGHT - 34;
    this.page.drawText("OnlineDoc", { x: MARGIN, y: this.y - 18, size: 22, font: this.bold, color: BRAND_DARK });
    this.page.drawText(sanitizePdfText(subtitle), { x: MARGIN, y: this.y - 32, size: 8.5, font: this.regular, color: MUTED });
    this.y -= 46;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_WIDTH - MARGIN, y: this.y }, thickness: 1, color: LINE });
    this.y -= 20;
    this.page.drawText(sanitizePdfText(title), { x: MARGIN, y: this.y - 14, size: 16, font: this.bold, color: TEXT });
    this.y -= 28;
  }

  section(title: string) {
    this.ensureSpace(34);
    this.y -= 6;
    this.page.drawText(sanitizePdfText(title.toUpperCase()), { x: MARGIN, y: this.y - 9, size: 9, font: this.bold, color: BRAND_DARK });
    this.y -= 18;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_WIDTH - MARGIN, y: this.y }, thickness: 0.75, color: LINE });
    this.y -= 10;
  }

  metadata(pairs: { label: string; value: string }[]) {
    const columnWidth = CONTENT_WIDTH / 2;
    for (let index = 0; index < pairs.length; index += 2) {
      const row = pairs.slice(index, index + 2);
      const heights = row.map((pair) => {
        const lines = this.wrap(pair.value || "—", this.regular, 9.5, columnWidth - 12);
        return lines.length * 13 + 16;
      });
      const height = Math.max(...heights);
      this.ensureSpace(height);
      const top = this.y;
      row.forEach((pair, column) => {
        const x = MARGIN + column * columnWidth;
        this.page.drawText(sanitizePdfText(pair.label.toUpperCase()), { x, y: top - 8, size: 7, font: this.bold, color: MUTED });
        const lines = this.wrap(pair.value || "—", this.regular, 9.5, columnWidth - 12);
        let lineY = top - 21;
        for (const line of lines) {
          this.page.drawText(sanitizePdfText(line), { x, y: lineY, size: 9.5, font: this.regular, color: TEXT });
          lineY -= 13;
        }
      });
      this.y = top - height;
    }
  }

  callout(text: string) {
    if (!text) {
      this.text("No history notes were recorded.", { size: 9.5, color: MUTED });
      return;
    }
    const lines = this.wrap(text, this.regular, 9.5, CONTENT_WIDTH - 20);
    let remaining = [...lines];
    while (remaining.length > 0) {
      const available = Math.max(1, Math.floor((this.y - MARGIN - 30) / 13));
      const chunk = remaining.slice(0, available);
      const height = chunk.length * 13 + 16;
      this.ensureSpace(height);
      const top = this.y;
      this.page.drawRectangle({ x: MARGIN, y: top - height, width: CONTENT_WIDTH, height, color: LIGHT });
      this.page.drawRectangle({ x: MARGIN, y: top - height, width: 3, height, color: BRAND });
      let lineY = top - 14;
      for (const line of chunk) {
        this.page.drawText(sanitizePdfText(line), { x: MARGIN + 12, y: lineY, size: 9.5, font: this.regular, color: TEXT });
        lineY -= 13;
      }
      this.y = top - height - 8;
      remaining = remaining.slice(chunk.length);
    }
  }

  table(headers: string[], rows: string[][], widths: number[]) {
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    const scaled = widths.map((width) => (width / totalWidth) * CONTENT_WIDTH);
    const drawHeader = () => {
      const height = 22;
      this.ensureSpace(height + 20);
      const top = this.y;
      this.page.drawRectangle({ x: MARGIN, y: top - height, width: CONTENT_WIDTH, height, color: BRAND });
      let x = MARGIN + 6;
      headers.forEach((header, index) => {
        this.page.drawText(sanitizePdfText(header.toUpperCase()), { x, y: top - 14, size: 7.5, font: this.bold, color: rgb(1, 1, 1) });
        x += scaled[index];
      });
      this.y = top - height;
    };

    drawHeader();
    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, index) => this.wrap(cell || "—", this.regular, 8.5, scaled[index] - 12));
      const height = Math.max(18, ...cellLines.map((lines) => lines.length * 11 + 8));
      if (this.y - height < MARGIN + 30) {
        this.addPage();
        drawHeader();
      }
      const top = this.y;
      if (rowIndex % 2 === 1) {
        this.page.drawRectangle({ x: MARGIN, y: top - height, width: CONTENT_WIDTH, height, color: rgb(0.98, 0.99, 0.99) });
      }
      let x = MARGIN + 6;
      cellLines.forEach((lines, index) => {
        let lineY = top - 13;
        for (const line of lines) {
          this.page.drawText(sanitizePdfText(line), { x, y: lineY, size: 8.5, font: this.regular, color: TEXT });
          lineY -= 11;
        }
        x += scaled[index];
      });
      this.page.drawLine({ start: { x: MARGIN, y: top - height }, end: { x: PAGE_WIDTH - MARGIN, y: top - height }, thickness: 0.5, color: LINE });
      this.y = top - height;
    });
  }

  prescriptionCards(items: PrescriptionDocumentItem[]) {
    items.forEach((item, index) => {
      const display = formatPrescription({
        medication: item.medication,
        dosage: item.dosage,
        dosageForm: item.dosageForm,
        frequency: item.frequency,
        duration: item.duration,
        route: item.route,
        instructions: item.instructions,
        strength: item.strengthSnapshot,
      });
      const provenance = [
        item.genericNameSnapshot ? `Generic: ${item.genericNameSnapshot}` : "",
        item.brandNameSnapshot ? `Brand: ${item.brandNameSnapshot}` : "",
      ].filter(Boolean).join("   ");
      const body = [display.instruction, provenance].filter(Boolean).join("\n");
      const lines = this.wrap(body, this.regular, 9, CONTENT_WIDTH - 24);
      const headingLines = this.wrap(`${index + 1}. ${display.heading}`, this.bold, 10, CONTENT_WIDTH - 20);
      const headingHeight = headingLines.length * 13 + 6;
      const height = lines.length * 12 + headingHeight + 14;
      this.ensureSpace(height);
      const top = this.y;
      this.page.drawRectangle({ x: MARGIN, y: top - height, width: CONTENT_WIDTH, height, color: rgb(1, 1, 1), borderColor: LINE, borderWidth: 0.75 });
      this.page.drawRectangle({ x: MARGIN, y: top - height, width: CONTENT_WIDTH, height: headingHeight, color: LIGHT });
      let headingY = top - 15;
      for (const line of headingLines) {
        this.page.drawText(sanitizePdfText(line), { x: MARGIN + 10, y: headingY, size: 10, font: this.bold, color: BRAND_DARK });
        headingY -= 13;
      }
      let lineY = top - headingHeight - 5;
      for (const line of lines) {
        this.page.drawText(sanitizePdfText(line), { x: MARGIN + 10, y: lineY, size: 9, font: this.regular, color: TEXT });
        lineY -= 12;
      }
      this.y = top - height - 8;
    });
  }

  finish() {
    const generated = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
    const pages = this.doc.getPages();
    pages.forEach((page, index) => {
      page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 0.5, color: LINE });
      page.drawText(`OnlineDoc · Generated ${generated}`, { x: MARGIN, y: 30, size: 7.5, font: this.regular, color: MUTED });
      const label = `Page ${index + 1} of ${pages.length}`;
      const width = this.regular.widthOfTextAtSize(label, 7.5);
      page.drawText(label, { x: PAGE_WIDTH - MARGIN - width, y: 30, size: 7.5, font: this.regular, color: MUTED });
    });
  }
}

function patientMetadata(document: ClinicalDocument) {
  return [
    { label: "Patient", value: document.patient.name },
    { label: "Patient contact", value: document.patient.email ?? document.patient.identifier ?? "—" },
    { label: "Consultation", value: document.consultation.title },
    { label: "Consultation ID", value: document.consultation.id.slice(0, 12) },
    { label: "Consultation date", value: formatDate(document.consultation.createdAt) },
    { label: "Status", value: document.consultation.status.replace(/_/g, " ") },
    { label: "Clinician", value: document.clinician?.name ?? "—" },
    { label: "Clinician qualifications", value: document.clinician?.qualifications ?? "—" },
  ];
}

function requestRows(items: RequestDocumentItem[]): string[][] {
  return items.map((item) => [
    item.nameSnapshot,
    item.codeSnapshot ?? "—",
    item.modalitySnapshot ?? item.categorySnapshot ?? "—",
    item.notes ?? "—",
  ]);
}

function patientRequestRows(items: RequestDocumentItem[]): string[][] {
  return items.map((item) => [
    item.nameSnapshot,
    item.codeSnapshot ?? "—",
    item.modalitySnapshot ?? item.categorySnapshot ?? "—",
  ]);
}

function diagnosisRows(items: DiagnosisDocumentItem[]): string[][] {
  return items.map((item) => [
    item.nameSnapshot,
    item.codeSnapshot ?? "—",
    [item.codingSystemSnapshot, item.codingSystemVersionSnapshot].filter(Boolean).join(" ") || "—",
    item.notes ?? "—",
  ]);
}

function prescriptionRows(items: PrescriptionDocumentItem[]): string[][] {
  return items.map((item) => [
    item.medication,
    item.dosage,
    item.dosageForm ?? "—",
    item.frequency,
    item.duration ?? "—",
    item.route ?? "—",
  ]);
}

async function renderPrescription(document: PrescriptionDocument): Promise<Uint8Array> {
  const layout = await PdfLayout.create();
  layout.header(document.title, "Patient prescription");
  layout.section("Patient & consultation");
  layout.metadata(patientMetadata(document));
  layout.section("Prescription items");
  layout.prescriptionCards(document.items);
  layout.section("Prescriber");
  layout.text(
    `${document.clinician?.name ?? "OnlineDoc clinician"}${document.clinician?.specialization ? ` · ${document.clinician.specialization}` : ""}`,
    { size: 9.5 },
  );
  layout.finish();
  return layout.doc.save();
}

async function renderRequest(document: RequestDocument): Promise<Uint8Array> {
  const layout = await PdfLayout.create();
  layout.header(document.title, document.kind === "laboratory" ? "Laboratory investigation request" : "Imaging investigation request");
  layout.section("Patient & consultation");
  layout.metadata(patientMetadata(document));
  layout.section("Requested services");
  if (document.items.length === 0) {
    layout.text("No services were requested.", { size: 9.5, color: MUTED });
  } else {
    layout.table(
      ["Service", "Code", document.kind === "laboratory" ? "Category" : "Modality"],
      patientRequestRows(document.items),
      [4, 1.4, 2.3],
    );
  }
  layout.section("Requesting clinician");
  layout.text(
    `${document.clinician?.name ?? "OnlineDoc clinician"}${document.clinician?.specialization ? ` · ${document.clinician.specialization}` : ""}`,
    { size: 9.5 },
  );
  layout.finish();
  return layout.doc.save();
}

async function renderReport(document: ClinicalReportDocument): Promise<Uint8Array> {
  const layout = await PdfLayout.create();
  layout.header(document.title, "Confidential clinical record");
  layout.section("Patient & consultation");
  layout.metadata(patientMetadata(document));
  layout.section("Clinical summary");
  layout.callout(document.clinicalSummary);
  layout.section("Diagnoses");
  if (document.diagnoses.length === 0) layout.text("No structured diagnoses recorded.", { size: 9.5, color: MUTED });
  else layout.table(["Diagnosis", "Code", "Coding system", "Notes"], diagnosisRows(document.diagnoses), [4, 1.2, 2, 3]);
  layout.section("Laboratory requests");
  if (document.laboratory.length === 0) layout.text("No laboratory requests.", { size: 9.5, color: MUTED });
  else layout.table(["Test", "Code", "Category", "Notes"], requestRows(document.laboratory), [4, 1.2, 1.8, 3]);
  layout.section("Radiology requests");
  if (document.radiology.length === 0) layout.text("No radiology requests.", { size: 9.5, color: MUTED });
  else layout.table(["Service", "Code", "Modality", "Notes"], requestRows(document.radiology), [4, 1.2, 1.8, 3]);
  layout.section("Prescriptions");
  if (document.prescriptions.length === 0) layout.text("No prescriptions.", { size: 9.5, color: MUTED });
  else layout.table(["Medication", "Dosage", "Form", "Frequency", "Duration", "Route"], prescriptionRows(document.prescriptions), [3.6, 1.2, 1.2, 1.5, 1.3, 1.2]);
  layout.section("Advice");
  layout.text(document.notes?.advice || "No advice recorded.", { size: 9.5 });
  layout.section("Follow-up");
  layout.text(document.notes?.followUpDate ? formatDate(document.notes.followUpDate) : formatDate(document.consultation.followUpDate), { size: 9.5 });
  layout.section("Attribution");
  layout.text(`Completed ${formatDateTime(document.consultation.completedAt)} · ${document.clinician?.name ?? "OnlineDoc clinician"}`, { size: 9.5 });
  layout.finish();
  return layout.doc.save();
}

async function renderFacesheet(document: FacesheetDocument): Promise<Uint8Array> {
  const layout = await PdfLayout.create();
  layout.header(document.title, "Clinician-facing medical summary");
  layout.section("Patient");
  layout.metadata([
    { label: "Patient", value: document.patient.name },
    { label: "Contact", value: document.patient.email ?? "—" },
    { label: "Consultation", value: document.consultation.title },
    { label: "Status", value: document.consultation.status.replace(/_/g, " ") },
    { label: "Submitted", value: formatDate(document.consultation.createdAt) },
    { label: "Completed", value: formatDate(document.consultation.completedAt) },
    { label: "Clinician", value: document.clinician?.name ?? "—" },
    { label: "Follow-up", value: document.notes?.followUpDate ? formatDate(document.notes.followUpDate) : formatDate(document.consultation.followUpDate) },
  ]);
  layout.section("Presenting information");
  layout.metadata([
    { label: "Chief complaint", value: document.consultation.title },
    { label: "Symptoms", value: document.consultation.symptoms ?? "—" },
    { label: "Duration", value: document.consultation.durationOfIllness ?? "—" },
    { label: "Medical history", value: document.consultation.medicalHistory ?? "—" },
  ]);
  layout.section("Clinical summary");
  layout.callout(clinicalSummary(document));
  layout.section("Diagnoses");
  if (document.diagnoses.length === 0) layout.text("No structured diagnoses recorded.", { size: 9.5, color: MUTED });
  else layout.table(["Diagnosis", "Code", "Coding system", "Notes"], diagnosisRows(document.diagnoses), [4, 1.2, 2, 3]);
  layout.section("Requests");
  if (document.laboratory.length === 0 && document.radiology.length === 0) {
    layout.text("No investigations requested.", { size: 9.5, color: MUTED });
  } else {
    layout.table(
      ["Type", "Service", "Code", "Notes"],
      [
        ...document.laboratory.map((item) => ["Laboratory", item.nameSnapshot, item.codeSnapshot ?? "—", item.notes ?? "—"]),
        ...document.radiology.map((item) => ["Radiology", item.nameSnapshot, item.codeSnapshot ?? "—", item.notes ?? "—"]),
      ],
      [1.2, 4, 1.2, 3],
    );
  }
  layout.section("Prescriptions");
  if (document.prescriptions.length === 0) layout.text("No prescriptions.", { size: 9.5, color: MUTED });
  else layout.table(["Medication", "Dosage", "Form", "Frequency", "Duration", "Route"], prescriptionRows(document.prescriptions), [3.6, 1.2, 1.2, 1.5, 1.3, 1.2]);
  layout.section("Advice");
  layout.text(document.notes?.advice || "No advice recorded.", { size: 9.5 });
  layout.finish();
  return layout.doc.save();
}

function clinicalSummary(document: FacesheetDocument): string {
  return document.notes?.historyNotes?.trim() ?? "";
}

export async function renderClinicalDocument(document: ClinicalDocument): Promise<Uint8Array> {
  switch (document.kind) {
    case "prescription":
      return renderPrescription(document);
    case "laboratory":
    case "radiology":
      return renderRequest(document);
    case "report":
      return renderReport(document);
    case "facesheet":
      return renderFacesheet(document);
  }
}
