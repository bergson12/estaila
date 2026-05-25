// Shared billing constants — no "use server" so they can be imported anywhere.

// Display mapping (landing ↔ internal keys):
//   PRO   = "Solo"   $15  — entry paid tier (1 agent)
//   TEAM  = "Pro"    $39  — featured tier (small team / pro features)
//   BUSINESS         (legacy, hidden in new UI — kept for backward compat)
//   AGENCY = "Agency" $199 — enterprise
export type PlanKey = "PRO" | "TEAM" | "BUSINESS" | "AGENCY";

export const PLAN_PRICE: Record<PlanKey, number> = {
  PRO: 15,
  TEAM: 39,
  BUSINESS: 79,
  AGENCY: 199,
};
export const PLAN_CREDITS: Record<PlanKey, number> = {
  PRO: 60,
  TEAM: 200,
  BUSINESS: 500,
  AGENCY: 99999, // effectively unlimited
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

export const CREDIT_PACKS = [
  { id: "PACK_20", credits: 20, priceUSD: 9 },
  { id: "PACK_50", credits: 50, priceUSD: 19 },
  { id: "PACK_150", credits: 150, priceUSD: 49 },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];
