"use server";

import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { ask, chat, type ChatMessage } from "@/lib/ai/deepseek";

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

export async function realEstateChat(args: {
  history: ChatTurn[];
  message: string;
}): Promise<string> {
  await requireUser();

  const system = `Eres "Estaila Assistant", el asistente IA de un CRM inmobiliario.

Ayudas a agentes con:
- Recomendaciones de pricing (cómo posicionar precio, comparables, estrategia)
- Sugerencias de contenido (post Instagram, descripción MLS, mensaje WhatsApp)
- Buyer personas (qué buyer atrae una propiedad)
- Negociación (qué responder ante objeciones comunes)
- Marketing inmobiliario (estrategia 30/60/90 días)
- Onboarding del CRM (cómo usar features estaila)

Reglas:
- Respuestas concisas, prácticas, accionables.
- Usa bullets cuando ayuden.
- Si no sabes algo, di "no tengo esa data" — no inventes precios ni listados.
- Hablas español por defecto. Cambias a inglés si el usuario lo hace.
- Eres directo, sin floritura corporativa.`;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...args.history.map((t) => ({
      role: t.role,
      content: t.content,
    })),
    { role: "user", content: args.message },
  ];

  return chat(messages, { temperature: 0.7, maxTokens: 600 });
}
