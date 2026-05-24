/**
 * Google Maps URL parser — extracts lat/lng from various URL shapes.
 * Pure / client-safe. For short links (goo.gl, maps.app.goo.gl) use the
 * server action `extractCoordsFromMapsUrl` in lib/actions/poi.ts, which
 * follows the redirect first and then calls this parser.
 *
 * Supported formats:
 *   • /maps/place/.../@LAT,LNG,zoom        — old place URLs
 *   • /maps?q=LAT,LNG                       — query param numeric
 *   • /maps/search/LAT,LNG/                 — search numeric
 *   • !3dLAT!4dLNG                          — data param (most modern)
 *   • /maps/@LAT,LNG,zoom                   — bare viewport
 *   • ll=LAT,LNG (legacy)
 *   • iwloc parameter in dir links
 */

export type Coords = { lat: number; lng: number };

const LAT_LNG_RE = /(-?\d{1,2}\.\d{2,15}),(-?\d{1,3}\.\d{2,15})/;

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    // Reject 0,0 (likely garbage)
    !(lat === 0 && lng === 0)
  );
}

function pick(match: RegExpMatchArray | null): Coords | null {
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  return isValidCoord(lat, lng) ? { lat, lng } : null;
}

export function parseGoogleMapsUrl(rawUrl: string): Coords | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url) return null;

  // 1) `!3dLAT!4dLNG` — most accurate (place pin coordinates)
  //    Common in: /maps/place/Bvlgari+Hotel/@18.48,-69.93,17z/data=!4m6!3m5!1s0x.../!3d18.4861!4d-69.9312!16s...
  const dataMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  const dataCoords = pick(dataMatch);
  if (dataCoords) return dataCoords;

  // 2) `@LAT,LNG,zoom` — viewport center (used in /maps/place URLs)
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  const atCoords = pick(atMatch);
  if (atCoords) return atCoords;

  // 3) Query string ?q= / ?ll= / ?center=
  try {
    const parsed = new URL(url);
    for (const key of ["q", "ll", "center", "destination"]) {
      const v = parsed.searchParams.get(key);
      if (v) {
        const m = v.match(LAT_LNG_RE);
        const c = pick(m);
        if (c) return c;
      }
    }
  } catch {
    // not a valid URL — try raw regex below
  }

  // 4) /maps/search/LAT,LNG/
  const searchMatch = url.match(/\/search\/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  const searchCoords = pick(searchMatch);
  if (searchCoords) return searchCoords;

  // 5) Last-resort: any "lat,lng" looking pair in the URL string
  //    (matches Plus Codes-adjacent URLs, embedded params, etc.)
  const fallback = url.match(LAT_LNG_RE);
  const fallbackCoords = pick(fallback);
  if (fallbackCoords) return fallbackCoords;

  return null;
}

/** Heuristic: is this a Google Maps URL we *might* be able to parse? */
export function looksLikeGoogleMapsUrl(url: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("google.com/maps") ||
    u.includes("maps.google.") ||
    u.includes("goo.gl/maps") ||
    u.includes("maps.app.goo.gl")
  );
}

/** Heuristic: is this a short link that requires redirect resolution? */
export function isShortGoogleMapsUrl(url: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes("goo.gl/maps") || u.includes("maps.app.goo.gl");
}
