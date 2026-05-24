"use server";

import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

/**
 * Marketing AI mocks — generate hashtags + bios + ad copy from property data.
 *
 * TODO: replace with real OpenAI / Claude / Gemini API call.
 * For MVP, uses deterministic templates with property data interpolation
 * to feel like real AI output.
 */

const BASE_HASHTAGS = [
  "#RealEstate",
  "#BienesRaices",
  "#Inmobiliaria",
  "#Inversion",
  "#MiCasaIdeal",
  "#PropiedadesPremium",
  "#NuevoHogar",
];

// Optional location tags — added when the property location text matches a key.
// Catalog can grow; right now keeps generic + tropical examples.
// NOTE: country-neutral; deploy-time/region-specific tags can be customized later.

const CATEGORY_HASHTAGS: Record<string, string[]> = {
  CASA: ["#Casas", "#CasaEnVenta", "#FamilyHome", "#Hogar", "#TuCasaPropia"],
  APARTAMENTO: ["#Apartamento", "#Apto", "#CityLiving", "#TorreModerna", "#Penthouse"],
  SOLAR: ["#Solar", "#TerrenoEnVenta", "#Inversion", "#OportunidadUnica"],
  TERRENO: ["#Terreno", "#Inversion", "#ParaConstruir", "#Lote"],
  LOCAL_COMERCIAL: ["#LocalComercial", "#Negocio", "#Comercio", "#Emprendedores"],
};

const OPERATION_HASHTAGS: Record<string, string[]> = {
  EN_VENTA: ["#EnVenta", "#ForSale", "#TuNuevoHogar", "#OportunidadUnica"],
  EN_ALQUILER: ["#EnAlquiler", "#ForRent", "#Alquiler", "#ParaVivir"],
};

// Generic location-flavor map — country-neutral keywords.
// Agents in different regions can extend this later.
const LOCATION_HASHTAGS: Record<string, string[]> = {
  beach: ["#Beach", "#BeachLife", "#OceanView"],
  playa: ["#Playa", "#VistaAlMar", "#TropicalLife"],
  mountain: ["#Mountain", "#MountainView", "#NatureLife"],
  montana: ["#Montaña", "#VistaPanoramica"],
  city: ["#CityLiving", "#UrbanLife", "#DowntownLife"],
  centro: ["#Centro", "#VidaUrbana", "#Downtown"],
  golf: ["#GolfView", "#GolfCourse", "#LuxuryLiving"],
};

function pickLocationTags(location: string | null): string[] {
  if (!location) return [];
  const lower = location.toLowerCase();
  const tags: string[] = [];
  for (const [key, hashtags] of Object.entries(LOCATION_HASHTAGS)) {
    if (lower.includes(key)) tags.push(...hashtags);
  }
  return tags;
}

export async function generateHashtagsForProperty(propertyId: string): Promise<{
  hashtags: string[];
}> {
  const user = await requireUser();
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
  });
  if (!property) throw new Error("Propiedad no encontrada");

  const tags = new Set<string>([
    ...BASE_HASHTAGS,
    ...(CATEGORY_HASHTAGS[property.category] ?? []),
    ...(OPERATION_HASHTAGS[property.operation] ?? []),
    ...pickLocationTags(property.location),
  ]);

  // Add bedroom-based
  if (property.bedrooms != null && property.bedrooms >= 3) tags.add("#Familiar");
  if (property.bedrooms === 1) tags.add("#Soltero");
  if (property.bathrooms != null && Number(property.bathrooms) >= 3)
    tags.add("#LujoCotidiano");
  if (property.parking != null && property.parking >= 2) tags.add("#AmpliosParqueos");

  // Add price tier
  const price = property.priceUSD ? Number(property.priceUSD) : 0;
  if (price >= 500_000) tags.add("#Luxury");
  if (price >= 1_000_000) tags.add("#Millionaire");
  if (price > 0 && price < 100_000) tags.add("#Accesible");

  // Simulate API latency
  await new Promise((r) => setTimeout(r, 600));

  return { hashtags: Array.from(tags).slice(0, 18) };
}

const BIO_TEMPLATES = [
  (p: PropertyShort) =>
    `🏡 ${p.title}\n${p.location ? `📍 ${p.location}\n` : ""}✨ Tu próximo hogar te está esperando.\n📩 DM para más info`,
  (p: PropertyShort) =>
    `${p.title} ✨\n${p.category === "CASA" ? "Tu casa soñada" : "Tu próxima inversión"}${p.location ? ` en ${p.location}` : ""}.\n${p.priceLine}\n💬 WhatsApp en bio`,
  (p: PropertyShort) =>
    `📐 ${p.specs}\n${p.priceLine}\n${p.location ? `📍 ${p.location}` : ""}\n🔑 ${p.operationLabel} | DM 📩`,
  (p: PropertyShort) =>
    `Bienvenido a ${p.title}.\n${p.specs}\n${p.priceLine}\n${p.location ? `Ubicado en ${p.location}.\n` : ""}Agenda una visita 👇`,
];

