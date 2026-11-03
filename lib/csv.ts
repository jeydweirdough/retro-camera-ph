/**
 * Minimal RFC 4180 CSV: quoted fields, escaped quotes (""), commas and line
 * breaks inside quotes. Shared by the Studio catalog import/export, the
 * admin costs page and report downloads.
 */

export type CsvRow = Record<string, string>;

/** Parses CSV text into rows keyed by the header line. Blank lines are skipped. */
export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  // Excel adds a byte-order mark to UTF-8 files.
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      record.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const nonEmpty = records.filter((r) => r.some((value) => value.trim() !== ""));
  const [headerRow = [], ...dataRows] = nonEmpty;
  const headers = headerRow.map((h) => h.trim());
  const rows = dataRows.map((values) =>
    Object.fromEntries(headers.map((header, i) => [header, (values[i] ?? "").trim()])),
  );
  return { headers, rows };
}

function escapeField(value: string) {
  // Quote anything with a comma, quote or line break. Also neutralize
  // leading =, +, - and @ so a spreadsheet won't run the cell as a formula.
  const safe = /^[=+\-@]/.test(value) && !/^-?\d/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Rows to CSV text with a header line. Excel-friendly (BOM + CRLF). */
export function toCsv(headers: string[], rows: Record<string, string | number | boolean | null | undefined>[]) {
  const lines = [headers, ...rows.map((row) => headers.map((h) => String(row[h] ?? "")))];
  return "﻿" + lines.map((line) => line.map(escapeField).join(",")).join("\r\n") + "\r\n";
}
