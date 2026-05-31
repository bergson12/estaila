import "server-only";

import { prisma } from "@/lib/db";

/**
 * Analytics enriquecido por propiedad: eventos de vista de la landing pública
 * (día, dispositivo, ciudad, referrer). La tabla se crea en runtime con
 * CREATE TABLE IF NOT EXISTS (patrón Turso, sin migraciones formales).
 */

let schemaPromise: Promise<void> | null = null;

export function ensurePropertyViewSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "PropertyView" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "propertyId" TEXT NOT NULL,
          "device" TEXT NOT NULL DEFAULT 'desktop',
          "country" TEXT,
          "city" TEXT,
          "referrer" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "PropertyView_propertyId_createdAt_idx" ON "PropertyView" ("propertyId", "createdAt")`
      );
    } catch {
      /* tabla ya existe u otro error no fatal */
    }
  })();
  return schemaPromise;
}

export function deviceFromUA(ua: string | null | undefined): "mobile" | "desktop" {
  if (!ua) return "desktop";
  return /mobile|android|iphone|ipad|ipod|windows phone/i.test(ua)
    ? "mobile"
    : "desktop";
}

/** Los headers de geo de Vercel vienen URL-encoded (ej: "Santo%20Domingo"). */
export function decodeCity(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Registra una vista (best-effort, nunca bloquea el render). */
export async function recordPropertyView(input: {
  propertyId: string;
  device: "mobile" | "desktop";
  country?: string | null;
  city?: string | null;
  referrer?: string | null;
}): Promise<void> {
  try {
    await ensurePropertyViewSchema();
    await prisma.propertyView.create({
      data: {
        propertyId: input.propertyId,
        device: input.device,
        country: input.country || null,
        city: input.city || null,
        referrer: input.referrer ? input.referrer.slice(0, 200) : null,
      },
    });
  } catch {
    /* analytics no debe romper la página pública */
  }
}

export type PropertyAnalytics = {
  total: number;
  byDay: { day: string; count: number }[];
  devices: { mobile: number; desktop: number };
  topCities: { city: string; count: number }[];
};

const EMPTY: PropertyAnalytics = {
  total: 0,
  byDay: [],
  devices: { mobile: 0, desktop: 0 },
  topCities: [],
};

export async function getPropertyAnalytics(
  propertyId: string,
  days = 14
): Promise<PropertyAnalytics> {
  try {
    await ensurePropertyViewSchema();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await prisma.propertyView.findMany({
      where: { propertyId, createdAt: { gte: since } },
      select: { device: true, city: true, createdAt: true },
      take: 5000,
    });

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const counts = new Map<string, number>();
    const devices = { mobile: 0, desktop: 0 };
    const cityMap = new Map<string, number>();

    for (const r of rows) {
      const k = dayKey(new Date(r.createdAt));
      counts.set(k, (counts.get(k) ?? 0) + 1);
      if (r.device === "mobile") devices.mobile++;
      else devices.desktop++;
      if (r.city) cityMap.set(r.city, (cityMap.get(r.city) ?? 0) + 1);
    }

    const byDay: { day: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      byDay.push({ day: dayKey(d), count: counts.get(dayKey(d)) ?? 0 });
    }

    const topCities = [...cityMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    return { total: rows.length, byDay, devices, topCities };
  } catch {
    return EMPTY;
  }
}
