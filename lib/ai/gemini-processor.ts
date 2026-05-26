import "server-only";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ImageProcessor,
  ProcessInput,
  ProcessOptions,
  ProcessResult,
} from "./types";

/**
 * GeminiProcessor — real image generation via Google Gemini 2.5 Flash Image
 * (a.k.a. "Nanobanana" — Google's image editing model).
 *
 * https://ai.google.dev/gemini-api/docs/image-generation
 *
 * Why Gemini for real estate:
 *  - Preserves structure (walls / windows / columns) when prompted correctly
 *  - Supports multi-modal input (text + reference image)
 *  - Fast (~3-15s per generation), cheap
 *
 * Cost reference (as of late 2025): ~$0.039 per image — much cheaper than Replicate.
 */

// Image generation requires the specific image variant. Text/vision flows use
// `gemini-flash-latest` (auto-rolls to current latest).
const GEMINI_MODEL = "gemini-2.5-flash-image";

type Prompter = (opts: ProcessOptions | undefined, property?: PropertyHints) => string;

type PropertyHints = {
  category?: string;
  location?: string;
};

const TOOL_PROMPTS: Record<string, Prompter> = {
  STAGING: (opts) => {
    const style = humanizeStyle(opts?.style);
    const room = humanizeRoom(opts?.roomType);
    const density = humanizeDensity(opts?.density);
    const clearFirst = opts?.removeFurnitureFirst
      ? "First, mentally remove ALL existing furniture and personal objects. Then add new furniture as if the room were empty. "
      : "";
    return [
      `You are a professional real-estate virtual staging AI. ${clearFirst}Add ${density} ${style} furniture, decorations, plants, and tasteful lighting to this ${room}.`,
      `Photorealistic result. Match the existing lighting direction and quality.`,
      `STRUCTURAL PRESERVATION (critical): do NOT modify walls, windows, doors, columns, ceilings, floors, architectural moldings, or room dimensions. Keep all fixed elements EXACTLY as in the input.`,
      `Do not add text, logos, watermarks, or signage.`,
    ].join("\n");
  },

  DECLUTTER: (opts) => {
    const mode = opts?.declutterMode ?? "AUTO";
    const what =
      mode === "FURNITURE"
        ? "furniture only — keep plants, art, and architectural decoration"
        : mode === "PEOPLE"
          ? "people only — leave the room exactly as is otherwise"
          : mode === "PERSONAL"
            ? "personal items, papers, clothes, toys, and general clutter"
            : "ALL furniture, people, personal objects, and clutter";
    return [
      `Remove ${what} from this room.`,
      `Inpaint cleanly where objects used to be. The result should look like a clean, empty, ready-to-show real-estate photo.`,
      `STRUCTURAL PRESERVATION (critical): do NOT modify walls, windows, doors, columns, ceilings, floors, or room dimensions.`,
      `No watermarks. No text. No new objects added.`,
    ].join("\n");
  },

  ENHANCE: (opts) => {
    const preset = opts?.preset;
    const presetText =
      preset === "INTERIOR_DARK"
        ? "Add gentle fill light to dark areas, preserve highlight detail."
        : preset === "YELLOW_TONES"
          ? "Fix yellow color cast — neutralize white balance."
          : preset === "PHONE_PHOTO"
            ? "Enhance sharpness, dynamic range, and color depth as if shot with a pro camera."
            : preset === "CLOUDY"
              ? "Add warmth and brightness as if shot on a sunny day."
              : "";
    return [
      `Enhance this real-estate photo to look professionally edited:`,
      `improve lighting, contrast, color balance, and sharpness.`,
      `Make it look like an MLS-grade listing photo.`,
      presetText,
      `STRUCTURAL PRESERVATION (critical): do NOT alter the scene, geometry, or any architectural element. Only improve image quality.`,
    ]
      .filter(Boolean)
      .join("\n");
  },

  STYLE_CHANGE: (opts) => {
    const style = humanizeStyle(opts?.style);
    return [
      `Change the decoration style of this room to ${style}.`,
      `Keep the same layout, the position of existing furniture pieces, and the same room dimensions.`,
      `Replace fabrics, finishes, decorations, art, and accent lighting to reflect the new style.`,
      `STRUCTURAL PRESERVATION (critical): walls, windows, doors, columns, floors, ceilings must remain identical.`,
    ].join("\n");
  },

  SKY: (opts) => {
    const mode = opts?.skyMode ?? "CLEAR";
    const sky =
      mode === "SUNSET"
        ? "warm sunset sky with gold and pink tones, just before dusk"
        : mode === "DRAMATIC"
          ? "dramatic cloudy sky with depth and contrast"
          : mode === "TROPICAL"
            ? "tropical blue sky with soft white clouds"
            : "clean blue sky, very few clouds, bright daylight";
    return [
      `Replace the sky in this exterior real-estate photo with a ${sky}.`,
      `Match the new sky's lighting to the property realistically.`,
      `STRUCTURAL PRESERVATION (critical): the property, ground, vegetation, and all foreground elements must stay identical.`,
    ].join("\n");
  },

  TWILIGHT: () =>
    [
      `Transform this daytime exterior photo into a luxury twilight scene:`,
      `warm golden-hour sunlight, soft glowing windows as if interior lights are on, atmospheric sky transitioning from deep blue to amber on the horizon, gentle reflections on water if present.`,
      `Photorealistic real-estate twilight photography style.`,
      `STRUCTURAL PRESERVATION (critical): the property structure, landscaping, and layout must remain identical.`,
    ].join("\n"),

  POOL: () =>
    [
      `Improve the pool in this photo: make the water perfectly clear, crystal blue, with subtle natural reflections.`,
      `Clean the tile, edges, and surrounding deck. Remove any debris or algae.`,
      `STRUCTURAL PRESERVATION (critical): pool shape, deck, and surrounding elements must remain identical.`,
    ].join("\n"),

  LAWN: () =>
    [
      `Replace any dead, dry, or patchy grass with lush, healthy, vibrant green grass.`,
      `Make plants and vegetation look freshly maintained and healthy.`,
      `STRUCTURAL PRESERVATION (critical): preserve all trees, paths, structures, and elements exactly. Only improve the lawn and plants.`,
    ].join("\n"),

  ADD_OBJECT: (opts) =>
    [
      `Add ${opts?.prompt ?? "the requested object"} to this room in a natural, well-composed position.`,
      `Match lighting, shadows, and perspective.`,
      `STRUCTURAL PRESERVATION (critical): do not change anything else.`,
    ].join("\n"),

  REMOVE_OBJECT: (opts) =>
    [
      `Remove ${opts?.prompt ?? "the indicated objects"} from this photo.`,
      `Inpaint naturally so the scene looks complete.`,
      `STRUCTURAL PRESERVATION (critical): everything else must remain identical.`,
    ].join("\n"),
};

