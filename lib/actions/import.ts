"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { autoMapColumns, parseCSV, type ParsedCSV } from "@/lib/csv";
import { fieldsFor, type FieldSpec, type ImportType } from "@/lib/import-schema";

export type { ImportType, FieldSpec } from "@/lib/import-schema";

// ---- Parse + preview ----

export type ImportPreview = {
  headers: string[];
  rows: string[][]; // first 8 rows
  totalRows: number;
  separator: string;
  suggestedMapping: Record<string, string>;
  fields: FieldSpec[];
};

export async function previewCSV(args: {
  type: ImportType;
  csvText: string;
}): Promise<ImportPreview> {
  await requireUser();
  const parsed: ParsedCSV = parseCSV(args.csvText);
  const fields = fieldsFor(args.type);
  const suggestedMapping = autoMapColumns(
    parsed.headers,
    fields.map((f) => ({ key: f.key, synonyms: [...f.synonyms] }))
  );
  return {
    headers: parsed.headers,
    rows: parsed.rows.slice(0, 8),
    totalRows: parsed.rows.length,
    separator: parsed.separator,
    suggestedMapping,
    fields: fields as FieldSpec[],
  };
}

// ---- Helpers ----

function normalizeCategory(raw: string): string {
  const n = raw.toLowerCase().trim();
  if (/casa|house|home|villa|chalet/.test(n)) return "CASA";
  if (/apto|apart|piso|condo|flat/.test(n)) return "APARTAMENTO";
  if (/solar/.test(n)) return "SOLAR";
  if (/terreno|land|lote|finca/.test(n)) return "TERRENO";
  if (/local|comercial|tienda|shop|store|retail/.test(n)) return "LOCAL_COMERCIAL";
  return "CASA";
}

function normalizeOperation(raw: string): string {
  const n = raw.toLowerCase().trim();
  if (/venta|sale|sell|sold/.test(n)) return n.includes("vend") ? "VENDIDA" : "EN_VENTA";
  if (/alqu|rent|lease/.test(n)) return n.includes("alqu_") ? "ALQUILADA" : "EN_ALQUILER";
  if (/consign/.test(n)) return "CONSIGNACION";
  return "EN_VENTA";
}

function normalizeContactType(raw: string): string {
  const n = raw.toLowerCase().trim();
  if (/propi|owner|landlord/.test(n)) return "PROPIETARIO";
  if (/inquil|tenant|renter/.test(n)) return "INQUILINO";
  if (/abog|lawyer|attorney/.test(n)) return "ABOGADO";
  if (/coleg|broker|agent/.test(n)) return "COLEGA_INMOBILIARIO";
  if (/plomero|plumber/.test(n)) return "PLOMERO";
  if (/electric/.test(n)) return "ELECTRICISTA";
  if (/contrat|contractor/.test(n)) return "CONTRATISTA";
  if (/empresa|company|business/.test(n)) return "EMPRESA";
  if (/utility|servic/.test(n)) return "UTILITY";
  return "CLIENTE";
}

function num(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^0-9.,\-]/g, "").replace(/,(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function int(raw: string | undefined): number | null {
  const n = num(raw);
  return n != null ? Math.round(n) : null;
}

// ---- Commit ----

export type CommitResult = {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export async function commitImport(args: {
  type: ImportType;
  csvText: string;
  mapping: Record<string, string>; // target field key → source header
}): Promise<CommitResult> {
  const user = await requireUser();
  const parsed = parseCSV(args.csvText);
  const fields = fieldsFor(args.type);

  // Build header index
  const headerIdx: Record<string, number> = {};
  parsed.headers.forEach((h, i) => (headerIdx[h] = i));

  const required = fields.filter((f) => f.required).map((f) => f.key);
  for (const r of required) {
    if (!args.mapping[r]) {
      throw new Error(
        `Falta mapeo obligatorio: ${fields.find((f) => f.key === r)?.label ?? r}`
      );
    }
  }

  const errors: { row: number; reason: string }[] = [];
  let imported = 0;
  let skipped = 0;

  const cellOf = (row: string[], key: string): string | undefined => {
    const header = args.mapping[key];
    if (!header) return undefined;
    const idx = headerIdx[header];
    if (idx === undefined) return undefined;
    return row[idx];
  };

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    try {
      if (args.type === "CONTACTS") {
        const name = (cellOf(row, "name") ?? "").trim();
        if (!name) {
          skipped++;
          continue;
        }
        await prisma.contact.create({
          data: {
            userId: user.id,
            name,
            email: cellOf(row, "email") || null,
            phone: cellOf(row, "phone") || null,
            whatsapp: cellOf(row, "whatsapp") || null,
            type: normalizeContactType(cellOf(row, "type") ?? "CLIENTE"),
            location: cellOf(row, "location") || null,
            rnc: cellOf(row, "rnc") || null,
            notes: cellOf(row, "notes") || null,
          },
        });
      } else {
        const title = (cellOf(row, "title") ?? "").trim();
        if (!title) {
          skipped++;
          continue;
        }
        const category = normalizeCategory(cellOf(row, "category") ?? "CASA");
        await prisma.property.create({
          data: {
            userId: user.id,
            title,
            description: cellOf(row, "description") || null,
            category,
            operation: normalizeOperation(cellOf(row, "operation") ?? "EN_VENTA"),
            status: "NUEVO",
            priceUSD: num(cellOf(row, "priceUSD")),
            bedrooms: int(cellOf(row, "bedrooms")),
            bathrooms: num(cellOf(row, "bathrooms")),
            parking: int(cellOf(row, "parking")),
            metersSquared: int(cellOf(row, "metersSquared")),
            location: cellOf(row, "location") || null,
            address: cellOf(row, "address") || null,
          },
        });
      }
      imported++;
    } catch (e) {
      errors.push({ row: i + 2, reason: (e as Error).message }); // +2 = header + 1-indexed
    }
  }

  await audit(user.id, "settings.update", null, {
    action: "import",
    type: args.type,
    imported,
    skipped,
    errors: errors.length,
  });

  revalidatePath(args.type === "CONTACTS" ? "/contactos" : "/propiedades");

  return { imported, skipped, errors };
}
