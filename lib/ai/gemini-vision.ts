import "server-only";

/**
 * Análisis de imagen con el modelo Gemini más barato (flash-lite) para generar
 * un título de pose automático tipo "Personaje · Pose". Costo ~$0.0001/imagen.
 * Lee GEMINI_API_KEY de env. Devuelve null si falla (el caller usa un fallback).
 */

type Part = { text?: string };

export async function describePoseTitle(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const mime = imgRes.headers.get("content-type") || "image/png";
    const b64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
    const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash-lite";

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "Observa esta foto de una persona profesional. Devuelve SOLO un título corto en español con el formato 'Tipo de persona · Pose', máximo 5 palabras, sin comillas ni explicación. Ejemplos: 'Hombre · Brazos cruzados', 'Ejecutiva · Saludo de mano', 'Hombre barba · Señalando'.",
                },
                { inlineData: { mimeType: mime, data: b64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.4, maxOutputTokens: 30 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as
      | { candidates?: { content?: { parts?: Part[] } }[] }
      | null;
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!text) return null;
    return text.replace(/^["']|["']$/g, "").replace(/\s+/g, " ").slice(0, 120);
  } catch {
    return null;
  }
}
