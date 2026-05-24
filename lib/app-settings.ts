import "server-only";
import { prisma } from "./db";

export type AppSettingsValues = {
  defaultCredits: number;
  bannerMessage: string | null;
  bannerType: "INFO" | "WARN" | "SUCCESS";
  bannerActive: boolean;
  studioEnabled: boolean;
  marketingEnabled: boolean;
  signupsEnabled: boolean;
  maintenanceMode: boolean;
  aiProvider: "AUTO" | "GEMINI" | "MOCK";
};

const DEFAULTS: AppSettingsValues = {
  defaultCredits: 5,
  bannerMessage: null,
  bannerType: "INFO",
  bannerActive: false,
  studioEnabled: true,
  marketingEnabled: true,
  signupsEnabled: true,
  maintenanceMode: false,
  aiProvider: "AUTO",
};

/**
 * Get app settings. Creates the singleton row on first access.
 * Cached in-memory for 30s to avoid hitting DB on every request.
 */
let cache: { values: AppSettingsValues; loadedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getAppSettings(): Promise<AppSettingsValues> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.values;
  }
  const row = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  if (!row) {
    await prisma.appSettings.create({ data: { id: "singleton" } });
    cache = { values: DEFAULTS, loadedAt: Date.now() };
    return DEFAULTS;
  }
  const values: AppSettingsValues = {
    defaultCredits: row.defaultCredits,
    bannerMessage: row.bannerMessage,
    bannerType: row.bannerType as AppSettingsValues["bannerType"],
    bannerActive: row.bannerActive,
    studioEnabled: row.studioEnabled,
    marketingEnabled: row.marketingEnabled,
    signupsEnabled: row.signupsEnabled,
    maintenanceMode: row.maintenanceMode,
    aiProvider: row.aiProvider as AppSettingsValues["aiProvider"],
  };
  cache = { values, loadedAt: Date.now() };
  return values;
}

export function invalidateAppSettingsCache() {
  cache = null;
}
