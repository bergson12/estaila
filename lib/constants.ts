// Domain constants — neutral labels (country-agnostic)

export const CATEGORIES = [
  { value: "CASA", label: "Casa", icon: "Home" },
  { value: "APARTAMENTO", label: "Apartamento", icon: "Building2" },
  { value: "SOLAR", label: "Solar", icon: "TreePine" },
  { value: "TERRENO", label: "Terreno", icon: "Trees" },
  { value: "LOCAL_COMERCIAL", label: "Local comercial", icon: "Store" },
] as const;
export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const OPERATIONS = [
  { value: "EN_VENTA", label: "En venta", color: "success" },
  { value: "EN_ALQUILER", label: "En alquiler", color: "warning" },
  { value: "VENDIDA", label: "Vendida", color: "muted" },
  { value: "ALQUILADA", label: "Alquilada", color: "destructive" },
  { value: "CONSIGNACION", label: "Consignación", color: "muted" },
] as const;
export type OperationValue = (typeof OPERATIONS)[number]["value"];

export const PROPERTY_STATUSES = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "EN_PLANO", label: "En plano" },
  { value: "EN_CONSTRUCCION", label: "En construcción" },
  { value: "DESLINDADA", label: "Deslindada" },
] as const;
export type PropertyStatusValue = (typeof PROPERTY_STATUSES)[number]["value"];

export const CONTACT_TYPES = [
  { value: "PROPIETARIO", label: "Propietario", icon: "KeyRound" },
  { value: "CLIENTE", label: "Cliente", icon: "UserCheck" },
  { value: "INQUILINO", label: "Inquilino", icon: "Users" },
  { value: "ABOGADO", label: "Abogado", icon: "Scale" },
  { value: "COLEGA_INMOBILIARIO", label: "Colega inmobiliario", icon: "Handshake" },
  { value: "PLOMERO", label: "Plomero", icon: "Wrench" },
  { value: "ELECTRICISTA", label: "Electricista", icon: "Zap" },
  { value: "CONTRATISTA", label: "Contratista", icon: "HardHat" },
  { value: "EMPRESA", label: "Empresa", icon: "Briefcase" },
  { value: "UTILITY", label: "Utility", icon: "Plug" },
] as const;
export type ContactTypeValue = (typeof CONTACT_TYPES)[number]["value"];

export const PIPELINE_STAGES = [
  { value: "NUEVO", label: "Nuevo", color: "bg-muted text-muted-foreground" },
  { value: "CONTACTADO", label: "Contactado", color: "bg-blue-500/10 text-blue-500" },
  { value: "VISITA", label: "Visita", color: "bg-amber-500/10 text-amber-500" },
  {
    value: "NEGOCIACION",
    label: "Negociación",
    color: "bg-violet-500/10 text-violet-400",
  },
  {
    value: "CERRADO",
    label: "Cerrado",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    value: "PERDIDO",
    label: "Perdido",
    color: "bg-destructive/10 text-destructive",
  },
] as const;

/**
 * Etiquetas en inglés por `value` para los enums de dominio mostrados en UI.
 * `labelFor(..., "en")` las usa; sin locale o "es" devuelve la etiqueta ES.
 * (i18n del panel — se amplía a medida que se traducen más módulos.)
 */
const EN_LABELS: Record<string, string> = {
  // Categorías
  CASA: "House",
  APARTAMENTO: "Apartment",
  SOLAR: "Lot",
  TERRENO: "Land",
  LOCAL_COMERCIAL: "Commercial",
  // Operaciones
  EN_VENTA: "For sale",
  EN_ALQUILER: "For rent",
  VENDIDA: "Sold",
  ALQUILADA: "Rented",
  CONSIGNACION: "Consignment",
  // Estados de propiedad
  NUEVO: "New",
  EN_PLANO: "Off-plan",
  EN_CONSTRUCCION: "Under construction",
  DESLINDADA: "Surveyed",
  // Tipos de contacto
  PROPIETARIO: "Owner",
  CLIENTE: "Client",
  INQUILINO: "Tenant",
  ABOGADO: "Lawyer",
  COLEGA_INMOBILIARIO: "Realtor colleague",
  PLOMERO: "Plumber",
  ELECTRICISTA: "Electrician",
  CONTRATISTA: "Contractor",
  EMPRESA: "Company",
  UTILITY: "Utility",
  // Etapas de pipeline
  CONTACTADO: "Contacted",
  VISITA: "Visit",
  NEGOCIACION: "Negotiation",
  CERRADO: "Closed",
  PERDIDO: "Lost",
  // Estilos de staging (Studio)
  MODERN: "Modern",
  SCANDINAVIAN: "Scandinavian",
  JAPANDI: "Japandi",
  MID_CENTURY: "Mid-Century",
  CARIBENO: "Tropical",
  COLONIAL: "Colonial",
  MINIMALISTA: "Minimalist",
  LUXURY: "Luxury",
  INDUSTRIAL: "Industrial",
  COSTERO: "Coastal",
  BOHEMIAN: "Bohemian",
  FARMHOUSE: "Farmhouse",
  ART_DECO: "Art Deco",
  AIRBNB: "Airbnb",
  OFFICE_PRO: "Pro Office",
  // Tipos de habitación (Studio)
  LIVING: "Living room",
  BEDROOM: "Bedroom",
  KITCHEN: "Kitchen",
  DINING: "Dining room",
  BATHROOM: "Bathroom",
  OFFICE: "Office",
  KIDS: "Kids",
  EXTERIOR: "Exterior",
  BALCONY: "Balcony",
  POOL: "Pool",
  // Iluminación (Studio)
  NATURAL: "Natural",
  WARM: "Warm",
  BRIGHT: "Bright",
  MOODY: "Moody",
  GOLDEN_HOUR: "Golden Hour",
  // Buyer targets
  FAMILY: "Family",
  YOUNG_COUPLE: "Young couple",
  EXECUTIVE: "Executive",
  INVESTOR: "Investor",
  RETIREE: "Retiree",
  DIGITAL_NOMAD: "Digital nomad",
};