function humanizeStyle(style?: string): string {
  if (!style) return "modern contemporary";
  const map: Record<string, string> = {
    MODERN: "modern contemporary",
    SCANDINAVIAN: "Scandinavian minimalist",
    CARIBENO: "tropical Caribbean coastal",
    COLONIAL: "colonial classic warm",
    MINIMALISTA: "minimalist Japandi",
    LUXURY: "high-end luxury with marble, brass, and velvet",
    INDUSTRIAL: "industrial loft with exposed brick and steel",
    COSTERO: "coastal beach house",
  };
  return map[style] ?? style.toLowerCase();
}

function humanizeRoom(room?: string): string {
  const map: Record<string, string> = {
    LIVING: "living room / sala",
    BEDROOM: "bedroom / dormitorio",
    KITCHEN: "kitchen / cocina",
    DINING: "dining room / comedor",
    OFFICE: "home office",
    EXTERIOR: "exterior / patio",
  };
  return map[room ?? ""] ?? "room";
}

function humanizeDensity(d?: string): string {
  if (d === "MINIMAL") return "minimal, only essential";
  if (d === "FULL") return "fully furnished, generous";
  return "balanced, well-proportioned";
}

export class GeminiProcessor implements ImageProcessor {
  constructor(
    private apiKey: string,
    private userId: string
  ) {}

  async process(input: ProcessInput): Promise<ProcessResult> {
    const start = Date.now();

    // Build prompt
    const builder = TOOL_PROMPTS[input.tool] ?? (() => "Improve this real-estate photo.");
    const prompt = builder(input.options);

    // Resolve source — local file OR remote URL
    let buf: Buffer;
    let mime = "image/jpeg";
    if (/^https?:\/\//i.test(input.inputUrl)) {
      const r = await fetch(input.inputUrl);
      if (!r.ok) throw new Error(`No se pudo descargar imagen origen: ${r.status}`);
      const ab = await r.arrayBuffer();
      buf = Buffer.from(ab);
      mime = r.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    } else {
      const srcFs = path.join(
        process.cwd(),
        "public",
        input.inputUrl.replace(/^\//, "")
      );
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

    // Call Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    });

    if (!res.ok) {
      let raw = "";
      try {
        const errBody = await res.json();
        raw = errBody?.error?.message ?? "";
      } catch {
        // ignore
      }
      // Quota: free tier limit = 0 for image gen
      if (res.status === 429) {
        const err = new Error(
          "Cuota de Gemini agotada (free tier no incluye image-gen). Usando preview con filtro CSS. Activa billing en aistudio.google.com para producción."
        );
        (err as Error & { code?: string }).code = "GEMINI_QUOTA";
        throw err;
      }
      if (res.status === 403) {
        throw new Error(
          "Gemini API: acceso denegado (403). Verifica que la API key tenga permisos de Generative AI."
        );
      }
      throw new Error(
        `Gemini API ${res.status}${raw ? `: ${raw.slice(0, 160)}` : ""}`
      );
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p: { inline_data?: { data?: string } }) => p.inline_data?.data
    );
    if (!imagePart?.inline_data?.data) {
      throw new Error("Gemini no devolvió imagen — intenta de nuevo con otro prompt.");
    }

    // Save output
    const outBuf = Buffer.from(imagePart.inline_data.data, "base64");
    const outName = `${randomUUID()}.png`;
    const outDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      this.userId,
      "generations"
    );
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, outName), outBuf);

    return {
      outputUrl: `/uploads/${this.userId}/generations/${outName}`,
      processingTimeMs: Date.now() - start,
    };
  }
}
