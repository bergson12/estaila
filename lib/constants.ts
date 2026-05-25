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

export function labelFor<T extends ReadonlyArray<{ value: string; label: string }>>(
  list: T,
  value: string | null | undefined
) {
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

export const STAGING_STYLES = [
  { value: "MODERN", label: "Moderno", emoji: "🛋️" },
  { value: "SCANDINAVIAN", label: "Escandinavo", emoji: "🪵" },
  { value: "JAPANDI", label: "Japandi", emoji: "🎋" },
  { value: "MID_CENTURY", label: "Mid-Century", emoji: "🪑" },
  { value: "CARIBENO", label: "Tropical", emoji: "🌴" },
  { value: "COLONIAL", label: "Colonial", emoji: "🏛️" },
  { value: "MINIMALISTA", label: "Minimalista", emoji: "⚪" },
  { value: "LUXURY", label: "Luxury", emoji: "💎" },
  { value: "INDUSTRIAL", label: "Industrial", emoji: "⚙️" },
  { value: "COSTERO", label: "Costero", emoji: "🌊" },
  { value: "BOHEMIAN", label: "Bohemio", emoji: "🧶" },
  { value: "FARMHOUSE", label: "Farmhouse", emoji: "🏚️" },
  { value: "ART_DECO", label: "Art Deco", emoji: "✨" },
  { value: "AIRBNB", label: "Airbnb", emoji: "🏡" },
  { value: "FAMILY", label: "Family", emoji: "👨‍👩‍👧" },
  { value: "OFFICE_PRO", label: "Oficina Pro", emoji: "💼" },
] as const;

export const ROOM_TYPES = [
  { value: "LIVING", label: "Sala", emoji: "🛋️" },
  { value: "BEDROOM", label: "Dormitorio", emoji: "🛏️" },
  { value: "KITCHEN", label: "Cocina", emoji: "🍳" },
  { value: "DINING", label: "Comedor", emoji: "🍽️" },
  { value: "BATHROOM", label: "Baño", emoji: "🛁" },
  { value: "OFFICE", label: "Oficina", emoji: "💻" },
  { value: "KIDS", label: "Niños", emoji: "🧸" },
  { value: "EXTERIOR", label: "Exterior", emoji: "🌳" },
  { value: "BALCONY", label: "Balcón", emoji: "🌇" },
  { value: "POOL", label: "Piscina", emoji: "🏊" },
] as const;

export const LIGHT_MOODS = [
  { value: "NATURAL", label: "Natural", desc: "Luz neutra de día" },
  { value: "WARM", label: "Cálida", desc: "Tonos dorados acogedores" },
  { value: "BRIGHT", label: "Brillante", desc: "Alta iluminación fresca" },
  { value: "MOODY", label: "Atmósfera", desc: "Sombras suaves dramáticas" },
  { value: "GOLDEN_HOUR", label: "Golden Hour", desc: "Atardecer cálido" },
] as const;

export const BUYER_TARGETS = [
  { value: "FAMILY", label: "Familia con niños", emoji: "👨‍👩‍👧" },
  { value: "YOUNG_COUPLE", label: "Pareja joven", emoji: "💑" },
  { value: "EXECUTIVE", label: "Ejecutivo", emoji: "💼" },
  { value: "INVESTOR", label: "Inversionista", emoji: "📈" },
  { value: "RETIREE", label: "Retiro", emoji: "🌅" },
  { value: "DIGITAL_NOMAD", label: "Nómada digital", emoji: "💻" },
] as const;
