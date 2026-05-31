import {
  Building,
  Cross,
  Dumbbell,
  GraduationCap,
  MapPin,
  ShoppingBag,
  TramFront,
  Trees,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";

export type PoiTypeKey =
  | "RESTAURANT"
  | "SCHOOL"
  | "HOSPITAL"
  | "GYM"
  | "PARK"
  | "BEACH"
  | "MALL"
  | "TRANSPORT"
  | "CULTURE"
  | "OTHER";

export const POI_TYPE_META: Record<
  PoiTypeKey,
  { label: string; icon: LucideIcon; color: string }
> = {
  RESTAURANT: { label: "Restaurante", icon: Utensils, color: "#E07856" },
  SCHOOL: { label: "Escuela", icon: GraduationCap, color: "#3B82F6" },
  HOSPITAL: { label: "Hospital", icon: Cross, color: "#EF4444" },
  GYM: { label: "Gym", icon: Dumbbell, color: "#10B981" },
  PARK: { label: "Parque", icon: Trees, color: "#22C55E" },
  BEACH: { label: "Playa", icon: Waves, color: "#06B6D4" },
  MALL: { label: "Mall", icon: ShoppingBag, color: "#F59E0B" },
  TRANSPORT: { label: "Transporte", icon: TramFront, color: "#6366F1" },
  CULTURE: { label: "Cultura", icon: Building, color: "#A855F7" },
  OTHER: { label: "Otro", icon: MapPin, color: "#64748B" },
};

/** English labels for POI types (VALUE → English). Spanish source lives in POI_TYPE_META. */
const POI_TYPE_LABEL_EN: Record<PoiTypeKey, string> = {
  RESTAURANT: "Restaurant",
  SCHOOL: "School",
  HOSPITAL: "Hospital",
  GYM: "Gym",
  PARK: "Park",
  BEACH: "Beach",
  MALL: "Mall",
  TRANSPORT: "Transport",
  CULTURE: "Culture",
  OTHER: "Other",
};

/** Locale-aware label for a POI type key. Falls back to OTHER for unknown keys. */
export function poiLabel(type: string, locale?: "es" | "en"): string {
  const key = (type as PoiTypeKey) in POI_TYPE_META ? (type as PoiTypeKey) : "OTHER";
  if (locale === "en") return POI_TYPE_LABEL_EN[key];
  return POI_TYPE_META[key].label;
}

export function formatDistance(m?: number | null): string {
  if (m == null) return "—";
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}
