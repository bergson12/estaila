import "server-only";

import { chat } from "@/lib/ai/deepseek";

/**
 * Generador de propuestas de venta personalizadas con DeepSeek (texto).
 * Produce secciones estructuradas (JSON) que el agente luego edita y exporta.
 */

export type ProposalType = "VENTA" | "INVERSION" | "FINANCIAMIENTO" | "LUJO";
export type ProposalTone = "CERCANO" | "FORMAL" | "CARIBENO" | "LUXURY";

export type ProposalInput = {
  propertyTitle: string;
  propertyLocation: string | null;
  priceUSD: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
  operation: string;
  description: string | null;
  recipientName: string;
  clientNotes: string | null;
  clientType: string | null;
  type: ProposalType;
  tone: ProposalTone;
  agentName: string;
  agentBio: string | null;
};

export type ProposalContent = {
  titulo: string;
  carta: string;
  perfilCliente: string;
  argumentos: string[];
  analisisFinanciero: string;
  barrio: string;
  proximosPasos: string;
  sobreAgente: string;
};

const TYPE_LABEL: Record<ProposalType, string> = {
  VENTA: "venta directa",
  INVERSION: "inversión: enfatiza ROI, rentabilidad de alquiler y valorización",
  FINANCIAMIENTO: "financiamiento: enfatiza opciones de pago y cuotas estimadas",
  LUJO: "propiedad de lujo / exclusiva: tono aspiracional y discreto",
};

const TONE_LABEL: Record<ProposalTone, string> = {
  CERCANO: "profesional pero cercano y cálido",
  FORMAL: "formal y corporativo",
  CARIBENO: "caribeño, relajado y amistoso",
  LUXURY: "sofisticado, elegante y exclusivo",
};

export async function generateProposalContent(
  input: ProposalInput
): Promise<ProposalContent> {
  const specs = [
    input.bedrooms != null ? `${input.bedrooms} habitaciones` : null,
    input.bathrooms != null ? `${input.bathrooms} baños` : null,
    input.metersSquared != null ? `${input.metersSquared} m²` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const price =
    input.priceUSD != null
      ? `US$${input.priceUSD.toLocaleString("en-US")}`
      : "precio a consultar";

  const system =
    "Eres un agente inmobiliario experto en redactar propuestas de venta persuasivas y personalizadas en español (República Dominicana / LATAM). Escribes claro, humano y honesto, sin inventar cifras exactas. Respondes SIEMPRE con JSON válido y nada más.";

  const user = [
    `Redacta una propuesta inmobiliaria. Enfoque: ${TYPE_LABEL[input.type]}.`,
    `Tono: ${TONE_LABEL[input.tone]}.`,
    `Cliente destinatario: ${input.recipientName}.`,
    input.clientType ? `Tipo de cliente (CRM): ${input.clientType}.` : "",
    input.clientNotes ? `Notas del agente sobre el cliente: ${input.clientNotes}.` : "",
    `Propiedad: ${input.propertyTitle}${
      input.propertyLocation ? `, en ${input.propertyLocation}` : ""
    }. ${specs}. Precio: ${price}. Operación: ${input.operation}.`,
    input.description ? `Descripción: ${input.description}.` : "",
    `Agente: ${input.agentName}.${input.agentBio ? ` Bio: ${input.agentBio}.` : ""}`,
    "",
    "Devuelve SOLO un JSON con EXACTAMENTE estas claves (texto en español, sin markdown):",
    `{
"titulo": "título de portada que incluya el nombre del cliente",
"carta": "carta de presentación breve y personalizada del agente al cliente (2-3 frases)",
"perfilCliente": "diagnóstico breve del cliente y estrategia de venta (2-3 frases). Si faltan datos, infiere de forma razonable",
"argumentos": ["entre 4 y 6 razones concretas por las que esta propiedad encaja con este cliente y este enfoque"],
"analisisFinanciero": "párrafo con el ángulo financiero según el enfoque (cuotas, ROI, escenarios). Usa rangos y aclara que son estimados; no inventes tasas exactas",
"barrio": "párrafo breve sobre el entorno, servicios cercanos y valorización de la zona",
"proximosPasos": "llamada a la acción clara para agendar una visita",
"sobreAgente": "cierre de confianza sobre el agente (2 frases)"
}`,
    `Usa exactamente el precio indicado (${price}); no inventes otro.`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.7, maxTokens: 2200, jsonMode: true }
  );

  return normalize(safeParse(raw), input);
}

function safeParse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as Record<string, unknown>;
      } catch {
        /* no-op */
      }
    }
  }
  return {};
}

function normalize(o: Record<string, unknown>, input: ProposalInput): ProposalContent {
  const str = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;
  const arr = (v: unknown): string[] => {
    if (Array.isArray(v)) {
      return v.map((x) => String(x).trim()).filter(Boolean).slice(0, 8);
    }
    return [];
  };

  const argumentos = arr(o.argumentos);
  return {
    titulo: str(o.titulo, `Propuesta exclusiva para ${input.recipientName}`),
    carta: str(
      o.carta,
      `Estimado/a ${input.recipientName}, es un placer presentarle esta propiedad cuidadosamente seleccionada para usted.`
    ),
    perfilCliente: str(o.perfilCliente, ""),
    argumentos:
      argumentos.length > 0
        ? argumentos
        : [
            "Ubicación estratégica con alta demanda.",
            "Excelente relación precio-valor en la zona.",
            "Espacios funcionales listos para habitar.",
          ],
    analisisFinanciero: str(o.analisisFinanciero, ""),
    barrio: str(o.barrio, ""),
    proximosPasos: str(
      o.proximosPasos,
      "Agendemos una visita para que conozca la propiedad en persona."
    ),
    sobreAgente: str(o.sobreAgente, `${input.agentName}, tu agente inmobiliario de confianza.`),
  };
}
