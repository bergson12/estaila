"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  isShortGoogleMapsUrl,
  parseGoogleMapsUrl,
  type Coords,
} from "@/lib/maps-url-parser";
import type { PoiType } from "@/lib/places/poi-types";

// ============================================================
// Validation
// ============================================================

const PoiSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum([
    "RESTAURANT",
    "SCHOOL",
    "HOSPITAL",
    "GYM",
    "PARK",
    "BEACH",
    "MALL",
    "TRANSPORT",
    "CULTURE",
    "OTHER",
  ]),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  description: z.string().trim().max(800).optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  walkMinutes: z.coerce.number().int().min(0).max(999).optional(),
  carMinutes: z.coerce.number().int().min(0).max(999).optional(),
  pinned: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
});

// ============================================================
// Haversine distance helper (server-side, meters)
// ============================================================

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

async function ensureOwnership(propertyId: string, userId: string) {
  const prop = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, userId: true, lat: true, lng: true },
  });
  if (!prop || prop.userId !== userId) {
    throw new Error("Propiedad no encontrada");
  }
  return prop;
}

// ============================================================
// CRUD ACTIONS
// ============================================================

export async function createPOI(
  propertyId: string,
  input: z.infer<typeof PoiSchema>
) {
  const user = await requireUser();
  const prop = await ensureOwnership(propertyId, user.id);
  const data = PoiSchema.parse(input);

  const lastOrder = await prisma.propertyPOI.findFirst({
    where: { propertyId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const distanceM =
    prop.lat != null && prop.lng != null
      ? distanceMeters(Number(prop.lat), Number(prop.lng), data.lat, data.lng)
      : null;

  const poi = await prisma.propertyPOI.create({
    data: {
      propertyId,
      name: data.name,
      type: data.type,
      icon: data.icon || null,
      description: data.description || null,
      url: data.url || null,
      imageUrl: data.imageUrl || null,
      lat: data.lat,
      lng: data.lng,
      walkMinutes: data.walkMinutes,
      carMinutes: data.carMinutes,
      pinned: !!data.pinned,
      color: data.color || null,
      order: (lastOrder?.order ?? 0) + 1,
      distanceM,
    },
  });

  revalidatePath(`/propiedades/${propertyId}`);
  return poi;
}

export async function updatePOI(
  id: string,
  input: Partial<z.infer<typeof PoiSchema>>
) {
  const user = await requireUser();
  const poi = await prisma.propertyPOI.findUnique({
    where: { id },
    include: { property: { select: { userId: true, lat: true, lng: true } } },
  });
  if (!poi || poi.property.userId !== user.id) {
    throw new Error("POI no encontrado");
  }

  const data = PoiSchema.partial().parse(input);

  // Recompute distance if lat/lng change
  let distanceM = poi.distanceM;
  const newLat = data.lat ?? poi.lat;
  const newLng = data.lng ?? poi.lng;
  if (poi.property.lat != null && poi.property.lng != null) {
    distanceM = distanceMeters(
      Number(poi.property.lat),
      Number(poi.property.lng),
      newLat,
      newLng
    );
  }

  const updated = await prisma.propertyPOI.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.icon !== undefined && { icon: data.icon || null }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.url !== undefined && { url: data.url || null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.lat !== undefined && { lat: data.lat }),
      ...(data.lng !== undefined && { lng: data.lng }),
      ...(data.walkMinutes !== undefined && { walkMinutes: data.walkMinutes }),
      ...(data.carMinutes !== undefined && { carMinutes: data.carMinutes }),
      ...(data.pinned !== undefined && { pinned: !!data.pinned }),
      ...(data.color !== undefined && { color: data.color || null }),
      distanceM,
    },
  });

  revalidatePath(`/propiedades/${poi.propertyId}`);
  return updated;
}

