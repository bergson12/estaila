/**
 * Catalog of amenity + POI keys used in luxury property landings.
 * Single source of truth for icon + label mapping.
 */
import {
  Waves,
  Sun,
  Dumbbell,
  Wifi,
  ShieldCheck,
  Car,
  Heart,
  Sparkles,
  ArrowUp,
  Trees,
  Flame,
  Baby,
  ShoppingBag,
  Utensils,
  Coffee,
  Plane,
  Hospital,
  GraduationCap,
  TreePine,
  Building2,
  Activity,
  Bath,
  ParkingCircle,
  Cctv,
  Lock,
  Cigarette,
  Sailboat,
  Tent,
  Bike,
  Music,
  Wine,
  Gamepad2,
  Snowflake,
  Sunset,
  Briefcase,
  Bus,
  Church,
  Cross,
  Drum,
  Film,
  Footprints,
  Landmark,
  PawPrint,
  Pizza,
  Store,
  Truck,
  Theater,
  Mountain,
  Anchor,
  Beer,
  type LucideIcon,
} from "lucide-react";

export type AmenityKey =
  | "POOL"
  | "INFINITY_POOL"
  | "ROOFTOP"
  | "GYM"
  | "SPA"
  | "SAUNA"
  | "JACUZZI"
  | "COWORK"
  | "SECURITY"
  | "CCTV"
  | "GATED"
  | "PARKING"
  | "VALET"
  | "PET"
  | "SMART_HOME"
  | "ELEVATOR"
  | "GARDEN"
  | "BBQ"
  | "PLAYGROUND"
  | "AC"
  | "FIREPLACE"
  | "GENERATOR"
  | "STORAGE"
  | "TERRACE"
  | "LAUNDRY"
  | "BEACH_ACCESS"
  | "DOCK"
  | "BIKE_STORAGE"
  | "EV_CHARGER"
  | "CINEMA"
  | "GAME_ROOM"
  | "WINE_CELLAR"
  | "CONCIERGE"
  | "GOLF"
  | "TENNIS"
  | "BASKETBALL"
  | "YOGA";

export const AMENITY_CATALOG: Record<
  AmenityKey,
  { icon: LucideIcon; label: string; desc: string; group?: string }
> = {
  // === Water ===
  POOL: { icon: Waves, label: "Piscina", desc: "Piscina común", group: "Agua" },
  INFINITY_POOL: {
    icon: Waves,
    label: "Piscina Infinity",
    desc: "Vista panorámica",
    group: "Agua",
  },
  JACUZZI: { icon: Bath, label: "Jacuzzi", desc: "Hidromasaje", group: "Agua" },
  SAUNA: { icon: Snowflake, label: "Sauna / Vapor", desc: "Spa wellness", group: "Agua" },
  SPA: { icon: Heart, label: "Spa", desc: "Tratamientos wellness", group: "Agua" },

  // === Fitness ===
  GYM: { icon: Dumbbell, label: "Gimnasio", desc: "Cardio y pesas", group: "Fitness" },
  YOGA: { icon: Activity, label: "Sala de yoga", desc: "Espacio meditación", group: "Fitness" },
  TENNIS: { icon: Activity, label: "Cancha de tenis", desc: "Profesional", group: "Fitness" },
  BASKETBALL: { icon: Activity, label: "Cancha basketball", desc: "", group: "Fitness" },
  GOLF: { icon: Sunset, label: "Golf course", desc: "Vista o acceso", group: "Fitness" },

  // === Outdoors ===
  ROOFTOP: { icon: Sun, label: "Rooftop", desc: "Terraza con vista", group: "Exterior" },
  GARDEN: { icon: Trees, label: "Jardines", desc: "Áreas verdes", group: "Exterior" },
  BBQ: { icon: Flame, label: "Área BBQ", desc: "Parrillas + comedor", group: "Exterior" },
  TERRACE: { icon: Sun, label: "Terraza privada", desc: "Por unidad", group: "Exterior" },
  PLAYGROUND: { icon: Baby, label: "Área de niños", desc: "Juegos seguros", group: "Exterior" },
  BEACH_ACCESS: { icon: Anchor, label: "Acceso a playa", desc: "Privado o cercano", group: "Exterior" },
  DOCK: { icon: Sailboat, label: "Muelle", desc: "Acceso al agua", group: "Exterior" },

  // === Security ===
  SECURITY: { icon: ShieldCheck, label: "Seguridad 24/7", desc: "Personal + cámaras", group: "Seguridad" },
  CCTV: { icon: Cctv, label: "Videovigilancia", desc: "CCTV en áreas comunes", group: "Seguridad" },
  GATED: { icon: Lock, label: "Comunidad cerrada", desc: "Acceso restringido", group: "Seguridad" },

  // === Tech / utility ===
  SMART_HOME: { icon: Sparkles, label: "Smart Home", desc: "Domótica integrada", group: "Tecnología" },
  GENERATOR: { icon: Sparkles, label: "Planta eléctrica", desc: "Full backup", group: "Tecnología" },
  AC: { icon: Snowflake, label: "Aire central", desc: "Climatización", group: "Tecnología" },
  FIREPLACE: { icon: Flame, label: "Chimenea", desc: "Gas o leña", group: "Tecnología" },
  EV_CHARGER: { icon: Car, label: "Cargador EV", desc: "Eléctricos preinstalación", group: "Tecnología" },
  ELEVATOR: { icon: ArrowUp, label: "Ascensor", desc: "Acceso directo", group: "Tecnología" },

  // === Parking ===
  PARKING: { icon: Car, label: "Parqueos", desc: "Cubiertos / privados", group: "Parqueo" },
  VALET: { icon: ParkingCircle, label: "Valet parking", desc: "Servicio de valet", group: "Parqueo" },
  BIKE_STORAGE: { icon: Bike, label: "Bici parking", desc: "Almacén de bicicletas", group: "Parqueo" },

  // === Lifestyle ===
  PET: { icon: PawPrint, label: "Pet Friendly", desc: "Áreas para mascotas", group: "Lifestyle" },
  CINEMA: { icon: Film, label: "Sala de cine", desc: "Mini teatro", group: "Lifestyle" },
  GAME_ROOM: { icon: Gamepad2, label: "Game room", desc: "Billar / juegos", group: "Lifestyle" },
  WINE_CELLAR: { icon: Wine, label: "Cava de vinos", desc: "Wine storage", group: "Lifestyle" },
  CONCIERGE: { icon: Briefcase, label: "Conserje", desc: "Atención personalizada", group: "Lifestyle" },
  COWORK: { icon: Wifi, label: "Coworking", desc: "Espacios de trabajo", group: "Lifestyle" },
  LAUNDRY: { icon: Sparkles, label: "Lavandería", desc: "Común o privada", group: "Lifestyle" },
  STORAGE: { icon: Briefcase, label: "Bodega", desc: "Storage adicional", group: "Lifestyle" },
};

