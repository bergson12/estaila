import { MockProcessor } from "./mock-processor";
import { GeminiProcessor } from "./gemini-processor";
import type { ImageProcessor } from "./types";

/**
 * Factory — returns the active processor.
 * Behavior is controlled by AppSettings.aiProvider:
 *   - AUTO:   Gemini if key set, else mock fallback (default)
 *   - GEMINI: force Gemini (errors if no key)
 *   - MOCK:   force mock (skip real AI, $0 cost)
 *
 * Pass the runtime provider override from the admin settings.
 */
export function getProcessor(
  userId: string,
  override?: "AUTO" | "GEMINI" | "MOCK"
): ImageProcessor {
  const geminiKey = process.env.GEMINI_API_KEY;
  const mode = override ?? "AUTO";
  if (mode === "MOCK") return new MockProcessor(userId);
  if (mode === "GEMINI") {
    if (!geminiKey) {
      throw new Error(
        "AI provider está fijado en GEMINI pero falta GEMINI_API_KEY. Configura .env o cambia a AUTO/MOCK en /admin/settings."
      );
    }
    return new GeminiProcessor(geminiKey, userId);
  }
  // AUTO
  if (geminiKey) return new GeminiProcessor(geminiKey, userId);
  return new MockProcessor(userId);
}

export function isRealAIEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export const TOOL_COST: Record<string, number> = {
  STAGING: 2,
  DECLUTTER: 1,
  ENHANCE: 1,
  STYLE_CHANGE: 2,
  SKY: 1,
  TWILIGHT: 1,
  POOL: 1,
  LAWN: 1,
  ADD_OBJECT: 1,
  REMOVE_OBJECT: 1,
};

export * from "./types";
