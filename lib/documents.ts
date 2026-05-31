import "server-only";

import { prisma } from "@/lib/db";

/**
 * Tabla de documentos subidos por el agente. Se crea en runtime con
 * CREATE TABLE IF NOT EXISTS (patrón Turso, sin migraciones formales).
 */

let schemaPromise: Promise<void> | null = null;

export function ensureUploadedDocSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "UploadedDocument" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "userId" TEXT NOT NULL,
          "propertyId" TEXT,
          "contactId" TEXT,
          "name" TEXT NOT NULL,
          "fileUrl" TEXT NOT NULL,
          "mimeType" TEXT,
          "kind" TEXT NOT NULL DEFAULT 'OTRO',
          "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "UploadedDocument_userId_createdAt_idx" ON "UploadedDocument" ("userId", "createdAt")`
      );
    } catch {
      /* tabla ya existe u otro error no fatal */
    }
  })();
  return schemaPromise;
}

export const DOC_KINDS = ["PROPUESTA", "CONTRATO", "RECIBO", "OTRO"] as const;
export const DOC_STATUSES = [
  "PENDIENTE",
  "ENVIADO",
  "FIRMADO",
  "CERRADO",
  "RECHAZADO",
] as const;
