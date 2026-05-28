import "server-only";
import { prisma } from "@/lib/db";
import { brandedImageUrl } from "@/lib/public-url";

/**
 * Builds a compact, privacy-scoped snapshot of the signed-in user's CRM data
 * so the chatbot can answer concrete questions like:
 *   - "dame el número de Juan"
 *   - "¿cuál fue mi última foto editada?"
 *   - "comparte el link de mi tarjeta"
 *
 * HYBRID strategy:
 *   - Always include "frequent facts" (profile, card/site links, last photos,
 *     upcoming appointments, finance summary).
 *   - For contacts & properties, include the most RECENT ones PLUS any that
 *     match keywords extracted from the user's current message (so a lookup of
 *     an older record still resolves without a second LLM round-trip).
 *
 * Everything is scoped to `userId` — a user can never see another's data.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://estaila.com";

const STOPWORDS = new Set([
  "dame","damelo","necesito","quiero","cual","cuál","cuales","cuáles","como","cómo",
  "donde","dónde","numero","número","telefono","teléfono","celular","correo","email",
  "link","enlace","foto","fotos","ultima","última","ultimo","último","editada","editado",
  "tarjeta","sitio","contacto","contactos","propiedad","propiedades","cita","citas",
  "por","para","con","del","los","las","una","uno","que","qué","mi","mis","su","sus",
  "the","and","please","favor","comparte","compárteme","envia","envía","muestra",
  "dime","busca","buscar","encuentra","sobre","de","el","la","es","un","y","a","o",
]);

function extractKeywords(message: string): string[] {
  return Array.from(
    new Set(
      message
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    )
  ).slice(0, 6);
}

function money(n: number | null | undefined, currency = "USD"): string {
  if (n == null) return "—";
  return `${currency} ${Math.round(n).toLocaleString("en-US")}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TOOL_LABELS: Record<string, string> = {
  STAGING: "Virtual Staging",
  DECLUTTER: "Eliminar objetos",
  ENHANCE: "Mejorar calidad",
  STYLE_CHANGE: "Cambiar estilo",
  SKY: "Cielo despejado",
  TWILIGHT: "Atardecer",
  POOL: "Piscina",
  LAWN: "Césped",
  ADD_OBJECT: "Colocar objeto",
  REMOVE_OBJECT: "Quitar objeto",
};

/**
 * Heurística: ¿la pregunta del usuario necesita leer SUS datos?
 * Si no, saltamos las ~12 queries del snapshot y respondemos rápido.
 */
const DATA_INTENT_RE =
  /\b(contacto|contactos|tel[eé]fono|n[uú]mero|celular|correo|email|cliente|lead|propiedad|propiedades|listado|inmueble|casa|apartamento|precio|tarjeta|sitio|portal|link|enlace|foto|fotos|galer[ií]a|edit[eé]|generad|cita|citas|agenda|reuni[oó]n|visita|finanza|ingreso|gasto|balance|comisi[oó]n|mi |mis |tengo|cu[aá]nt|cu[aá]l)\b/i;

export function needsUserData(message: string): boolean {
  return DATA_INTENT_RE.test(message);
}

