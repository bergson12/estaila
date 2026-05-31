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
  categoria: string | null; // subtipo de transacción (accounting_category)
  flujo: "INGRESO" | "GASTO" | null; // dirección del dinero
  notes: string | null; // resumen rico: tipo doc, dynamic fields, entidades, warnings
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
    "Eres un sistema OCR inteligente de documentos para un CRM inmobiliario en República Dominicana.",
    "Detecta automáticamente el TIPO de documento y extrae TODA la información relevante; NO te limites a campos predefinidos. El documento puede ser: factura, recibo, recibo de tarjeta/POS (CARDNET, Visa), transferencia bancaria (ACH/app/TDC), depósito, cheque, contrato (venta/alquiler/exclusividad), estado de cuenta, comprobante de combustible/mantenimiento/publicidad/legal, nómina, comisión, captura de WhatsApp, correo, tasación, certificado de título, documento de identidad, etc.",
    "Responde SOLO un JSON válido con esta forma EXACTA:",
    `{
  "document_type": "tipo en minúsculas (ej: factura_consumo, recibo_pos, transferencia_bancaria, contrato_alquiler, comision)",
  "confidence": 0.0,
  "flujo": "INGRESO"|"GASTO",
  "concepto": "descripción corta y útil del movimiento",
  "known_fields": {
    "total": 0,
    "subtotal": null,
    "impuestos": null,
    "moneda": "DOP"|"USD",
    "fecha_emision": "YYYY-MM-DD"|null,
    "fecha_pago": "YYYY-MM-DD"|null,
    "proveedor": "comercio/banco/beneficiario"|null
  },
  "dynamic_fields": {},
  "entities": [{"type":"cliente|propietario|agente|empresa|banco|proveedor|propiedad","name":"..."}],
  "accounting_category": "${CATEGORIES.join("|")}",
  "crm_category": "texto libre",
  "warnings": []
}`,
    "REGLAS:",
    '- "known_fields.total" y "concepto" SIEMPRE deben tener valor si hay algo legible; "concepto" NUNCA null.',
    '- Montos: numero plano sin simbolos ni separadores de miles (4283.85, NO "RD$4,283.85").',
    '- "concepto" ejemplos: "Compra en Tropigas Santiago" (POS), "Compra Bohio Market" (factura), "Pago BDH - Ballista Contreras" (transferencia), "Comision venta Casa Miraflores".',
    '- "moneda": RD$/DOP/pesos = "DOP"; US$/USD/dolares = "USD". Por defecto "DOP".',
    '- "flujo": compras/facturas/recibos/pagos enviados = "GASTO"; transferencias o pagos RECIBIDOS, comisiones cobradas, depositos a favor = "INGRESO". Por defecto "GASTO".',
    '- "accounting_category": la opcion mas razonable de la lista.',
    '- "dynamic_fields": coloca AQUI todo dato extra SIN perder informacion (RNC, NCF, numero de aprobacion/referencia, ultimos digitos de tarjeta, lote, torre, unidad, matricula, banco origen/destino, articulos principales, etc.) como clave:valor.',
    '- "confidence": numero 0..1 de que tan seguro estas del tipo de documento.',
    '- "warnings": avisos (dato ilegible, monto dudoso, imagen borrosa).',
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
            maxOutputTokens: 1500,
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

  const asObj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};

  const kf = asObj(o.known_fields);
  const df = asObj(o.dynamic_fields);

  const moneda = (() => {
    const m = toStr(kf.moneda)?.toUpperCase();
    return m === "USD" || m === "DOP" ? (m as "USD" | "DOP") : "DOP";
  })();
  const fecha = (() => {
    const f = toStr(kf.fecha_emision) ?? toStr(kf.fecha_pago);
    return f && /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : null;
  })();
  const categoria = (() => {
    const c = toStr(o.accounting_category)?.toUpperCase();
    return c && CATEGORIES.includes(c) ? c : "OTRO";
  })();
  const flujo: "INGRESO" | "GASTO" =
    toStr(o.flujo)?.toUpperCase() === "INGRESO" ? "INGRESO" : "GASTO";

  const entities = (Array.isArray(o.entities) ? o.entities : [])
    .map((e) => {
      const obj = asObj(e);
      const name = toStr(obj.name);
      const type = toStr(obj.type) ?? "?";
      return name ? { type, name } : null;
    })
    .filter((e): e is { type: string; name: string } => e !== null);

  const proveedor =
    toStr(kf.proveedor) ??
    entities.find((e) => /proveedor|empresa|banco/i.test(e.type))?.name ??
    null;

  // "concepto" SIEMPRE util: si el modelo no lo dio, se deriva del proveedor o la fecha.
  let concepto = toStr(o.concepto);
  if (!concepto) {
    concepto = proveedor
      ? `Compra ${proveedor}`
      : fecha
        ? `Transaccion ${fecha}`
        : "Transaccion";
  }

  // notes: resumen rico (tipo doc + confianza + ITBIS + dynamic fields + entidades + warnings).
  const parts: string[] = [];
  const docType = toStr(o.document_type);
  const conf =
    typeof o.confidence === "number" ? Math.round(o.confidence * 100) : null;
  if (docType) parts.push(`Tipo: ${docType}${conf != null ? ` (${conf}%)` : ""}`);
  const itbis = toNum(kf.impuestos);
  if (itbis != null) parts.push(`ITBIS: ${itbis}`);
  for (const [k, v] of Object.entries(df)) {
    if (v != null && String(v).trim()) {
      parts.push(`${k}: ${String(v).slice(0, 60)}`);
    }
  }
  if (entities.length) {
    parts.push(
      `Entidades: ${entities.map((e) => `${e.type}=${e.name}`).join(", ")}`
    );
  }
  const warnings = (Array.isArray(o.warnings) ? o.warnings : [])
    .map((w) => String(w).trim())
    .filter(Boolean);
  if (warnings.length) parts.push(`Avisos: ${warnings.join("; ")}`);
  const notes = parts.length ? parts.join(" | ").slice(0, 800) : null;

  return {
    concepto,
    monto: toNum(kf.total),
    moneda,
    fecha,
    proveedor,
    categoria,
    flujo,
    notes,
  };
}
