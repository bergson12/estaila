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
  notes: string | null; // datos importantes que no caben en otros campos (ITBIS, ref, etc.)
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
    "Eres un OCR financiero para un agente inmobiliario en República Dominicana.",
    "La imagen puede ser CUALQUIERA de estos: una factura de consumo (supermercado/tienda), un recibo de punto de venta o tarjeta (CARDNET, Visa), una transferencia bancaria (app del banco, ACH, TDC), o cualquier comprobante de pago. SIEMPRE extrae lo más importante; nunca te rindas.",
    "Responde SOLO un JSON válido con estas claves exactas:",
    `{"concepto": string, "monto": number, "moneda": "USD"|"DOP", "fecha": "YYYY-MM-DD", "proveedor": string, "categoria": "${CATEGORIES.join('"|"')}", "notes": string}`,
    "REGLAS:",
    '- "monto": el TOTAL final pagado (busca TOTAL, TOTALRD, "Monto total", "Monto"). Número sin símbolos ni separadores de miles (ej: 4283.85, NO "RD$4,283.85").',
    '- "concepto": SIEMPRE genera uno útil aunque el documento no tenga un campo de concepto:',
    '   * Recibo de tarjeta/POS (CARDNET, Visa): "Compra en {comercio}" (ej: "Compra en Tropigas Santiago").',
    '   * Factura de tienda/supermercado: "Compra {tienda}" (ej: "Compra Bohío Market").',
    '   * Transferencia bancaria: usa el concepto o el beneficiario (ej: "Pago BDH - Ballista Contreras" o "Transferencia a Méndez Méndez Nailea").',
    '   NUNCA devuelvas null en "concepto" si hay un comercio, beneficiario o total visible.',
    '- "proveedor": el comercio, banco o beneficiario/destino.',
    '- "moneda": RD$/DOP/pesos → "DOP"; US$/USD/dólares → "USD". Por defecto "DOP".',
    '- "fecha": fecha del documento en formato YYYY-MM-DD.',
    '- "categoria": la opción más razonable de la lista.',
    '- "notes": resumen corto de datos importantes que no caben en los otros campos: proveedor, RNC/NCF, ITBIS, número de aprobación/referencia, últimos dígitos de tarjeta, banco origen/destino, y los artículos principales si es una factura. Ej: "ITBIS RD$48.81 · Aprob. 453324 · Tarjeta ****5799".',
    '- Si un dato no aparece, usa null (EXCEPTO "concepto" y "monto": esfuérzate al máximo por derivarlos).',
  ].join("\n");

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
            maxOutputTokens: 800,
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

  const proveedor = toStr(o.proveedor);

  // "concepto" SIEMPRE útil: si el modelo no lo dio, se deriva del proveedor o la fecha.
  let concepto = toStr(o.concepto);
  if (!concepto) {
    concepto = proveedor
      ? `Compra ${proveedor}`
      : fecha
        ? `Transacción ${fecha}`
        : "Transacción";
  }

  const notes =
    typeof o.notes === "string" && o.notes.trim()
      ? o.notes.trim().slice(0, 500)
      : null;

  return {
    concepto,
    monto: toNum(o.monto),
    moneda,
    fecha,
    proveedor,
    categoria,
    notes,
  };
}
