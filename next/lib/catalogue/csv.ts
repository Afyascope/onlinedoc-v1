/**
 * Small dependency-free CSV reader for administrative catalogue uploads.
 * It supports quoted fields, escaped quotes, CRLF/LF, UTF-8 BOM and the three
 * common delimiters. It never interprets cell content as executable data.
 */

export interface CsvParseResult {
  rows: Record<string, string>[];
  delimiter: string;
  warnings: string[];
}

export function detectDelimiter(firstLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = countDelimiterOutsideQuotes(firstLine, candidate);
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

function countDelimiterOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      count += 1;
    }
  }
  return count;
}

export function parseCsv(input: string): CsvParseResult {
  const warnings: string[] = [];
  const text = input.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const matrix: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let sawContent = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    matrix.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
        if (char === "\n") line += 1;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      sawContent = true;
      continue;
    }
    if (char === delimiter) {
      pushField();
      sawContent = true;
      continue;
    }
    if (char === "\r") continue;
    if (char === "\n") {
      pushRow();
      line += 1;
      sawContent = false;
      continue;
    }
    field += char;
    sawContent = true;
  }

  if (quoted) warnings.push("The file ended inside a quoted field. Check the final row.");
  if (sawContent || field.length > 0 || row.length > 0) pushRow();

  const nonEmpty = matrix.filter((cells) => cells.some((cell) => cell.trim() !== ""));
  if (nonEmpty.length === 0) return { rows: [], delimiter, warnings };

  const headers = nonEmpty[0].map((header) => header.trim());
  if (headers.some((header) => header === "")) {
    warnings.push("The header row contains an empty column name. Empty columns are ignored.");
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
  for (let index = 1; index < nonEmpty.length; index += 1) {
    const cells = nonEmpty[index];
    const record: Record<string, string> = {};
    headers.forEach((header, columnIndex) => {
      if (!header) return;
      const value = cells[columnIndex] ?? "";
      if (value !== "") record[header] = value;
    });
    rows.push(record);
  }

  return { rows, delimiter, warnings };
}
