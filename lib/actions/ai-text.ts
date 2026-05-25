"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { ask, chat, type ChatMessage } from "@/lib/ai/deepseek";
import {
  CRM_ROUTES,
  CRM_ENTITIES,
  RESPONSE_SHAPE,
} from "@/lib/ai/crm-context";

// ============================================================
// Agent bio generation
// ============================================================

export async function generateAgentBio(args: {
  tone: "professional" | "friendly" | "luxury" | "caribbean";
  length: "short" | "medium" | "long";
  extra?: string;
}): Promise<string> {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      agentRole: true,
      agentLocation: true,
      agentPhone: true,
    },
  });

  const tones: Record<string, string> = {
    professional: "tono profesional, formal, orientado a resultados",
    friendly: "tono cálido, cercano, amigable, conversacional",
    luxury: "tono elegante, sofisticado, lujoso, premium",
    caribbean: "tono caribeño relajado, optimista, con sabor local",
  };
  const lengths: Record<string, string> = {
    short: "60-80 palabras (Instagram, Twitter)",
    medium: "120-150 palabras (LinkedIn, portal web)",
    long: "200-250 palabras (página de presentación completa)",
  };

  const system = `Eres un copywriter especializado en branding de agentes inmobiliarios. Generas bios persuasivas que conectan, transmiten confianza y diferencian. No uses clichés ("apasionado por", "tu mejor opción"). Usa lenguaje específico, datos concretos, beneficios al cliente.`;

  const userPrompt = `Genera una bio para este agente inmobiliario.

Nombre: ${dbUser?.name ?? user.name}
Cargo: ${dbUser?.agentRole ?? "Agente inmobiliario"}
Zona: ${dbUser?.agentLocation ?? "—"}
Teléfono: ${dbUser?.agentPhone ?? "—"}

Tono: ${tones[args.tone]}
Longitud: ${lengths[args.length]}
${args.extra ? `\nDetalles extra: ${args.extra}` : ""}

Devuelve SOLO el texto de la bio, sin etiquetas ni introducciones. En español.`;

  return ask(system, userPrompt, { temperature: 0.8, maxTokens: 500 });
}

// ============================================================
// Smart text suggestions (editor)
// ============================================================

export type TextVariation =
  | "salesy"
  | "concise"
  | "professional"
  | "caribbean"
  | "english"
  | "luxury";

const VARIATION_LABELS: Record<TextVariation, string> = {
  salesy: "Más vendedor",
  concise: "Más conciso",
  professional: "Más profesional",
  caribbean: "Caribeño relajado",
  english: "En inglés",
  luxury: "Tono luxury",
};

export async function suggestText(args: {
  text: string;
  variation: TextVariation;
}): Promise<string[]> {
  await requireUser();
  const system = `Eres un copywriter inmobiliario. Reescribes textos breves para posts, banners y plantillas. Devuelves SOLO un array JSON de 3 variaciones en orden de mejor a aceptable. No agregues explicaciones.`;

  const directives: Record<TextVariation, string> = {
    salesy:
      "Más persuasivo, llamativo, con urgencia o beneficio concreto. Conserva idioma original.",
    concise:
      "Más conciso, directo, sin palabras innecesarias. Conserva idioma original.",
    professional:
      "Más profesional, formal, sobrio. Conserva idioma original.",
    caribbean:
      "Más relajado y caribeño, con sabor local, mantén la idea. En español.",
    english: "Tradúcelo a inglés inmobiliario natural y persuasivo.",
    luxury:
      "Tono luxury, elegante, sofisticado, sugiriendo exclusividad. Conserva idioma original.",
  };

  const userPrompt = `Texto original: """${args.text}"""

Variación requerida: ${VARIATION_LABELS[args.variation]}
${directives[args.variation]}

Devuelve solo JSON válido: {"variations": ["variación 1", "variación 2", "variación 3"]}`;

  const out = await ask(system, userPrompt, {
    temperature: 0.85,
    maxTokens: 400,
    jsonMode: true,
  });
  try {
    const parsed = JSON.parse(out) as { variations?: string[] };
    return parsed.variations?.slice(0, 3) ?? [];
  } catch {
    // fallback: split lines
    return out
      .split("\n")
      .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
  }
}

// ============================================================
// Real-estate chatbot
// ============================================================

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ChatAction =
  | { type: "navigate"; label: string; href: string }
  | { type: "ai_tool"; label: string; href: string }
  | { type: "create_contact"; label: string; data: Record<string, string | undefined> }
  | { type: "create_property"; label: string; data: Record<string, unknown> }
  | { type: "create_appointment"; label: string; data: Record<string, unknown> };

export type ChatResponse = {
  text: string;
  actions: ChatAction[];
};

