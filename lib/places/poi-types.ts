/**
 * POI category constants — shared client + server.
 * Kept out of lib/actions/poi.ts because that file is "use server"
 * and Next.js only allows async function exports from server files.
 */

export const POI_TYPES = [
  { key: "RESTAURANT", label: "Restaurante", icon: "Utensils" },
  { key: "SCHOOL", label: "Escuela / Universidad", icon: "GraduationCap" },
  { key: "HOSPITAL", label: "Hospital / Clínica", icon: "Cross" },
  { key: "GYM", label: "Gym / Fitness", icon: "Dumbbell" },
  { key: "PARK", label: "Parque", icon: "Trees" },
  { key: "BEACH", label: "Playa", icon: "Waves" },
  { key: "MALL", label: "Centro comercial", icon: "ShoppingBag" },
  { key: "TRANSPORT", label: "Transporte", icon: "TramFront" },
  { key: "CULTURE", label: "Cultura / Museo", icon: "Building" },
  { key: "OTHER", label: "Otro", icon: "MapPin" },
] as const;

export type PoiType = (typeof POI_TYPES)[number]["key"];
