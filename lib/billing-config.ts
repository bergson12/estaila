// Shared billing constants — no "use server" so they can be imported anywhere.

// Display mapping (landing ↔ internal keys). PRECIOS FUNDADOR (lanzamiento):
//   PRO   = "Solo"    $12  (escala 100+ usuarios → $15)
//   TEAM  = "Equipo"  $29  (escala → $39)
//   BUSINESS          (legacy, oculto — compat hacia atrás)
//   AGENCY = "Agencia" $99 (escala → $150)
// NOTA: el COBRO real lo define el precio del variant en LemonSqueezy. Estos
// montos son para mostrar. Al escalar, sube el precio del variant en LS (los
// fundadores quedan grandfathered) y actualiza estos números.
export type PlanKey = "PRO" | "TEAM" | "BUSINESS" | "AGENCY";

export const PLAN_PRICE: Record<PlanKey, number> = {
  PRO: 12,
  TEAM: 29,
  BUSINESS: 79,
  AGENCY: 99,
};
// Precios objetivo al escalar a 100 usuarios (referencia; no se usan aún).
export const PLAN_PRICE_SCALE: Record<PlanKey, number> = {
  PRO: 15,
  TEAM: 39,
  BUSINESS: 99,
  AGENCY: 150,
};
export const PLAN_CREDITS: Record<PlanKey, number> = {
  PRO: 60,
  TEAM: 200,
  BUSINESS: 500,
  AGENCY: 2000, // "ilimitado de uso justo": tope blando (a costo Gemini ~$78 < $150)
};
export const PLAN_SEATS: Record<PlanKey, number> = {
  PRO: 1,
  TEAM: 5,
  BUSINESS: 10,
  AGENCY: 99,
};
export const PLAN_MAX_TEAMS: Record<PlanKey, number> = {
  PRO: 0,
  TEAM: 1, // singleton/default team only
  BUSINESS: 5,
  AGENCY: 999, // efectively unlimited
};
export const PLAN_HAS_CUSTOM_DOMAIN: Record<PlanKey, boolean> = {
  PRO: false,
  TEAM: true, // "Pro" tier includes custom domain now
  BUSINESS: true,
  AGENCY: true,
};
// Whether the price is shown publicly or requires sales contact.
export const PLAN_IS_CUSTOM: Record<PlanKey, boolean> = {
  PRO: false,
  TEAM: false,
  BUSINESS: false,
  AGENCY: true,
};

// Créditos puntuales. Bajamos ~30% el precio (Gemini es casi gratis): el
// precio/crédito ($0.23–0.30) sigue ~5-6× tu costo real (~$0.05/gen) pero es
// justo. IDs sin cambiar (mapean a los variants existentes de LemonSqueezy);
// solo actualiza el PRECIO del variant en LS para que cobre lo nuevo.
export const CREDIT_PACKS = [
  { id: "PACK_20", credits: 20, priceUSD: 6 },
  { id: "PACK_50", credits: 50, priceUSD: 13 },
  { id: "PACK_150", credits: 150, priceUSD: 34 },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

// ---------- Plan FREE: límites + créditos mensuales ----------
// El plan gratuito tope: 5 propiedades, 10 contactos, 10 créditos IA/mes.
export const FREE_MONTHLY_CREDITS = 10;

/** Tope de propiedades por plan (FREE limitado; pagos = ilimitado). */
export const PLAN_PROPERTY_LIMIT: Record<string, number> = {
  FREE: 5,
  PRO: Infinity,
  TEAM: Infinity,
  BUSINESS: Infinity,
  AGENCY: Infinity,
};

/** Tope de contactos por plan (FREE limitado; pagos = ilimitado). */
export const PLAN_CONTACT_LIMIT: Record<string, number> = {
  FREE: 10,
  PRO: Infinity,
  TEAM: Infinity,
  BUSINESS: Infinity,
  AGENCY: Infinity,
};

/** Nombre comercial mostrado por plan. */
export const PLAN_NAME: Record<string, string> = {
  FREE: "Free",
  PRO: "Solo",
  TEAM: "Equipo",
  BUSINESS: "Equipo+",
  AGENCY: "Agencia",
};