export async function deletePOI(id: string) {
  const user = await requireUser();
  const poi = await prisma.propertyPOI.findUnique({
    where: { id },
    include: { property: { select: { userId: true, id: true } } },
  });
  if (!poi || poi.property.userId !== user.id) {
    throw new Error("POI no encontrado");
  }
  await prisma.propertyPOI.delete({ where: { id } });
  revalidatePath(`/propiedades/${poi.property.id}`);
  return { ok: true };
}

export async function reorderPOIs(propertyId: string, ids: string[]) {
  const user = await requireUser();
  await ensureOwnership(propertyId, user.id);

  await prisma.$transaction(
    ids.map((id, idx) =>
      prisma.propertyPOI.update({ where: { id }, data: { order: idx + 1 } })
    )
  );
  revalidatePath(`/propiedades/${propertyId}`);
  return { ok: true };
}

export async function togglePinPOI(id: string) {
  const user = await requireUser();
  const poi = await prisma.propertyPOI.findUnique({
    where: { id },
    include: { property: { select: { userId: true, id: true } } },
  });
  if (!poi || poi.property.userId !== user.id) {
    throw new Error("POI no encontrado");
  }
  const updated = await prisma.propertyPOI.update({
    where: { id },
    data: { pinned: !poi.pinned },
  });
  revalidatePath(`/propiedades/${poi.property.id}`);
  return updated;
}

// ============================================================
// Extract coords from a Google Maps URL (handles short links)
// ============================================================

/**
 * Extracts lat/lng from a Google Maps URL.
 * - Long URLs (google.com/maps/...) are parsed directly.
 * - Short URLs (goo.gl/maps, maps.app.goo.gl) are expanded via fetch
 *   (HEAD/GET that follows redirects) so we can read the canonical URL.
 *
 * Returns null when nothing usable is found.
 */
export async function extractCoordsFromMapsUrl(
  url: string
): Promise<Coords | null> {
  // Auth gate — public action could be abused for SSRF probing.
  await requireUser();

  if (!url || typeof url !== "string") return null;
  const cleaned = url.trim();
  if (!cleaned) return null;

  // Try direct parse first — fast path for long URLs
  const direct = parseGoogleMapsUrl(cleaned);
  if (direct) return direct;

  // Short link: follow redirect to canonical URL, then parse
  if (isShortGoogleMapsUrl(cleaned)) {
    try {
      // Use GET with manual redirect=follow + small timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(cleaned, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          // Some Google endpoints serve different markup to bots vs browsers
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
      });
      clearTimeout(timeout);

      // 1) Parse the final URL (after redirects)
      const finalUrl = res.url || cleaned;
      const fromFinal = parseGoogleMapsUrl(finalUrl);
      if (fromFinal) return fromFinal;

      // 2) Parse the HTML body — Google sometimes embeds the canonical URL
      //    in a meta refresh / og:url even when the URL itself is opaque
      const html = await res.text();
      // Look for og:url or canonical link
      const ogMatch =
        html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      if (ogMatch) {
        const fromOg = parseGoogleMapsUrl(ogMatch[1]);
        if (fromOg) return fromOg;
      }

      // 3) Fallback: scrape any "@lat,lng" / "!3d!4d" pattern in the HTML
      const fromBody = parseGoogleMapsUrl(html);
      if (fromBody) return fromBody;
    } catch (e) {
      // Swallow — caller will handle the null
      console.warn("extractCoordsFromMapsUrl failed:", (e as Error).message);
    }
  }

  return null;
}

// ============================================================
// Auto-detect nearby POIs (OpenStreetMap Overpass)
// ============================================================

/**
 * Queries OpenStreetMap for interesting places near the property
 * (restaurants, schools, hospitals, gyms, parks, beach, malls, transport,
 * culture). Returns up to ~40 suggestions — user picks which to save via
 * `bulkCreatePOIs`. Property MUST have lat/lng set.
 */
