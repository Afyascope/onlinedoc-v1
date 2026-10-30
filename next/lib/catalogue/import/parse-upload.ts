import ExcelJS from "exceljs";
import { parseCsv } from "../csv";

export const MAX_CATALOGUE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CATALOGUE_HEADER_COLUMNS = 100;

export interface ParsedCatalogueFile {
  rows: Record<string, string>[];
  headers: string[];
  warnings: string[];
  fileType: "xlsx" | "csv";
  sheetName: string | null;
}

export class CatalogueFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogueFileError";
  }
}

const ALLOWED_EXTENSIONS = new Set(["xlsx", "csv"]);

const ALLOWED_MIME_TYPES = new Set([
  "text/csv",
  "text/plain",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
  "",
]);

export function fileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

export function validateUploadMetadata(name: string, type: string, size: number): "xlsx" | "csv" {
  const extension = fileExtension(name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new CatalogueFileError("Unsupported file type. Upload an .xlsx or .csv file.");
  }
  if (size <= 0) throw new CatalogueFileError("The uploaded file is empty.");
  if (size > MAX_CATALOGUE_FILE_BYTES) {
    throw new CatalogueFileError(`The uploaded file is larger than ${MAX_CATALOGUE_FILE_BYTES / (1024 * 1024)} MB.`);
  }
  if (!ALLOWED_MIME_TYPES.has((type || "").toLowerCase())) {
    throw new CatalogueFileError(`Unsupported file media type: ${type}.`);
  }
  return extension as "xlsx" | "csv";
}

export async function parseCatalogueUpload(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ParsedCatalogueFile> {
  const fileType = validateUploadMetadata(fileName, mimeType, buffer.byteLength);
  if (fileType === "csv") {
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      throw new CatalogueFileError("The CSV file must be UTF-8 encoded.");
    }
    const parsed = parseCsv(text);
    const headers = parsed.rows.length > 0 ? Object.keys(parsed.rows[0]) : [];
    if (headers.length === 0) throw new CatalogueFileError("The CSV file does not contain a header row.");
    if (headers.length > MAX_CATALOGUE_HEADER_COLUMNS) {
      throw new CatalogueFileError(`The header row contains more than ${MAX_CATALOGUE_HEADER_COLUMNS} columns.`);
    }
    return {
      rows: parsed.rows,
      headers,
      warnings: parsed.warnings,
      fileType,
      sheetName: null,
    };
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    throw new CatalogueFileError("The workbook is not a valid .xlsx file or is corrupt.");
  }

  if (workbook.worksheets.length === 0) {
    throw new CatalogueFileError("The workbook does not contain a worksheet.");
  }

  const warnings: string[] = [];
  if (workbook.worksheets.length > 1) {
    warnings.push(`The workbook contains ${workbook.worksheets.length} worksheets; only the first worksheet was imported.`);
  }

  const sheet = workbook.worksheets.find((candidate) => candidate.rowCount > 0) ?? workbook.worksheets[0];
  if (!sheet || sheet.rowCount === 0) {
    throw new CatalogueFileError("The first worksheet is empty.");
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  const columnCount = Math.min(Math.max(sheet.columnCount, headerRow.cellCount), MAX_CATALOGUE_HEADER_COLUMNS);
  if (sheet.columnCount > MAX_CATALOGUE_HEADER_COLUMNS) {
    throw new CatalogueFileError(`The worksheet contains more than ${MAX_CATALOGUE_HEADER_COLUMNS} columns.`);
  }
  for (let column = 1; column <= columnCount; column += 1) {
    headers.push(extractCell(sheet.getRow(1).getCell(column), warnings).trim());
  }
  if (headers.every((header) => header === "")) {
    throw new CatalogueFileError("The first worksheet does not contain a header row.");
  }
  const seenHeaders = new Set<string>();
  const duplicateHeaders = new Set<string>();
  for (const header of headers) {
    if (!header) continue;
    const key = header.toLowerCase();
    if (seenHeaders.has(key)) duplicateHeaders.add(header);
    else seenHeaders.add(key);
  }
  if (duplicateHeaders.size > 0) {
    warnings.push(`Duplicate column names: ${Array.from(duplicateHeaders).join(", ")}. The last non-empty value is used.`);
  }

  const rows: Record<string, string>[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const excelRow = sheet.getRow(rowNumber);
    const record: Record<string, string> = {};
    let hasValue = false;
    for (let column = 1; column <= columnCount; column += 1) {
      const header = headers[column - 1];
      if (!header) continue;
      const value = extractCell(excelRow.getCell(column), warnings);
      if (value !== "") {
        record[header] = value;
        hasValue = true;
      }
    }
    if (hasValue) rows.push(record);
  }

  return {
    rows,
    headers: headers.filter(Boolean),
    warnings,
    fileType,
    sheetName: sheet.name,
  };
}

function extractCell(cell: ExcelJS.Cell, warnings: string[]): string {
  if (cell.type === ExcelJS.ValueType.Formula) {
    const result = cell.value && typeof cell.value === "object" && "result" in cell.value
      ? (cell.value as { result?: unknown }).result
      : undefined;
    warnings.push(`Formula cell ${cell.address} was read using its cached value. Formulas are never executed.`);
    if (result === null || result === undefined) return "";
    if (result instanceof Date) return result.toISOString().slice(0, 10);
    if (typeof result === "object") return "";
    return String(result);
  }
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("text" in value && typeof (value as { text?: unknown }).text === "string") {
      return (value as { text: string }).text;
    }
    if ("richText" in value && Array.isArray((value as { richText?: unknown }).richText)) {
      return (value as { richText: { text: string }[] }).richText.map((part) => part.text).join("");
    }
    if ("hyperlink" in value) {
      const rich = value as { text?: string; hyperlink?: string };
      return rich.text || rich.hyperlink || "";
    }
    if ("error" in value) return "";
  }
  return "";
}