const CAPTION_TEMPLATES = [
  (p: PropertyShort) =>
    `✨ NUEVO LISTADO\n\n${p.title}\n${p.specs ? `📐 ${p.specs}\n` : ""}${p.location ? `📍 ${p.location}\n` : ""}${p.priceLine}\n\nEsta propiedad combina ${p.adjective} con ${p.adjective2}. Una oportunidad ${p.operation === "EN_VENTA" ? "única de inversión" : "perfecta para vivir"}.\n\n📩 DM para coordinar visita\n📞 ${p.phone ?? "WhatsApp en bio"}`,
  (p: PropertyShort) =>
    `${p.operation === "EN_VENTA" ? "🏡 EN VENTA" : "🔑 EN ALQUILER"}: ${p.title}\n\n${p.priceLine}\n${p.specs}\n${p.location ? `📍 ${p.location}` : ""}\n\n${p.operation === "EN_VENTA" ? "Una inversión segura en zona privilegiada." : "Vive donde siempre soñaste."} 🌟\n\nDoble tap si te encanta 💙\nGuarda este post para más tarde 🔖\nDM para agendar visita`,
  (p: PropertyShort) =>
    `✨ ${p.location ?? "Propiedad destacada"}\n\nPresentamos: ${p.title}\n\n${p.specs}\n${p.priceLine}\n\n¿Por qué te encantará?\n• ${p.adjective}\n• ${p.adjective2}\n• ${p.operation === "EN_VENTA" ? "Excelente plusvalía" : "Listo para mudarte"}\n\n📲 Contáctame para más info`,
];

const ADJECTIVES = [
  "elegancia",
  "confort",
  "estilo",
  "modernidad",
  "luminosidad",
  "exclusividad",
  "tranquilidad",
  "vistas únicas",
  "diseño contemporáneo",
];