export type POIKey =
  | "MALL"
  | "SUPERMARKET"
  | "RESTAURANTS"
  | "CAFES"
  | "BARS"
  | "BEACH"
  | "AIRPORT"
  | "HOSPITAL"
  | "PHARMACY"
  | "CLINIC"
  | "UNIVERSITY"
  | "SCHOOL"
  | "PARK"
  | "GYM_EXT"
  | "BANK"
  | "CHURCH"
  | "BUS_STATION"
  | "METRO"
  | "STADIUM"
  | "CINEMA_EXT"
  | "MUSEUM"
  | "MARINA"
  | "MOUNTAIN_TRAIL"
  | "GOLF_CLUB";

export const POI_CATALOG: Record<
  POIKey,
  { icon: LucideIcon; label: string; group?: string; query?: string }
> = {
  // Shopping
  MALL: { icon: ShoppingBag, label: "Centro Comercial", group: "Compras", query: "shopping_mall" },
  SUPERMARKET: { icon: Store, label: "Supermercado", group: "Compras", query: "supermarket" },
  // Food
  RESTAURANTS: { icon: Utensils, label: "Restaurantes premium", group: "Comida", query: "restaurant" },
  CAFES: { icon: Coffee, label: "Cafeterías", group: "Comida", query: "cafe" },
  BARS: { icon: Beer, label: "Bares & wine bars", group: "Comida", query: "bar" },
  // Nature
  BEACH: { icon: Waves, label: "Playa", group: "Naturaleza", query: "beach" },
  PARK: { icon: TreePine, label: "Parque / áreas verdes", group: "Naturaleza", query: "park" },
  MARINA: { icon: Anchor, label: "Marina / puerto", group: "Naturaleza", query: "marina" },
  MOUNTAIN_TRAIL: { icon: Mountain, label: "Trail / montaña", group: "Naturaleza", query: "trail" },
  // Transport
  AIRPORT: { icon: Plane, label: "Aeropuerto", group: "Transporte", query: "airport" },
  BUS_STATION: { icon: Bus, label: "Estación de bus", group: "Transporte", query: "bus_station" },
  METRO: { icon: Bus, label: "Metro / tren", group: "Transporte", query: "subway_station" },
  // Health
  HOSPITAL: { icon: Hospital, label: "Hospital", group: "Salud", query: "hospital" },
  CLINIC: { icon: Cross, label: "Clínica", group: "Salud", query: "clinic" },
  PHARMACY: { icon: Cross, label: "Farmacia", group: "Salud", query: "pharmacy" },
  // Education
  UNIVERSITY: { icon: GraduationCap, label: "Universidades", group: "Educación", query: "university" },
  SCHOOL: { icon: GraduationCap, label: "Colegios", group: "Educación", query: "school" },
  // Recreation
  GYM_EXT: { icon: Activity, label: "Gimnasio externo", group: "Recreación", query: "gym" },
  STADIUM: { icon: Activity, label: "Estadio", group: "Recreación", query: "stadium" },
  CINEMA_EXT: { icon: Film, label: "Cine", group: "Recreación", query: "movie_theater" },
  MUSEUM: { icon: Landmark, label: "Museo / cultura", group: "Recreación", query: "museum" },
  GOLF_CLUB: { icon: Sunset, label: "Golf Club", group: "Recreación", query: "golf_course" },
  // Services
  BANK: { icon: Landmark, label: "Banco / ATM", group: "Servicios", query: "bank" },
  CHURCH: { icon: Church, label: "Iglesia", group: "Servicios", query: "place_of_worship" },
};

export function parseJSON<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
