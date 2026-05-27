/**
 * Marketing kit personalization metadata — labels + icons for UI chips.
 * Pure client-safe (no "use server"), shared by kit form, list, and editor.
 */

export type Audience =
  | "FAMILIA"
  | "INVESTOR"
  | "FOREIGN"
  | "FIRST_BUYER"
  | "LUXURY"
  | "GENERAL";

export type Tone =
  | "ELEGANT"
  | "CASUAL"
  | "URGENT"
  | "ASPIRATIONAL"
  | "TECHNICAL";

export type Goal =
  | "VISIT"
  | "OFFER"
  | "AWARENESS"
  | "OPEN_HOUSE"
  | "PRICE_DROP";

export const AUDIENCE_OPTIONS: { key: Audience; label: string; icon: string }[] = [
  { key: "GENERAL", label: "General", icon: "Globe" },
  { key: "FAMILIA", label: "Familia", icon: "Users" },
  { key: "INVESTOR", label: "Inversor", icon: "TrendingUp" },
  { key: "FOREIGN", label: "Extranjero", icon: "Plane" },
  { key: "FIRST_BUYER", label: "1er comprador", icon: "KeyRound" },
  { key: "LUXURY", label: "Lujo", icon: "Gem" },
];

export const TONE_OPTIONS: { key: Tone; label: string; hint: string }[] = [
  { key: "ELEGANT", label: "Elegante", hint: "Vocabulario sofisticado, pocos emojis" },
  { key: "CASUAL", label: "Casual", hint: "Conversacional, amigable" },
  { key: "URGENT", label: "Urgente", hint: "Crea sensación de escasez" },
  { key: "ASPIRATIONAL", label: "Aspiracional", hint: "Estilo de vida soñado" },
  { key: "TECHNICAL", label: "Técnico", hint: "Datos y especificaciones" },
];

export const GOAL_OPTIONS: { key: Goal; label: string; hint: string }[] = [
  { key: "VISIT", label: "Visita", hint: "CTA: agendar visita" },
  { key: "OFFER", label: "Oferta", hint: "CTA: aceptar ofertas" },
  { key: "AWARENESS", label: "Awareness", hint: "CTA: compartir/guardar" },
  { key: "OPEN_HOUSE", label: "Open house", hint: "Anuncia día específico" },
  { key: "PRICE_DROP", label: "Bajada precio", hint: "Destaca el nuevo precio" },
];

export function audienceLabel(a?: string | null): string {
  if (!a) return "—";
  return AUDIENCE_OPTIONS.find((o) => o.key === a)?.label ?? a;
}

export function toneLabel(t?: string | null): string {
  if (!t) return "—";
  return TONE_OPTIONS.find((o) => o.key === t)?.label ?? t;
}

export function goalLabel(g?: string | null): string {
  if (!g) return "—";
  return GOAL_OPTIONS.find((o) => o.key === g)?.label ?? g;
}
