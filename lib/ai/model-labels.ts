/**
 * Etiquetas comerciales de los modelos de IA. Ocultan el proveedor real al
 * usuario y presentan los tiers propios de estaila:
 *   DeepSeek   → "Modelo Estándar"  (texto: chat, bios, propuestas)
 *   Gemini     → "Modelo Pro"       (imágenes Studio + visión/OCR)
 *   GPT Image  → "Modelo Max"       (retratos de agente, premium)
 *
 * Usar SOLO donde se le muestra al usuario con qué modelo se generó algo.
 */
export const MODEL_ESTANDAR = "Modelo Estándar";
export const MODEL_PRO = "Modelo Pro";
export const MODEL_MAX = "Modelo Max";

export function modelLabel(raw?: string | null): string {
  const s = (raw ?? "").toLowerCase();
  if (!s) return MODEL_PRO;
  if (s.includes("gpt") || s.includes("openai") || s.includes("dall"))
    return MODEL_MAX;
  if (s.includes("gemini") || s.includes("imagen") || s.includes("nano"))
    return MODEL_PRO;
  if (s.includes("deepseek")) return MODEL_ESTANDAR;
  return MODEL_PRO; // fallback razonable
}
