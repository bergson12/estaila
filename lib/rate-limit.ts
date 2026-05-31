import "server-only";

import { prisma } from "@/lib/db";

/**
 * Rate-limit por ventana deslizante en DB (Turso) — sin Redis ni dep nueva.
 * Para acciones IA caras (OCR, propuestas) que no están protegidas por créditos.
 * Fail-open: si el rate-limit falla, NO bloquea la función (es hardening, no
 * una barrera crítica). Tabla creada en runtime (patrón Turso).
 */

let schemaPromise: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "RateEvent" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "k" TEXT NOT NULL,
          "createdAt" TEXT NOT NULL
        )`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RateEvent_k_createdAt_idx" ON "RateEvent" ("k", "createdAt")`
      );
    } catch {
      /* ya existe u otro error no fatal */
    }
  })();
  return schemaPromise;
}

/**
 * Devuelve true si la acción está permitida (bajo el límite), false si excede.
 * @param key clave única (ej: "ocr:userId")
 * @param limit máximo de eventos permitidos en la ventana
 * @param windowSec tamaño de la ventana en segundos
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  try {
    await ensureSchema();
    const now = Date.now();
    const sinceIso = new Date(now - windowSec * 1000).toISOString();

    const rows = await prisma.$queryRawUnsafe<{ c: number | bigint }[]>(
      `SELECT COUNT(*) as c FROM "RateEvent" WHERE "k" = ? AND "createdAt" > ?`,
      key,
      sinceIso
    );
    const count = Number(rows?.[0]?.c ?? 0);
    if (count >= limit) return false;

    const id = `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "RateEvent" ("id", "k", "createdAt") VALUES (?, ?, ?)`,
      id,
      key,
      new Date(now).toISOString()
    );

    // Limpieza best-effort de eventos viejos (ventana * 4) de vez en cuando.
    if (Math.random() < 0.1) {
      const cutoff = new Date(now - windowSec * 4000).toISOString();
      await prisma
        .$executeRawUnsafe(`DELETE FROM "RateEvent" WHERE "createdAt" < ?`, cutoff)
        .catch(() => {});
    }

    return true;
  } catch {
    // Fail-open: no romper la función por un fallo del rate-limit.
    return true;
  }
}