export async function realEstateChat(args: {
  history: ChatTurn[];
  message: string;
}): Promise<ChatResponse> {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, plan: true, credits: true, agentLocation: true },
  });

  // Live stats to give the bot some grounded context
  const [propCount, contactCount, todayAppts] = await Promise.all([
    prisma.property.count({ where: { userId: user.id } }),
    prisma.contact.count({ where: { userId: user.id } }),
    prisma.appointment.count({
      where: {
        userId: user.id,
        startAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const system = `Eres "Estaila Assistant", el asistente IA del CRM inmobiliario Estaila.

CONTEXTO DEL USUARIO:
- Nombre: ${dbUser?.name ?? user.name}
- Zona: ${dbUser?.agentLocation ?? "no especificada"}
- Plan: ${dbUser?.plan ?? "FREE"}
- Créditos IA: ${dbUser?.credits ?? 0}
- Propiedades cargadas: ${propCount}
- Contactos cargados: ${contactCount}
- Citas próximas (24h): ${todayAppts}

ROL:
Ayudas a agentes inmobiliarios con:
- Estrategia (pricing, posicionamiento, buyer personas, negociación)
- Contenido (posts, descripciones MLS, WhatsApp, captions)
- Marketing 30/60/90 días
- Onboarding del CRM y navegación
- Crear datos: contactos, propiedades, citas — si el usuario te da los datos.

${CRM_ROUTES}

${CRM_ENTITIES}

${RESPONSE_SHAPE}

REGLAS:
- Respuestas concisas, accionables. Markdown ligero. Bullets cuando ayuden.
- No inventes precios ni datos. Si falta info, pregunta concisamente.
- Hablas español por defecto. Inglés si el usuario lo hace.
- Hasta 4 acciones por respuesta. Solo las más útiles.
- Cuando alguien diga "agéndame con Juan mañana 3pm", devuelve create_appointment con la fecha calculada.
- Cuando hable de un tema (pricing, staging, etc), sugiere ruta navigate relevante.`;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...args.history.map((t) => ({
      role: t.role,
      content: t.content,
    })),
    { role: "user", content: args.message },
  ];

  const raw = await chat(messages, {
    temperature: 0.6,
    maxTokens: 800,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(raw) as ChatResponse;
    return {
      text: parsed.text ?? "",
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 4) : [],
    };
  } catch {
    // Fallback: treat whole response as text
    return { text: raw, actions: [] };
  }
}

// ============================================================
// Chatbot tool execution (creates entities from chat actions)
// ============================================================

export async function chatCreateContact(data: {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<{ id: string }> {
  const user = await requireUser();
  if (!data.name?.trim()) throw new Error("Nombre requerido");
  const contact = await prisma.contact.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      type: "CLIENTE",
      phone: data.phone?.trim() ?? null,
      email: data.email?.trim() ?? null,
      notes: data.notes?.trim() ?? null,
    },
    select: { id: true },
  });
  revalidatePath("/contactos");
  return contact;
}

export async function chatCreateProperty(data: {
  title: string;
  category?: string;
  operation?: string;
  priceUSD?: number;
  bedrooms?: number;
  bathrooms?: number;
  metersSquared?: number;
  location?: string;
  description?: string;
}): Promise<{ id: string }> {
  const user = await requireUser();
  if (!data.title?.trim()) throw new Error("Título requerido");
  const prop = await prisma.property.create({
    data: {
      userId: user.id,
      title: data.title.trim(),
      category: data.category ?? "CASA",
      operation: data.operation ?? "EN_VENTA",
      priceUSD: data.priceUSD ?? null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      metersSquared: data.metersSquared ?? null,
      location: data.location?.trim() ?? null,
      description: data.description?.trim() ?? null,
    },
    select: { id: true },
  });
  revalidatePath("/propiedades");
  return prop;
}

export async function chatCreateAppointment(data: {
  title: string;
  startAt: string;
  endAt?: string;
  contactId?: string;
  propertyId?: string;
  location?: string;
  notes?: string;
}): Promise<{ id: string }> {
  const user = await requireUser();
  if (!data.title?.trim()) throw new Error("Título requerido");
  if (!data.startAt) throw new Error("Fecha requerida");
  const startAt = new Date(data.startAt);
  if (isNaN(startAt.getTime())) throw new Error("Fecha inválida");
  const appt = await prisma.appointment.create({
    data: {
      userId: user.id,
      title: data.title.trim(),
      startAt,
      endAt: data.endAt ? new Date(data.endAt) : null,
      contactId: data.contactId ?? null,
      propertyId: data.propertyId ?? null,
      location: data.location?.trim() ?? null,
      notes: data.notes?.trim() ?? null,
    },
    select: { id: true },
  });
  revalidatePath("/agenda");
  return appt;
}
