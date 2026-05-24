/**
 * OpenStreetMap Overpass API client — nearby POI detection.
 * Free, global, no API key required (donation-funded — rate-limited).
 *
 * We map OSM tags to estaila POI types:
 *   amenity=restaurant / cafe / fast_food         → RESTAURANT
 *   amenity=school / kindergarten / university    → SCHOOL
 *   amenity=hospital / clinic / doctors / pharmacy→ HOSPITAL
 *   leisure=fitness_centre / sports_centre        → GYM
 *   leisure=park / garden                         → PARK
 *   natural=beach                                 → BEACH
 *   shop=mall / supermarket / convenience         → MALL
 *   public_transport=station / amenity=bus_station→ TRANSPORT
 *   tourism=museum / amenity=theatre / amenity=arts_centre → CULTURE
 */

import "server-only";

import type { PoiType } from "@/lib/places/poi-types";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type NearbySuggestion = {
  /** stable external id from OSM, prefixed: e.g. "node:12345" */
  externalId: string;
  name: string;
  type: PoiType;
  lat: number;
  lng: number;
  distanceM: number;
  /** Raw OSM tags forwarded to UI for tooltip / debug */
  tags: Record<string, string>;
  /** Optional contact info parsed from OSM tags */
  website: string | null;
  phone: string | null;
  /** OSM kind hint to set the icon if more specific */
  osmKey: string;
  osmValue: string;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

// ----------------------------------------------------------------
// Category → OSM filters
// ----------------------------------------------------------------

type Category = {
  type: PoiType;
  /** Tag pairs to look for (key, values[]). One node matching ANY counts. */
  selectors: Array<{ key: string; values: string[] }>;
  /** Hard cap per category — keeps result set small + relevant */
  limit: number;
};

const CATEGORIES: Category[] = [
  {
    type: "RESTAURANT",
    selectors: [
      { key: "amenity", values: ["restaurant", "cafe", "bar", "fast_food", "food_court"] },
    ],
    limit: 8,
  },
  {
    type: "SCHOOL",
    selectors: [
      { key: "amenity", values: ["school", "kindergarten", "university", "college"] },
    ],
    limit: 6,
  },
  {
    type: "HOSPITAL",
    selectors: [
      { key: "amenity", values: ["hospital", "clinic", "doctors", "pharmacy"] },
    ],
    limit: 6,
  },
  {
    type: "GYM",
    selectors: [
      { key: "leisure", values: ["fitness_centre", "sports_centre"] },
    ],
    limit: 5,
  },
  {
    type: "PARK",
    selectors: [
      { key: "leisure", values: ["park", "garden", "playground"] },
    ],
    limit: 5,
  },
  {
    type: "BEACH",
    selectors: [
      { key: "natural", values: ["beach"] },
      { key: "leisure", values: ["beach_resort"] },
    ],
    limit: 5,
  },
  {
    type: "MALL",
    selectors: [
      { key: "shop", values: ["mall", "supermarket", "department_store"] },
    ],
    limit: 5,
  },
  {
    type: "TRANSPORT",
    selectors: [
      { key: "public_transport", values: ["station", "stop_position"] },
      { key: "amenity", values: ["bus_station"] },
      { key: "railway", values: ["station", "subway_entrance"] },
      { key: "aeroway", values: ["aerodrome", "terminal"] },
    ],
    limit: 5,
  },
  {
    type: "CULTURE",
    selectors: [
      { key: "tourism", values: ["museum", "gallery", "attraction"] },
      { key: "amenity", values: ["theatre", "arts_centre", "library"] },
    ],
    limit: 5,
  },
];

// ----------------------------------------------------------------
// Distance (Haversine)
// ----------------------------------------------------------------

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ----------------------------------------------------------------
// Overpass QL query builder
// ----------------------------------------------------------------

function buildOverpassQuery(lat: number, lng: number, radius: number): string {
  const around = `around:${radius},${lat},${lng}`;
  const parts: string[] = [];
  for (const cat of CATEGORIES) {
    for (const sel of cat.selectors) {
      const values = sel.values.map((v) => v.replace(/"/g, "")).join("|");
      parts.push(`node["${sel.key}"~"^(${values})$"](${around});`);
      parts.push(`way["${sel.key}"~"^(${values})$"](${around});`);
    }
  }
  return `[out:json][timeout:25];
(
${parts.join("\n")}
);
out tags center 200;`;
}

// ----------------------------------------------------------------
// Tag → PoiType mapping
// ----------------------------------------------------------------

function classify(tags: Record<string, string>): {
  type: PoiType;
  osmKey: string;
  osmValue: string;
} | null {
  for (const cat of CATEGORIES) {
    for (const sel of cat.selectors) {
      const v = tags[sel.key];
      if (v && sel.values.includes(v)) {
        return { type: cat.type, osmKey: sel.key, osmValue: v };
      }
    }
  }
  return null;
}

// ----------------------------------------------------------------
// Main entry — fetch + parse + dedupe + cap by category
// ----------------------------------------------------------------

// Overpass mirrors — public community-funded. OSM Operations policy
// strongly prefers identified User-Agent; without it we get throttled fast.
// More mirrors give us more headroom on 429s.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Per OSM Operations Working Group policy
// (https://operations.osmfoundation.org/policies/api/)
const USER_AGENT =
  "estaila/1.0 (real-estate CRM; contact: hola@estaila.com)";

// ----------------------------------------------------------------
// In-process cache — dedupes repeated clicks within the same dev session.
// Keyed by rounded lat/lng + radius. 30 min TTL.
// Production should add a DB-backed cache (PropertyPOIs table or similar)
// to share between server instances and reduce load on community mirrors.
// ----------------------------------------------------------------

type CacheEntry = { data: NearbySuggestion[]; ts: number };
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function cacheKey(lat: number, lng: number, radius: number): string {
  // Round to ~10m precision so tiny coordinate changes still hit cache
  const rl = lat.toFixed(4);
  const rn = lng.toFixed(4);
  return `${rl}|${rn}|${radius}`;
}

function getCache(key: string): NearbySuggestion[] | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return e.data;
}

function setCache(key: string, data: NearbySuggestion[]) {
  cache.set(key, { data, ts: Date.now() });
  // Soft-cap cache size to avoid memory leak in long-running processes
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ----------------------------------------------------------------
// Main entry
// ----------------------------------------------------------------

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 1500
): Promise<NearbySuggestion[]> {
  const key = cacheKey(lat, lng, radius);
  const cached = getCache(key);
  if (cached) return cached;

  const query = buildOverpassQuery(lat, lng, radius);

  let lastError: Error | null = null;
  let raw: OverpassResponse | null = null;

  // Shuffle endpoint order so we don't always hammer the same primary.
  // First endpoint is still the one most likely to work but order varies.
  const endpoints = shuffle(OVERPASS_ENDPOINTS);

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // CRITICAL — Overpass throttles unidentified clients aggressively
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429 || res.status === 503) {
        // Rate-limited — back off briefly before next mirror
        lastError = new Error(`Overpass ${res.status} from ${endpoint}`);
        await sleep(600);
        continue;
      }
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status} from ${endpoint}`);
        continue;
      }
      raw = (await res.json()) as OverpassResponse;
      break;
    } catch (e) {
      lastError = e as Error;
      // Network/timeout — try next mirror right away
      continue;
    }
  }

  if (!raw) {
    throw new Error(
      `OpenStreetMap saturado en este momento. Intenta de nuevo en 30-60 segundos. ${
        lastError?.message ?? ""
      }`.trim()
    );
  }

  // Parse + filter + dedupe by name + compute distance
  const seen = new Set<string>();
  const byCategory = new Map<PoiType, NearbySuggestion[]>();

  for (const el of raw.elements) {
    const tags = el.tags ?? {};
    const name = (tags.name || tags["name:en"] || "").trim();
    if (!name) continue; // skip unnamed nodes (too noisy)

    const meta = classify(tags);
    if (!meta) continue;

    // Coords: node has lat/lon; way has center
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;

    // Dedupe by lowercased name (different OSM nodes for same building)
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const suggestion: NearbySuggestion = {
      externalId: `${el.type}:${el.id}`,
      name,
      type: meta.type,
      lat: elLat,
      lng: elLng,
      distanceM: distanceMeters(lat, lng, elLat, elLng),
      tags,
      website: tags.website || tags["contact:website"] || null,
      phone: tags.phone || tags["contact:phone"] || null,
      osmKey: meta.osmKey,
      osmValue: meta.osmValue,
    };

    const arr = byCategory.get(meta.type) ?? [];
    arr.push(suggestion);
    byCategory.set(meta.type, arr);
  }

  // Sort by distance per category + apply hard cap → flatten
  const result: NearbySuggestion[] = [];
  for (const cat of CATEGORIES) {
    const arr = byCategory.get(cat.type) ?? [];
    arr.sort((a, b) => a.distanceM - b.distanceM);
    result.push(...arr.slice(0, cat.limit));
  }

  // Final sort by distance globally so UI shows closest first
  result.sort((a, b) => a.distanceM - b.distanceM);

  // Cache for subsequent identical requests within TTL
  setCache(key, result);
  return result;
}
