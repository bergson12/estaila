"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth-server";

/**
 * Analyze a real-estate photo with Gemini Vision.
 * Returns structured insights to guide the agent.
 */

export type PhotoAnalysis = {
  roomType: string; // "Sala", "Cocina", "Exterior", etc
  isEmpty: boolean; // empty room (good for staging) vs furnished
  currentStyle: string | null; // existing decor style if any
  qualityScore: number; // 1-10
  qualityIssues: string[]; // ["low light", "wide angle distortion", "clutter", ...]
  suggestedTool: string; // STAGING | DECLUTTER | ENHANCE | etc
  suggestedStyle: string | null; // MODERN | LUXURY | etc
  buyerTarget: string | null; // "Familia", "Soltero/Pareja", "Inversión"
  oneLineDescription: string; // short caption
  available: boolean; // whether Gemini was called or fallback
  error?: string; // if Gemini failed (vs key missing)
};

const FALLBACK: PhotoAnalysis = {
  roomType: "Espacio",
  isEmpty: false,
  currentStyle: null,
  qualityScore: 7,
  qualityIssues: [],
  suggestedTool: "ENHANCE",
  suggestedStyle: null,
  buyerTarget: null,
  oneLineDescription: "Foto sin analizar — configura GEMINI_API_KEY para habilitar análisis.",
  available: false,
};

const ANALYSIS_PROMPT = `Eres un experto en fotografía inmobiliaria. Analiza esta foto y devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto adicional, sin markdown, sin fences) con esta estructura exacta:

{
  "roomType": "string — uno de: Sala, Cocina, Dormitorio, Baño, Comedor, Oficina, Exterior, Piscina, Jardín, Pasillo, Otro",
  "isEmpty": boolean — true si está vacío o casi vacío (ideal para virtual staging),
  "currentStyle": "string|null — estilo actual: Moderno, Clásico, Minimalista, Rustico, Industrial, Tropical, Colonial, etc. null si no hay estilo definido",
  "qualityScore": number — 1-10. 10 = MLS-grade pro. 1 = teléfono mal iluminado,
  "qualityIssues": ["array de strings — issues detectados: 'Baja iluminación', 'Tono amarillento', 'Distorsión gran angular', 'Desorden visible', 'Reflejos molestos', 'Encuadre torcido', etc"],
  "suggestedTool": "string — uno de: STAGING (si vacío), DECLUTTER (si lleno y desordenado), ENHANCE (si calidad < 7), STYLE_CHANGE (si decoración no vende), SKY (si exterior con cielo nublado), TWILIGHT (si exterior), POOL (si piscina presente), LAWN (si césped visible)",
  "suggestedStyle": "string|null — sugerencia de estilo para staging/style-change: MODERN, LUXURY, MINIMALISTA, CARIBENO, COLONIAL, COSTERO, etc",
  "buyerTarget": "string|null — buyer ideal: 'Familia con niños', 'Soltero / pareja joven', 'Inversionista', 'Retiro / segundo hogar', 'Ejecutivo'",
  "oneLineDescription": "string — una oración descriptiva de la foto (max 100 caracteres) en español"
}

Sé directo, profesional. No agregues texto fuera del JSON.`;

export async function analyzePhoto(imageUrl: string): Promise<PhotoAnalysis> {
  await requireUser();

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return FALLBACK;
  }

  try {
    // Read image to base64 — local path or remote URL
    let buf: Buffer;
    let mime = "image/jpeg";
    if (/^https?:\/\//i.test(imageUrl)) {
      const r = await fetch(imageUrl);
      if (!r.ok) throw new Error(`No se pudo descargar imagen: ${r.status}`);
      const ab = await r.arrayBuffer();
      buf = Buffer.from(ab);
      mime = r.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    } else {
      const srcFs = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
      buf = await readFile(srcFs);
      const ext = path.extname(srcFs).toLowerCase();
      mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
    }
    const base64 = buf.toString("base64");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: ANALYSIS_PROMPT },
              { inlineData: { mimeType: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      // Quota / credits exhausted — return silent fallback so UI no rompe.
      if (res.status === 429) {
        return {
          ...FALLBACK,
          oneLineDescription:
            "Análisis IA en pausa (créditos Gemini agotados). El resto del Studio funciona normal.",
          error: "QUOTA_EXHAUSTED",
        };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          ...FALLBACK,
          oneLineDescription: "Análisis IA deshabilitado (key Gemini inválida).",
          error: "AUTH",
        };
      }
      throw new Error(`Gemini Vision ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Sin respuesta de Gemini");

    // Strip code fences if any
    const clean = text
      .trim()
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(clean);

    return {
      roomType: parsed.roomType ?? "Espacio",
      isEmpty: !!parsed.isEmpty,
      currentStyle: parsed.currentStyle ?? null,
      qualityScore: Number(parsed.qualityScore) || 7,
      qualityIssues: Array.isArray(parsed.qualityIssues)
        ? parsed.qualityIssues
        : [],
      suggestedTool: parsed.suggestedTool ?? "ENHANCE",
      suggestedStyle: parsed.suggestedStyle ?? null,
      buyerTarget: parsed.buyerTarget ?? null,
      oneLineDescription: parsed.oneLineDescription ?? "",
      available: true,
    };
  } catch (e) {
    console.error("[analyzePhoto] failed:", e);
    return {
      ...FALLBACK,
      oneLineDescription: `Error al analizar: ${(e as Error).message}`,
      error: (e as Error).message,
    };
  }
}
