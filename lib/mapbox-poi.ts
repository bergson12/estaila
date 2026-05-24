"use client";

import { POI_CATALOG, type POIKey } from "./portal-catalog";

/**
 * Mapbox Search Box API — proximity-based category search.
 * Falls back gracefully when no token configured.
 *
 * https://docs.mapbox.com/api/search/search-box/#interactive-search
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export type POIResult = {
  key: string; // catalog key or custom
  label: string;
  distance: string; // "5 min" or "1.2 km"
  rawDistanceKm?: number;
};

const AVG_WALK_KM_PER_MIN = 0.08; // 4.8 km/h walking
const AVG_DRIVE_KM_PER_MIN = 0.5; // 30 km/h urban driving

function formatDistance(km: number): string {
  if (km < 1) {
    const min = Math.max(1, Math.round(km / AVG_WALK_KM_PER_MIN));
    return `${min} min caminando`;
  }
  if (km < 5) {
    const min = Math.max(1, Math.round(km / AVG_DRIVE_KM_PER_MIN));
    return `${min} min`;
  }
  return `${km.toFixed(1)} km`;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(sa));
}

/**
 * Find nearby POIs across all catalog categories.
 * If MAPBOX_TOKEN is set: uses Mapbox Search Box category endpoint.
 * Else: returns empty array + token-missing warning.
 */
export async function searchNearbyPOIs(input: {
  lat: number;
  lng: number;
  /** which catalog keys to query — default: top 8 most useful */
  categoryKeys?: POIKey[];
  /** per-category limit */
  perCategory?: number;
}): Promise<{
  results: POIResult[];
  warning?: string;
}> {
  const cats =
    input.categoryKeys ??
    ([
      "MALL",
      "SUPERMARKET",
      "RESTAURANTS",
      "CAFES",
      "BEACH",
      "PARK",
      "HOSPITAL",
      "UNIVERSITY",
    ] as POIKey[]);

  if (!MAPBOX_TOKEN) {
    return {
      results: [],
      warning:
        "Mapbox token no configurado. Define NEXT_PUBLIC_MAPBOX_TOKEN en .env para activar la búsqueda automática.",
    };
  }

  const perCat = input.perCategory ?? 1;

  const results: POIResult[] = [];

  for (const key of cats) {
    const cat = POI_CATALOG[key];
    if (!cat?.query) continue;
    try {
      const url = new URL(
        `https://api.mapbox.com/search/searchbox/v1/category/${cat.query}`
      );
      url.searchParams.set("access_token", MAPBOX_TOKEN);
      url.searchParams.set("proximity", `${input.lng},${input.lat}`);
      url.searchParams.set("limit", String(perCat));
      url.searchParams.set("language", "es");

      const res = await fetch(url.toString());
      if (!res.ok) continue;
      const data = await res.json();
      const features: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { name?: string };
      }> = data.features ?? [];
      for (const f of features) {
        const [lng2, lat2] = f.geometry?.coordinates ?? [0, 0];
        if (!lat2 || !lng2) continue;
        const km = haversineKm(
          { lat: input.lat, lng: input.lng },
          { lat: lat2, lng: lng2 }
        );
        results.push({
          key,
          label: cat.label,
          distance: formatDistance(km),
          rawDistanceKm: km,
        });
      }
    } catch {
      // skip category on error
    }
  }

  return { results };
}

/**
 * Forward geocode an address → lat/lng using Mapbox.
 * If no token, fallback to OpenStreetMap Nominatim (rate-limited, free).
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; place?: string } | null> {
  if (!address.trim()) return null;

  if (MAPBOX_TOKEN) {
    try {
      const url = new URL(
        "https://api.mapbox.com/search/geocode/v6/forward"
      );
      url.searchParams.set("q", address);
      url.searchParams.set("limit", "1");
      url.searchParams.set("access_token", MAPBOX_TOKEN);
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const data = await res.json();
      const f = data.features?.[0];
      if (!f) return null;
      const [lng, lat] = f.geometry.coordinates;
      return { lat, lng, place: f.properties?.place_formatted ?? f.properties?.name };
    } catch {
      return null;
    }
  }

  // Nominatim fallback (OpenStreetMap)
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "es" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.[0];
    if (!f) return null;
    return {
      lat: parseFloat(f.lat),
      lng: parseFloat(f.lon),
      place: f.display_name,
    };
  } catch {
    return null;
  }
}