type PropertyShort = {
  title: string;
  category: string;
  operation: string;
  operationLabel: string;
  location: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  parking: number | null;
  metersSquared: number | null;
  specs: string;
  priceLine: string;
  adjective: string;
  adjective2: string;
  phone: string | null;
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildShort(property: {
  title: string;
  category: string;
  operation: string;
  priceUSD: unknown;
  bedrooms: number | null;
  bathrooms: unknown;
  parking: number | null;
  metersSquared: number | null;
  location: string | null;
}): PropertyShort {
  const specs = [
    property.bedrooms ? `${property.bedrooms} hab` : null,
    property.bathrooms ? `${property.bathrooms} baños` : null,
    property.parking ? `${property.parking} parqueos` : null,
    property.metersSquared ? `${property.metersSquared}m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const price = property.priceUSD
    ? new Intl.NumberFormat("es", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(property.priceUSD))
    : "Precio a consultar";

  return {
    title: property.title,
    category: property.category,
    operation: property.operation,
    operationLabel: property.operation === "EN_VENTA" ? "En venta" : "En alquiler",
    location: property.location,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms ? String(property.bathrooms) : null,
    parking: property.parking,
    metersSquared: property.metersSquared,
    specs,
    priceLine: `💰 ${price}`,
    adjective: pickRandom(ADJECTIVES),
    adjective2: pickRandom(ADJECTIVES),
    phone: null,
  };
}

export async function generateBioForProperty(propertyId: string): Promise<{
  bios: string[];
}> {
  const user = await requireUser();
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
  });
  if (!property) throw new Error("Propiedad no encontrada");

  const short = buildShort(property);
  await new Promise((r) => setTimeout(r, 700));
  return {
    bios: BIO_TEMPLATES.map((fn) => fn(short)),
  };
}

export async function generateCaptionForProperty(propertyId: string): Promise<{
  captions: string[];
}> {
  const user = await requireUser();
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
  });
  if (!property) throw new Error("Propiedad no encontrada");

  const short = buildShort(property);
  await new Promise((r) => setTimeout(r, 900));
  return {
    captions: CAPTION_TEMPLATES.map((fn) => fn(short)),
  };
}

// ============================================================
// MARKETING KIT — personalized generation with audience/tone/goal/angle
// ============================================================

export type MarketingParams = {
  audience?:
    | "FAMILIA"
    | "INVESTOR"
    | "FOREIGN"
    | "FIRST_BUYER"
    | "LUXURY"
    | "GENERAL";
  tone?: "ELEGANT" | "CASUAL" | "URGENT" | "ASPIRATIONAL" | "TECHNICAL";
  goal?: "VISIT" | "OFFER" | "AWARENESS" | "OPEN_HOUSE" | "PRICE_DROP";
  angle?: string;
  language?: "es" | "en";
};

const AUDIENCE_BULLETS: Record<NonNullable<MarketingParams["audience"]>, string[]> = {
  FAMILIA: [
    "Sector residencial seguro",
    "Cerca de colegios y parques",
    "Espacios pensados para crecer en familia",
    "Tranquilidad para los niños",
  ],
  INVESTOR: [
    "Excelente ROI proyectado",
    "Zona de alta plusvalía",
    "Demanda de alquiler comprobada",
    "Activo que se revaloriza",
  ],
  FOREIGN: [
    "Compra segura desde el extranjero",
    "Asesoría legal completa incluida",
    "Tasaciones y due diligence al día",
    "Acceso a financiamiento internacional",
  ],
  FIRST_BUYER: [
    "Primer paso al mercado inmobiliario",
    "Cuotas accesibles y plan financiero",
    "Ubicación con todo a la mano",
    "Listo para mudarte",
  ],
  LUXURY: [
    "Exclusividad y diseño de autor",
    "Acabados de primera línea",
    "Privacidad y seguridad 360°",
    "Estilo de vida premium",
  ],
  GENERAL: [
    "Acabados de calidad",
    "Excelente ubicación",
    "Oportunidad única",
    "Lista para visitar",
  ],
};

const TONE_HEADERS: Record<NonNullable<MarketingParams["tone"]>, string> = {
  ELEGANT: "Presentamos",
  CASUAL: "Mira esto 👀",
  URGENT: "🔥 OPORTUNIDAD",
  ASPIRATIONAL: "✨ Donde tu próxima historia empieza",
  TECHNICAL: "Ficha técnica",
};

const TONE_CLOSERS: Record<NonNullable<MarketingParams["tone"]>, string> = {
  ELEGANT: "Coordinemos una visita privada.",
  CASUAL: "Hablamos? Te dejo todo en DM 💬",
  URGENT: "⚠️ No esperes — propiedades así no duran.",
  ASPIRATIONAL: "Tu próximo capítulo empieza con una visita.",
  TECHNICAL: "Solicita ficha completa por DM.",
};

const GOAL_CTAS: Record<NonNullable<MarketingParams["goal"]>, string> = {
  VISIT: "📅 Agenda visita esta semana",
  OFFER: "💼 Acepto ofertas — manda la tuya",
  AWARENESS: "👋 Comparte con quien busca",
  OPEN_HOUSE: "🚪 Open house este sábado · DM hora",
  PRICE_DROP: "📉 PRECIO REBAJADO · contacta hoy",
};

function tonePrefix(tone: MarketingParams["tone"]): string {
  return TONE_HEADERS[tone ?? "ELEGANT"] ?? "Presentamos";
}

function buildPersonalizedCaption(
  short: PropertyShort,
  params: MarketingParams,
  variant: number
): string {
  const audience = params.audience ?? "GENERAL";
  const tone = params.tone ?? "ELEGANT";
  const goal = params.goal ?? "VISIT";
  const bullets = AUDIENCE_BULLETS[audience];
  const angleBullet = params.angle?.trim()
    ? `• ${params.angle.trim()}`
    : "";

  if (variant === 0) {
    return [
      `${TONE_HEADERS[tone]} · ${short.title}`,
      "",
      short.specs,
      short.priceLine,
      short.location ? `📍 ${short.location}` : "",
      "",
      "¿Por qué te va a encantar?",
      `• ${bullets[0]}`,
      `• ${bullets[1]}`,
      angleBullet,
      "",
      GOAL_CTAS[goal],
      "",
      TONE_CLOSERS[tone],
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (variant === 1) {
    const opLabel = short.operation === "EN_VENTA" ? "EN VENTA" : "EN ALQUILER";
    return [
      `${tone === "URGENT" ? "🔥 " : ""}${opLabel}: ${short.title}`,
      "",
      short.priceLine,
      short.specs,
      short.location ? `📍 ${short.location}` : "",
      params.angle?.trim() ? `\n👉 ${params.angle.trim()}` : "",
      "",
      `${bullets[2]} · ${bullets[3]}`,
      "",
      "💙 Doble tap si te encanta",
      "🔖 Guarda este post",
      GOAL_CTAS[goal],
    ]
      .filter(Boolean)
      .join("\n");
  }
  // variant 2
  return [
    `${tonePrefix(tone)}`,
    short.title,
    "",
    short.location ?? "Propiedad destacada",
    short.priceLine,
    short.specs,
    "",
    "Lo más destacado:",
    `• ${bullets[0]}`,
    `• ${bullets[1]}`,
    `• ${bullets[2]}`,
    angleBullet,
    "",
    GOAL_CTAS[goal],
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPersonalizedBio(
  short: PropertyShort,
  params: MarketingParams,
  variant: number
): string {
  const tone = params.tone ?? "ELEGANT";
  const goal = params.goal ?? "VISIT";
  if (variant === 0) {
    return `${tone === "URGENT" ? "🔥 " : "🏡 "}${short.title}\n${short.location ? `📍 ${short.location}\n` : ""}${short.priceLine}\n${GOAL_CTAS[goal]}`;
  }
  if (variant === 1) {
    return `${short.title}${tone === "ASPIRATIONAL" ? " · donde la vida fluye" : ""}\n${short.specs}\n${short.priceLine}\n📲 DM o WhatsApp en bio`;
  }
  return `${short.title}\n${short.location ?? "Ubicación reservada"}\n${short.priceLine}\n${TONE_CLOSERS[tone]}`;
}

function audienceHashtags(audience: MarketingParams["audience"]): string[] {
  if (audience === "FAMILIA") return ["#FamiliaFeliz", "#HogarSeguro", "#FamilyLife"];
  if (audience === "INVESTOR") return ["#Inversion", "#ROI", "#RealEstateInvestment"];
  if (audience === "FOREIGN") return ["#InternationalBuyers", "#ExpatHome", "#GlobalInvestor"];
  if (audience === "FIRST_BUYER") return ["#PrimerHogar", "#FirstHome", "#NuevoComienzo"];
  if (audience === "LUXURY") return ["#Luxury", "#LuxuryRealEstate", "#LuxuryLifestyle", "#Exclusive"];
  return [];
}

/**
 * Generate full marketing kit with personalization params.
 * Returns 3 captions + ~15 hashtags + 3 bios.
 */
export async function generateMarketingKit(
  propertyId: string,
  params: MarketingParams = {}
): Promise<{
  captions: string[];
  hashtags: string[];
  bios: string[];
}> {
  const user = await requireUser();
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
  });
  if (!property) throw new Error("Propiedad no encontrada");

  const short = buildShort(property);

  // Captions — 3 personalized variants
  const captions = [0, 1, 2].map((v) =>
    buildPersonalizedCaption(short, params, v)
  );

  // Bios — 3 personalized variants
  const bios = [0, 1, 2].map((v) => buildPersonalizedBio(short, params, v));

  // Hashtags — base + audience + custom angle words
  const hashtags = new Set<string>([
    ...BASE_HASHTAGS,
    ...(CATEGORY_HASHTAGS[property.category] ?? []),
    ...(OPERATION_HASHTAGS[property.operation] ?? []),
    ...pickLocationTags(property.location),
    ...audienceHashtags(params.audience),
  ]);
  if (params.angle) {
    const words = params.angle
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 3);
    for (const w of words) hashtags.add(`#${w.charAt(0).toUpperCase() + w.slice(1)}`);
  }
  if (property.priceUSD && Number(property.priceUSD) >= 500_000) hashtags.add("#Luxury");

  await new Promise((r) => setTimeout(r, 800));

  return {
    captions,
    hashtags: Array.from(hashtags).slice(0, 18),
    bios,
  };
}

export async function estimateAdReach(input: {
  dailyBudgetUSD: number;
  durationDays: number;
  objective: string;
  audienceSize: number;
}): Promise<{
  estReach: number;
  estClicks: number;
  estLeads: number;
  estCPM: number;
  estCPL: number;
  totalSpend: number;
}> {
  // Deterministic mock that feels realistic for global ad markets
  const total = input.dailyBudgetUSD * input.durationDays;
  // CPMs vary by objective globally: $2-6
  const cpmByObjective: Record<string, number> = {
    AWARENESS: 2.5,
    TRAFFIC: 4.2,
    ENGAGEMENT: 3.0,
    LEADS: 5.8,
    CONVERSIONS: 6.5,
  };
  const cpm = cpmByObjective[input.objective] ?? 4.0;
  const estReach = Math.round((total / cpm) * 1000);
  // CTR ~1.5%
  const estClicks = Math.round(estReach * 0.015);
  // Lead conversion ~5% of clicks for real estate
  const estLeads = Math.round(estClicks * 0.05);
  const estCPL = estLeads > 0 ? total / estLeads : 0;

  return {
    estReach,
    estClicks,
    estLeads,
    estCPM: cpm,
    estCPL,
    totalSpend: total,
  };
}
