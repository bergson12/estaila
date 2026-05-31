import "server-only";

/**
 * OCR de facturas/recibos con Gemini (vision). DeepSeek no soporta imágenes;
 * Gemini 2.5 Flash sí, y es barato (~$0.0001-0.001/imagen). Lee GEMINI_API_KEY.
 * Devuelve una tagged-union para que el caller decida.
 */

export type ReceiptData = {
  concepto: string | null;
  monto: number | null;
  moneda: "USD" | "DOP" | null;
  fecha: string | null; // YYYY-MM-DD
  proveedor: string | null;
  categoria: string | null; // subtipo de transacción
};

export type ReceiptResult =
  | { ok: true; data: ReceiptData }
  | { ok: false; error: string };

const CATEGORIES = [
  "RESERVA",
  "COMISION",
  "MANTENIMIENTO",
  "PUBLICIDAD",
  "MARKETING",
  "SUSCRIPCION",
  "LEGAL",
  "OTRO",
];

type Part = { text?: string };

export async function extractReceipt(imageUrl: string): Promise<ReceiptResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "OCR no disponible: falta GEMINI_API_KEY en el servidor.",
    };
  }

  let mime = "image/jpeg";
  let b64 = "";
  // Defensa en profundidad: timeout + sin seguir redirects (evita que una URL
  // de nuestro storage redirija a un destino externo). El allowlist real vive
  // en el caller (isTrustedStorageUrl).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(imageUrl, { signal: controller.signal, redirect: "error" });
    if (!r.ok) return { ok: false, error: "No se pudo leer la imagen subida." };
    mime = r.headers.get("content-type") || "image/jpeg";
    b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
  } catch {
    return { ok: false, error: "No se pudo descargar la imagen del comprobante." };
  } finally {
    clearTimeout(timer);
  }

  const model = process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash";
  const prompt = [
    "Eres un OCR de facturas y recibos para un agente inmobiliario.",
    "Extrae los datos de la imagen y responde SOLO un JSON válido con estas claves exactas:",
    `{"concepto": string, "monto": number, "moneda": "USD"|"DOP", "fecha": "YYYY-MM-DD", "proveedor": string, "categoria": "${CATEGORIES.join('"|"')}"}`,
    'Reglas: "monto" es el TOTAL final a pagar (incluye ITBIS) como número sin símbolos ni separadores de miles.',
    'Si ves RD$, DOP o "pesos" usa "DOP"; si ves US$, USD o "dólares" usa "USD".',
    '"concepto" es una descripción corta (proveedor + servicio).',
    'Elige la "categoria" más razonable de la lista. Si un dato no aparece, usa null.',
  ].join(" ");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      if (res.status === 429) {
        return { ok: false, error: "Límite de Gemini alcanzado. Intenta de nuevo en un momento." };
      }
      return { ok: false, error: `Gemini respondió ${res.status}. Intenta de nuevo.` };
    }

    const json = (await res.json().catch(() => null)) as
      | { candidates?: { content?: { parts?: Part[] } }[] }
      | null;
    const text =
      json?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join("") ?? "";

    const parsed = safeParseJson(text);
    if (!parsed) {
      return {
        ok: false,
        error: "No pude interpretar la factura. Llena los campos manualmente.",
      };
    }
    return { ok: true, data: normalize(parsed) };
  } catch {
    return { ok: false, error: "Error analizando la factura." };
  }
}

function safeParseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* intenta extraer el primer bloque {...} */
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]) as Record<string, unknown>;
    } catch {
      /* no-op */
    }
  }
  return null;
}

function normalize(o: Record<string, unknown>): ReceiptData {
  const toNum = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  const toStr = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null;

  const moneda = (() => {
    const m = toStr(o.moneda)?.toUpperCase();
    return m === "USD" || m === "DOP" ? (m as "USD" | "DOP") : null;
  })();
  const categoria = (() => {
    const c = toStr(o.categoria)?.toUpperCase();
    return c && CATEGORIES.includes(c) ? c : null;
  })();
  const fecha = (() => {
    const f = toStr(o.fecha);
    return f && /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : null;
  })();

  return {
    concepto: toStr(o.concepto),
    monto: toNum(o.monto),
    moneda,
    fecha,
    proveedor: toStr(o.proveedor),
    categoria,
  };
}