/** Resuelve la promesa o devuelve `fallback` si tarda más de `ms`. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const QUERY_TIMEOUT_MS = 4000;

type SnapProp = {
  id: string;
  title: string;
  priceUSD: unknown;
  location: string | null;
  operation: string;
  slug: string | null;
  publicEnabled: boolean;
};

export async function buildUserContextSnapshot(
  userId: string,
  message: string
): Promise<string> {
  const kw = extractKeywords(message);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    user,
    card,
    site,
    recentContacts,
    matchedContacts,
    recentProps,
    matchedProps,
    contactTotal,
    propTotal,
    lastGens,
    upcoming,
    income,
    expense,
  ] = await Promise.all([
    withTimeout(
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          agentRole: true,
          agentLocation: true,
          agentPhone: true,
          plan: true,
          credits: true,
        },
      }),
      QUERY_TIMEOUT_MS,
      null
    ),
    withTimeout(
      prisma.digitalCard.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { slug: true, title: true, isActive: true },
      }),
      QUERY_TIMEOUT_MS,
      null
    ),
    withTimeout(
      prisma.site.findUnique({
        where: { userId },
        select: { slug: true, published: true, title: true },
      }),
      QUERY_TIMEOUT_MS,
      null
    ),
    withTimeout(
      prisma.contact.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 15,
        select: { id: true, name: true, phone: true, email: true, type: true },
      }),
      QUERY_TIMEOUT_MS,
      [] as { id: string; name: string; phone: string | null; email: string | null; type: string }[]
    ),
    withTimeout(
      kw.length
        ? prisma.contact.findMany({
            where: { userId, OR: kw.map((k) => ({ name: { contains: k } })) },
            take: 8,
            select: { id: true, name: true, phone: true, email: true, type: true },
          })
        : Promise.resolve([] as { id: string; name: string; phone: string | null; email: string | null; type: string }[]),
      QUERY_TIMEOUT_MS,
      [] as { id: string; name: string; phone: string | null; email: string | null; type: string }[]
    ),
    withTimeout(
      prisma.property.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          priceUSD: true,
          location: true,
          operation: true,
          slug: true,
          publicEnabled: true,
        },
      }) as unknown as Promise<SnapProp[]>,
      QUERY_TIMEOUT_MS,
      [] as SnapProp[]
    ),
    withTimeout(
      (kw.length
        ? prisma.property.findMany({
            where: { userId, OR: kw.map((k) => ({ title: { contains: k } })) },
            take: 8,
            select: {
              id: true,
              title: true,
              priceUSD: true,
              location: true,
              operation: true,
              slug: true,
              publicEnabled: true,
            },
          })
        : Promise.resolve([])) as unknown as Promise<SnapProp[]>,
      QUERY_TIMEOUT_MS,
      [] as SnapProp[]
    ),
    withTimeout(prisma.contact.count({ where: { userId } }), QUERY_TIMEOUT_MS, 0),
    withTimeout(prisma.property.count({ where: { userId } }), QUERY_TIMEOUT_MS, 0),
    withTimeout(
      prisma.aIGeneration.findMany({
        where: { userId, status: "COMPLETED", outputUrl: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 5,
        select: { tool: true, outputUrl: true, completedAt: true },
      }),
      QUERY_TIMEOUT_MS,
      [] as { tool: string; outputUrl: string | null; completedAt: Date | null }[]
    ),
    withTimeout(
      prisma.appointment.findMany({
        where: {
          userId,
          startAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) },
        },
        orderBy: { startAt: "asc" },
        take: 8,
        select: { title: true, startAt: true, location: true, contactId: true },
      }),
      QUERY_TIMEOUT_MS,
      [] as { title: string; startAt: Date; location: string | null; contactId: string | null }[]
    ),
    withTimeout(
      prisma.transaction.aggregate({
        where: { userId, category: "INGRESO", date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      QUERY_TIMEOUT_MS,
      { _sum: { amount: null } }
    ),
    withTimeout(
      prisma.transaction.aggregate({
        where: { userId, category: "GASTO", date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      QUERY_TIMEOUT_MS,
      { _sum: { amount: null } }
    ),
  ]);

  // Merge recent + matched contacts/properties, dedupe by id, matched first
  const contactMap = new Map<string, (typeof recentContacts)[number]>();
  for (const c of [...matchedContacts, ...recentContacts]) contactMap.set(c.id, c);
  const contacts = Array.from(contactMap.values()).slice(0, 18);

  // Resolve appointment contact names (Appointment has contactId, no relation)
  const apptContactIds = upcoming
    .map((a) => a.contactId)
    .filter((x): x is string => !!x);
  const apptContacts = apptContactIds.length
    ? await withTimeout(
        prisma.contact.findMany({
          where: { id: { in: apptContactIds } },
          select: { id: true, name: true },
        }),
        QUERY_TIMEOUT_MS,
        [] as { id: string; name: string }[]
      )
    : [];
  const apptContactName = new Map(apptContacts.map((c) => [c.id, c.name]));

  const propMap = new Map<string, (typeof recentProps)[number]>();
  for (const p of [...matchedProps, ...recentProps]) propMap.set(p.id, p);
  const properties = Array.from(propMap.values()).slice(0, 12);

  const lines: string[] = [];
  lines.push(
    `DATOS DEL USUARIO (PRIVADO — solo de tu cuenta. Úsalos para responder con precisión a preguntas sobre TUS contactos, propiedades, fotos y enlaces):`
  );

  // Profile
  lines.push(
    ``,
    `PERFIL`,
    `- Nombre: ${user?.name ?? "—"}`,
    `- Rol: ${user?.agentRole ?? "—"}`,
    `- Zona: ${user?.agentLocation ?? "—"}`,
    `- Tel: ${user?.agentPhone ?? "—"}`,
    `- Email: ${user?.email ?? "—"}`,
    `- Plan: ${user?.plan ?? "FREE"} · Créditos IA: ${user?.credits ?? 0}`
  );

  // Shareable links
  lines.push(``, `ENLACES PARA COMPARTIR`);
  if (card?.slug) {
    lines.push(
      `- Tarjeta digital "${card.title}": ${APP_URL}/c/${card.slug}${
        card.isActive ? "" : " (inactiva)"
      }`
    );
  } else {
    lines.push(`- Tarjeta digital: aún no creada (sugiere crear en /marketing)`);
  }
  if (site?.slug) {
    lines.push(
      `- Sitio web público: ${APP_URL}/p/${site.slug}${
        site.published ? "" : " (sin publicar)"
      }`
    );
  } else {
    lines.push(`- Sitio web público: aún no creado (sugiere /sitio)`);
  }

  // Contacts
  lines.push(``, `CONTACTOS (${contactTotal} en total; mostrando recientes/coincidencias)`);
  if (contacts.length === 0) {
    lines.push(`- (sin contactos)`);
  } else {
    for (const c of contacts) {
      lines.push(
        `- ${c.name} · ${c.phone ?? "sin tel"} · ${c.email ?? "sin email"} · ${c.type}`
      );
    }
    if (contactTotal > contacts.length) {
      lines.push(
        `- …y ${contactTotal - contacts.length} más. Si buscas uno que no aparece, dirígelo a /contactos.`
      );
    }
  }

  // Properties
  lines.push(``, `PROPIEDADES (${propTotal} en total; mostrando recientes/coincidencias)`);
  if (properties.length === 0) {
    lines.push(`- (sin propiedades)`);
  } else {
    for (const p of properties) {
      const link =
        p.slug && p.publicEnabled ? `${APP_URL}/propiedad/${p.slug}` : `/propiedades/${p.id}`;
      lines.push(
        `- ${p.title} · ${money(p.priceUSD ? Number(p.priceUSD) : null)} · ${
          p.location ?? "sin ubicación"
        } · ${p.operation} · ${link}`
      );
    }
    if (propTotal > properties.length) {
      lines.push(`- …y ${propTotal - properties.length} más en /propiedades.`);
    }
  }

  // Last generated photos (Studio gallery)
  lines.push(``, `ÚLTIMAS FOTOS IA (Studio → Galería)`);
  if (lastGens.length === 0) {
    lines.push(`- (sin fotos generadas aún)`);
  } else {
    for (const g of lastGens) {
      lines.push(
        `- ${TOOL_LABELS[g.tool] ?? g.tool} · ${
          g.completedAt ? fmtDate(g.completedAt) : ""
        } · ${brandedImageUrl(g.outputUrl)}`
      );
    }
  }

  // Upcoming appointments
  lines.push(``, `PRÓXIMAS CITAS (7 días)`);
  if (upcoming.length === 0) {
    lines.push(`- (sin citas próximas)`);
  } else {
    for (const a of upcoming) {
      const who = a.contactId ? apptContactName.get(a.contactId) : null;
      lines.push(
        `- ${fmtDateTime(a.startAt)} · ${a.title}${who ? ` · con ${who}` : ""}${
          a.location ? ` · ${a.location}` : ""
        }`
      );
    }
  }

  // Finance summary (this month)
  const inc = income._sum.amount ? Number(income._sum.amount) : 0;
  const exp = expense._sum.amount ? Number(expense._sum.amount) : 0;
  lines.push(
    ``,
    `FINANZAS (este mes)`,
    `- Ingresos: ${money(inc)} · Gastos: ${money(exp)} · Balance: ${money(inc - exp)}`
  );

  // Usage rules
  lines.push(
    ``,
    `CÓMO USAR ESTOS DATOS:`,
    `- Si piden un dato puntual (número, email, link, última foto), tómalo de arriba y respóndelo directo.`,
    `- Para un número/email/link, ofrece un action "copy" con el valor exacto, y si aplica un "external" (wa.me, tel:, mailto:, o el link público).`,
    `- Si el dato NO aparece arriba (ej. contacto antiguo fuera de la lista), NO lo inventes: dilo y sugiere navigate a /contactos o /propiedades.`,
    `- Nunca menciones datos que no estén en este bloque.`
  );

  return lines.join("\n");
}
