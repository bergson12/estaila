import "server-only";

/**
 * OpenAI gpt-image-1 — edición imagen-a-imagen para "Foto Pro" del agente.
 *
 * Usa el endpoint /v1/images/edits (multipart) con `fetch` puro (compatible con
 * cualquier runtime). La key SIEMPRE se lee de `process.env.OPENAI_API_KEY` —
 * nunca se hardcodea. Devuelve una tagged-union para que el caller decida.
 *
 * Nota de realismo: gpt-image-1 conserva razonablemente el rostro/rasgos pero
 * NO es face-swap; OpenAI no garantiza identidad pixel-perfect.
 */

export type OpenAIImageResult =
  | { ok: true; base64: string }
  | {
      ok: false;
      error: string;
      code: "NO_KEY" | "AUTH" | "QUOTA" | "VERIFICATION" | "CONTENT" | "UNKNOWN";
    };

export type EditParams = {
  /** Imágenes de referencia (la primera = foto principal del agente). */
  images: { data: Uint8Array; name: string; type: string }[];
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
};

/** Detecta el formato real por magic-bytes (no confía en el content-type recibido). */
function sniffImage(bytes: Uint8Array): { ext: string; type: string } {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  )
    return { ext: "png", type: "image/png" };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { ext: "jpg", type: "image/jpeg" };
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  )
    return { ext: "webp", type: "image/webp" };
  return { ext: "png", type: "image/png" };
}

export async function editAgentPhoto(params: EditParams): Promise<OpenAIImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      code: "NO_KEY",
      error: "OPENAI_API_KEY no está configurada en el servidor.",
    };
  }
  if (!params.images.length) {
    return { ok: false, code: "UNKNOWN", error: "Falta la imagen de origen." };
  }

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", params.prompt);
  form.append("n", "1");
  form.append("size", params.size ?? "1024x1024");
  form.append("quality", params.quality ?? "medium");
  for (const img of params.images) {
    const sn = sniffImage(img.data);
    // Copia a un ArrayBuffer "limpio" para el Blob (evita issues de SharedArrayBuffer).
    const ab = img.data.slice().buffer;
    form.append("image[]", new Blob([ab], { type: sn.type }), `image.${sn.ext}`);
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch (e) {
    return { ok: false, code: "UNKNOWN", error: `Error de red con OpenAI: ${(e as Error).message}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      return { ok: false, code: "AUTH", error: "API key de OpenAI inválida o revocada." };
    }
    if (res.status === 429) {
      return { ok: false, code: "QUOTA", error: "Límite o cuota de OpenAI alcanzado. Revisa tu saldo." };
    }
    if (res.status === 403 || /verif/i.test(text)) {
      return {
        ok: false,
        code: "VERIFICATION",
        error: "Tu organización de OpenAI necesita verificación para usar gpt-image-1.",
      };
    }
    if (/safety|content_policy|moderation/i.test(text)) {
      return { ok: false, code: "CONTENT", error: "La imagen o el prompt fue rechazado por las políticas de OpenAI." };
    }
    return { ok: false, code: "UNKNOWN", error: `OpenAI respondió ${res.status}: ${text.slice(0, 200)}` };
  }

  const data = (await res.json().catch(() => null)) as
    | { data?: { b64_json?: string }[] }
    | null;
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    return { ok: false, code: "UNKNOWN", error: "OpenAI no devolvió ninguna imagen." };
  }
  return { ok: true, base64: b64 };
}
