"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { ask, chat, type ChatMessage } from "@/lib/ai/deepseek";
import {
  CRM_ROUTES,
  CRM_ENTITIES,
  WIZARDS,
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
  /** When something failed, contains the real (un-redacted) error message. */
  errorDetail?: string;
};

/**
 * Slim system prompt used only in wizard mode. Keeps DeepSeek responses
 * fast (under Vercel Hobby's 10s cap).
 */
function buildWizardSystemPrompt(
  kind: "CONTACT" | "PROPERTY" | "APPOINTMENT",
  userName: string,
  userLocation: string | null
): string {
  const steps: Record<typeof kind, string[]> = {
    CONTACT: [
      "Nombre completo",
      "Teléfono (con código país)",
      'Email (puede decir "saltar")',
      "Tipo: CLIENTE | LEAD | PROVEEDOR | OTRO",
      "Notas rápidas (opcional)",
    ],
    PROPERTY: [
      'Título corto (ej: "Casa Punta Cana 3hab")',
      "Operación: EN_VENTA | EN_ALQUILER",
      "Categoría: CASA | APARTAMENTO | SOLAR | TERRENO | LOCAL_COMERCIAL",
      'Precio USD (número o "—")',
      'Habitaciones/baños/m² (ej: "3/2/180")',
      "Ubicación",
      "Descripción breve (opcional)",
    ],
    APPOINTMENT: [
      'Título (ej: "Visita Casa Miraflores")',
      'Fecha y hora (ej: "mañana 3pm")',
      "Duración aprox en minutos (default 60)",
      "Asociar a contacto o propiedad (opcional)",
      "Ubicación física",
      "Notas (opcional)",
    ],
  };

  const actionName =
    kind === "CONTACT"
      ? "create_contact"
      : kind === "PROPERTY"
        ? "create_property"
        : "create_appointment";

  return `Eres "Estaila Assistant" en MODO WIZARD: ${kind}.

USUARIO: ${userName}${userLocation ? ` · ${userLocation}` : ""}

OBJETIVO: Recoger todos los datos para ${actionName} preguntando UNA cosa por turno.

PASOS:
${steps[kind].map((s, i) => `${i + 1}. ${s}`).join("\n")}

REGLAS:
- UNA pregunta corta por turno. No párrafos largos.
- Cada vez que el usuario responde, confirma con eco: "✓ <campo>: <valor>".
- Si responde "saltar"/"no"/"omitir" en campo opcional, continúa.
- En el último paso muestra mini-resumen y devuelve action create_*.
- Hoy es ${new Date().toISOString()}.

FORMATO RESPUESTA (JSON estricto):
{
  "text": "Tu pregunta o confirmación. Markdown ligero.",
  "actions": []  // Solo en el último paso pones [{"type":"${actionName}","label":"...","data":{...}}]
}

Devuelve SOLO el JSON.`;
}

export async function realEstateChat(args: {
  history: ChatTurn[];
  message: string;
  /** Optional wizard mode: CONTACT | PROPERTY | APPOINTMENT */
  wizard?: "CONTACT" | "PROPERTY" | "APPOINTMENT" | null;
}): Promise<ChatResponse> {
  // Catch every failure inside the action so Next.js doesn't redact the
  // message as a generic "Server Components render error". Surface the real
  // cause to the client via errorDetail.
  try {
    return await realEstateChatInner(args);
  } catch (e) {
    const err = e as Error;
    const detail = `${err.name ?? "Error"}: ${err.message ?? String(err)}`;
    console.error("[realEstateChat]", detail, err.stack);
    return {
      text: `⚠️ ${detail}`,
      actions: [],
      errorDetail: detail,
    };
  }
}

async function realEstateChatInner(args: {
  history: ChatTurn[];
  message: string;
  wizard?: "CONTACT" | "PROPERTY" | "APPOINTMENT" | null;
}): Promise<ChatResponse> {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, plan: true, credits: true, agentLocation: true },
  });

  // Live stats only needed in free-form chat mode. Skip in wizard mode
  // to save 3 round-trips against Turso (each ~100ms from cold-start regions).
  const [propCount, contactCount, todayAppts] = args.wizard
    ? [0, 0, 0]
    : await Promise.all([
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

  // In wizard mode use a slimmer system prompt: just the relevant wizard
  // template + the response shape. CRM_ROUTES / CRM_ENTITIES bloat the
  // context and slow down responses (Vercel Hobby = 10s cap).
  const system = args.wizard
    ? buildWizardSystemPrompt(
        args.wizard,
        dbUser?.name ?? user.name,
        dbUser?.agentLocation ?? null
      )
    : `Eres "Estaila Assistant", el asistente IA del CRM inmobiliario Estaila.

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

${WIZARDS}

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

  // Try once; if DeepSeek returns empty (often happens when JSON mode +
  // tight max_tokens collide with internal reasoning), retry with double
  // the budget.
  let raw: string;
  try {
    raw = await chat(messages, {
      temperature: args.wizard ? 0.3 : 0.6,
      maxTokens: args.wizard ? 600 : 900,
      jsonMode: true,
      timeoutMs: args.wizard ? 15000 : 25000,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("respuesta vacía") || msg.includes("length")) {
      // One retry with more room
      raw = await chat(messages, {
        temperature: args.wizard ? 0.3 : 0.6,
        maxTokens: args.wizard ? 1200 : 1500,
        jsonMode: true,
        timeoutMs: args.wizard ? 18000 : 28000,
      });
    } else {
      throw e;
    }
  }

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

// ============================================================
// Chatbot — saved conversations (persistence)
// ============================================================

/**
 * Auto-create ChatConversation + ChatMessage tables if they don't exist
 * (e.g. Turso fresh deploy where migration hasn't run yet). Runs once per
 * process lifetime; cached via global.
 */
let chatSchemaReady = false;
async function ensureChatSchema() {
  if (chatSchemaReady) return;
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ChatConversation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL DEFAULT 'Nueva conversación',
      "wizard" TEXT,
      "preview" TEXT,
      "pinned" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "ChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ChatMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "conversationId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "actionsJson" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ChatConversation_userId_updatedAt_idx" ON "ChatConversation"("userId", "updatedAt")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ChatConversation_userId_pinned_idx" ON "ChatConversation"("userId", "pinned")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt")`
    );
    chatSchemaReady = true;
  } catch (e) {
    console.warn("[ensureChatSchema] failed, will retry:", (e as Error).message);
  }
}

