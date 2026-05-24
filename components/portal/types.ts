export type PortalSite = {
  slug: string;
  template: string;
  title: string | null;
  tagline: string | null;
  about: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
};

export type PortalAgent = {
  name: string;
  email: string;
  image: string | null;
};

export type PortalProperty = {
  id: string;
  title: string;
  featuredPhoto: string | null;
  priceUSD: number | null;
  priceDOP: number | null;
  category: string;
  operation: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  metersSquared: number | null;
  location: string | null;
};

export type PortalData = {
  site: PortalSite;
  agent: PortalAgent;
  properties: PortalProperty[];
};

// Single unified template. Branding (logo + colores) viene de Site / Organization.
// No hay picker — todos los agentes usan el mismo portal verde botánico,
// y las propiedades premium usan el showcase Cinematic.
export const TEMPLATES = [
  {
    value: "DEFAULT",
    label: "Portal del agente",
    description: "Plantilla única con tu marca: logo, colores y tipografía configurables.",
    bg: "#114337",
  },
] as const;
