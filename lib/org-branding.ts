import "server-only";
import { prisma } from "./db";

export type FontPair = "ELEGANT" | "EDITORIAL" | "MODERN" | "MINIMAL";

export type OrgBranding = {
  orgId: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPair: FontPair;
  whiteLabel: boolean;
};

/**
 * Active organization branding for a user.
 * Returns null when user doesn't belong to any team.
 * Single source of truth — fall back to Site.primaryColor only when null.
 */
export async function getActiveOrgBranding(
  userId: string
): Promise<OrgBranding | null> {
  const member = await prisma.organizationMember.findFirst({
    where: { userId, acceptedAt: { not: null } },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          fontPair: true,
          whiteLabel: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!member?.organization) return null;
  const o = member.organization;
  return {
    orgId: o.id,
    name: o.name,
    logoUrl: o.logoUrl,
    primaryColor: o.primaryColor ?? "#2B2B2B",
    secondaryColor: o.secondaryColor ?? "#B8956A",
    accentColor: o.accentColor ?? "#D9C7A7",
    fontPair: ((o.fontPair as FontPair) ?? "ELEGANT") as FontPair,
    whiteLabel: o.whiteLabel,
  };
}

/** CSS font-family stack for a fontPair key. */
export function fontFamilyFor(pair: FontPair): string {
  switch (pair) {
    case "EDITORIAL":
      return "var(--font-playfair), Georgia, serif";
    case "MODERN":
    case "MINIMAL":
      return "var(--font-inter), system-ui, sans-serif";
    case "ELEGANT":
    default:
      return "var(--font-cormorant), Georgia, serif";
  }
}