export type ConversationSummary = {
  id: string;
  title: string;
  preview: string | null;
  wizard: string | null;
  pinned: boolean;
  updatedAt: string;
};

export type LoadedConversation = {
  id: string;
  title: string;
  wizard: "CONTACT" | "PROPERTY" | "APPOINTMENT" | null;
  messages: {
    role: "user" | "assistant";
    content: string;
    actions?: ChatAction[];
  }[];
};

export async function listConversations(): Promise<ConversationSummary[]> {
  const user = await requireUser();
  await ensureChatSchema();
  const rows = await prisma.chatConversation.findMany({
    where: { userId: user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      preview: true,
      wizard: true,
      pinned: true,
      updatedAt: true,
    },
    take: 50,
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    preview: r.preview,
    wizard: r.wizard,
    pinned: r.pinned,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function loadConversation(
  conversationId: string
): Promise<LoadedConversation> {
  const user = await requireUser();
  await ensureChatSchema();
  const convo = await prisma.chatConversation.findFirst({
    where: { id: conversationId, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!convo) throw new Error("Conversación no encontrada");
  return {
    id: convo.id,
    title: convo.title,
    wizard:
      convo.wizard === "CONTACT" ||
      convo.wizard === "PROPERTY" ||
      convo.wizard === "APPOINTMENT"
        ? convo.wizard
        : null,
    messages: convo.messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
      actions: m.actionsJson
        ? (JSON.parse(m.actionsJson) as ChatAction[])
        : undefined,
    })),
  };
}

export async function createConversation(args: {
  title?: string;
  wizard?: "CONTACT" | "PROPERTY" | "APPOINTMENT" | null;
}): Promise<{ id: string }> {
  const user = await requireUser();
  await ensureChatSchema();
  const convo = await prisma.chatConversation.create({
    data: {
      userId: user.id,
      title: args.title?.slice(0, 80) ?? "Nueva conversación",
      wizard: args.wizard ?? null,
    },
    select: { id: true },
  });
  return convo;
}

export async function saveConversationTurn(args: {
  conversationId: string;
  userMessage: string;
  assistantText: string;
  assistantActions?: ChatAction[];
}): Promise<void> {
  const user = await requireUser();
  await ensureChatSchema();
  // Verify ownership
  const owned = await prisma.chatConversation.findFirst({
    where: { id: args.conversationId, userId: user.id },
    select: { id: true, title: true },
  });
  if (!owned) throw new Error("Conversación no encontrada");

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        conversationId: args.conversationId,
        role: "user",
        content: args.userMessage.slice(0, 4000),
      },
    }),
    prisma.chatMessage.create({
      data: {
        conversationId: args.conversationId,
        role: "assistant",
        content: args.assistantText.slice(0, 6000),
        actionsJson: args.assistantActions
          ? JSON.stringify(args.assistantActions)
          : null,
      },
    }),
    prisma.chatConversation.update({
      where: { id: args.conversationId },
      data: {
        preview: args.assistantText.slice(0, 140),
        // Auto-title from first user message if still default
        ...(owned.title === "Nueva conversación"
          ? { title: args.userMessage.slice(0, 60) }
          : {}),
      },
    }),
  ]);
}

export async function renameConversation(args: {
  id: string;
  title: string;
}): Promise<void> {
  const user = await requireUser();
  await ensureChatSchema();
  const title = args.title.trim().slice(0, 80);
  if (!title) throw new Error("Título requerido");
  await prisma.chatConversation.updateMany({
    where: { id: args.id, userId: user.id },
    data: { title },
  });
}

export async function deleteConversation(id: string): Promise<void> {
  const user = await requireUser();
  await ensureChatSchema();
  await prisma.chatConversation.deleteMany({
    where: { id, userId: user.id },
  });
}

export async function pinConversation(args: {
  id: string;
  pinned: boolean;
}): Promise<void> {
  const user = await requireUser();
  await ensureChatSchema();
  await prisma.chatConversation.updateMany({
    where: { id: args.id, userId: user.id },
    data: { pinned: args.pinned },
  });
}

export async function setConversationWizard(args: {
  id: string;
  wizard: "CONTACT" | "PROPERTY" | "APPOINTMENT" | null;
}): Promise<void> {
  const user = await requireUser();
  await ensureChatSchema();
  await prisma.chatConversation.updateMany({
    where: { id: args.id, userId: user.id },
    data: { wizard: args.wizard },
  });
}
