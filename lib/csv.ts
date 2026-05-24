/**
 * Minimal CSV parser — handles:
 * - Comma or semicolon (auto-detect)
 * - Quoted fields with escaped "" quotes
 * - BOM stripping
 * - Empty rows skipped
 * - Trim trailing whitespace per cell
 *
 * No external dependency. Sufficient for HubSpot / Sherlock / Excel exports.
 */

export type ParsedCSV = {
  headers: string[];
  rows: string[][];
  separator: "," | ";";
};

export function parseCSV(text: string): ParsedCSV {
  if (!text) return { headers: [], rows: [], separator: "," };

  // Strip UTF-8 BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  // Detect separator from first non-empty line
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const separator: "," | ";" = semicolons > commas ? ";" : ",";

  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === separator) {
      cur.push(cell.trim());
      cell = "";
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i++; // CRLF
      cur.push(cell.trim());
      cell = "";
      if (cur.some((x) => x !== "")) rows.push(cur);
      cur = [];
      continue;
    }
    cell += c;
  }
  // Trailing cell
  if (cell !== "" || cur.length) {
    cur.push(cell.trim());
    if (cur.some((x) => x !== "")) rows.push(cur);
  }

  if (rows.length === 0) return { headers: [], rows: [], separator };
  const headers = rows[0].map((h) => h.trim());
  return { headers, rows: rows.slice(1), separator };
}

/**
 * Heuristic: try to auto-map source column names to target fields.
 * Uses substring/synonym matching (case-insensitive, accent-insensitive).
 */
export function autoMapColumns(
  headers: string[],
  targetFields: { key: string; synonyms: string[] }[]
): Record<string, string> {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const headersNorm = headers.map((h) => ({ raw: h, norm: norm(h) }));
  const map: Record<string, string> = {};

  for (const t of targetFields) {
    for (const syn of t.synonyms) {
      const synN = norm(syn);
      const match = headersNorm.find(
        (h) =>
          !Object.values(map).includes(h.raw) &&
          (h.norm === synN || h.norm.includes(synN) || synN.includes(h.norm))
      );
      if (match) {
        map[t.key] = match.raw;
        break;
      }
    }
  }
  return map;
}