export function labelFor<T extends ReadonlyArray<{ value: string; label: string }>>(
  list: T,
  value: string | null | undefined,
  locale?: "es" | "en"
) {
  if (locale === "en" && value && EN_LABELS[value]) return EN_LABELS[value];
  return list.find((x) => x.value === value)?.label ?? value ?? "—";
}

export const AI_TOOLS = [
  { value: "STAGING", label: "Virtual Staging", credits: 2 },
  { value: "DECLUTTER", label: "Eliminar objetos", credits: 1 },
  { value: "ENHANCE", label: "Mejorar calidad", credits: 1 },
  { value: "STYLE_CHANGE", label: "Cambiar estilo", credits: 2 },
  { value: "SKY", label: "Cielo despejado", credits: 1 },
  { value: "TWILIGHT", label: "Atardecer", credits: 1 },
  { value: "POOL", label: "Piscina cristalina", credits: 1 },
  { value: "LAWN", label: "Césped verde", credits: 1 },
  { value: "ADD_OBJECT", label: "Colocar objeto", credits: 1 },
  { value: "REMOVE_OBJECT", label: "Quitar objeto", credits: 1 },
] as const;
export type AIToolValue = (typeof AI_TOOLS)[number]["value"];

// Each entry uses a `icon` string mapped to a Lucide icon name.
// Components import iconFor() helper from lib/utils.ts to render the SVG.
export const STAGING_STYLES = [
  { value: "MODERN", label: "Moderno", icon: "Sofa" },
  { value: "SCANDINAVIAN", label: "Escandinavo", icon: "Mountain" },
  { value: "JAPANDI", label: "Japandi", icon: "Leaf" },
  { value: "MID_CENTURY", label: "Mid-Century", icon: "Armchair" },
  { value: "CARIBENO", label: "Tropical", icon: "Palmtree" },
  { value: "COLONIAL", label: "Colonial", icon: "Building2" },
  { value: "MINIMALISTA", label: "Minimalista", icon: "Circle" },
  { value: "LUXURY", label: "Luxury", icon: "Gem" },
  { value: "INDUSTRIAL", label: "Industrial", icon: "Factory" },
  { value: "COSTERO", label: "Costero", icon: "Waves" },
  { value: "BOHEMIAN", label: "Bohemio", icon: "Flower2" },
  { value: "FARMHOUSE", label: "Farmhouse", icon: "Home" },
  { value: "ART_DECO", label: "Art Deco", icon: "Sparkles" },
  { value: "AIRBNB", label: "Airbnb", icon: "House" },
  { value: "FAMILY", label: "Family", icon: "Users" },
  { value: "OFFICE_PRO", label: "Oficina Pro", icon: "Briefcase" },
] as const;

export const ROOM_TYPES = [
  { value: "LIVING", label: "Sala", icon: "Sofa" },
  { value: "BEDROOM", label: "Dormitorio", icon: "Bed" },
  { value: "KITCHEN", label: "Cocina", icon: "ChefHat" },
  { value: "DINING", label: "Comedor", icon: "Utensils" },
  { value: "BATHROOM", label: "Baño", icon: "Bath" },
  { value: "OFFICE", label: "Oficina", icon: "Monitor" },
  { value: "KIDS", label: "Niños", icon: "Baby" },
  { value: "EXTERIOR", label: "Exterior", icon: "Trees" },
  { value: "BALCONY", label: "Balcón", icon: "Sunset" },
  { value: "POOL", label: "Piscina", icon: "Waves" },
] as const;

export const LIGHT_MOODS = [
  { value: "NATURAL", label: "Natural", desc: "Luz neutra de día" },
  { value: "WARM", label: "Cálida", desc: "Tonos dorados acogedores" },
  { value: "BRIGHT", label: "Brillante", desc: "Alta iluminación fresca" },
  { value: "MOODY", label: "Atmósfera", desc: "Sombras suaves dramáticas" },
  { value: "GOLDEN_HOUR", label: "Golden Hour", desc: "Atardecer cálido" },
] as const;

export const BUYER_TARGETS = [
  { value: "FAMILY", label: "Familia con niños", icon: "Users" },
  { value: "YOUNG_COUPLE", label: "Pareja joven", icon: "Heart" },
  { value: "EXECUTIVE", label: "Ejecutivo", icon: "Briefcase" },
  { value: "INVESTOR", label: "Inversionista", icon: "TrendingUp" },
  { value: "RETIREE", label: "Retiro", icon: "Sunset" },
  { value: "DIGITAL_NOMAD", label: "Nómada digital", icon: "Laptop" },
] as const;