export async function suggestNearbyPlaces(
  propertyId: string,
  options?: { radius?: number }
) {
  const user = await requireUser();
  const prop = await ensureOwnership(propertyId, user.id);

  if (prop.lat == null || prop.lng == null) {
    throw new Error(
      "Esta propiedad no tiene coordenadas. Fija la ubicación en el mapa primero."
    );
  }

  // Lazy import to keep the bundle off the client
  const { fetchNearbyPlaces } = await import("@/lib/places/overpass");

  const radius = Math.min(Math.max(options?.radius ?? 1500, 250), 5000);
  const suggestions = await fetchNearbyPlaces(
    Number(prop.lat),
    Number(prop.lng),
    radius
  );

  // Mark which suggestions already exist as POIs (by name+type close-by)
  const existing = await prisma.propertyPOI.findMany({
    where: { propertyId },
    select: { id: true, name: true, type: true, lat: true, lng: true },
  });
  const existingKeys = new Set(
    existing.map((p) => `${p.type}::${p.name.toLowerCase()}`)
  );

  return suggestions.map((s) => ({
    ...s,
    alreadyAdded: existingKeys.has(`${s.type}::${s.name.toLowerCase()}`),
  }));
}

/**
 * Bulk insert suggestions chosen by the user. Skips ones that already exist
 * (by name+type — case-insensitive).
 */
export async function bulkCreatePOIs(
  propertyId: string,
  items: Array<{
    name: string;
    type: PoiType;
    lat: number;
    lng: number;
    description?: string;
    url?: string;
  }>
) {
  const user = await requireUser();
  const prop = await ensureOwnership(propertyId, user.id);

  if (!items || items.length === 0) return { created: 0 };

  // Get existing for dedupe
  const existing = await prisma.propertyPOI.findMany({
    where: { propertyId },
    select: { name: true, type: true },
  });
  const existingKeys = new Set(
    existing.map((p) => `${p.type}::${p.name.toLowerCase()}`)
  );

  const lastOrder = await prisma.propertyPOI.findFirst({
    where: { propertyId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let nextOrder = (lastOrder?.order ?? 0) + 1;

  const propLat = prop.lat != null ? Number(prop.lat) : null;
  const propLng = prop.lng != null ? Number(prop.lng) : null;

  const toCreate = items
    .filter((it) => !existingKeys.has(`${it.type}::${it.name.toLowerCase()}`))
    .map((it) => {
      const distanceM =
        propLat != null && propLng != null
          ? distanceMetersHaversine(propLat, propLng, it.lat, it.lng)
          : null;
      return {
        propertyId,
        name: it.name.trim().slice(0, 120),
        type: it.type,
        description: it.description?.trim().slice(0, 800) || null,
        url: it.url?.trim() || null,
        lat: it.lat,
        lng: it.lng,
        distanceM,
        order: nextOrder++,
        pinned: false,
      };
    });

  if (toCreate.length === 0) return { created: 0 };

  await prisma.propertyPOI.createMany({ data: toCreate });
  revalidatePath(`/propiedades/${propertyId}`);
  return { created: toCreate.length };
}

function distanceMetersHaversine(
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

// ============================================================
// Save property coordinates (used when user clicks the map)
// ============================================================

export async function setPropertyCoordinates(
  propertyId: string,
  lat: number,
  lng: number
) {
  const user = await requireUser();
  await ensureOwnership(propertyId, user.id);

  // Update prop coords + recompute all POI distances
  const prop = await prisma.property.update({
    where: { id: propertyId },
    data: { lat, lng },
  });

  const pois = await prisma.propertyPOI.findMany({
    where: { propertyId },
    select: { id: true, lat: true, lng: true },
  });
  await prisma.$transaction(
    pois.map((p) =>
      prisma.propertyPOI.update({
        where: { id: p.id },
        data: {
          distanceM: distanceMeters(lat, lng, p.lat, p.lng),
        },
      })
    )
  );

  revalidatePath(`/propiedades/${propertyId}`);
  return prop;
}
