import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  ImageProcessor,
  ProcessInput,
  ProcessOptions,
  ProcessResult,
} from "./types";
import { uploadFile } from "@/lib/storage";

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
    const target =
      mode === "FURNITURE"
        ? "ALL furniture: sofas, chairs, tables, beds, dressers, shelves, TV stands, desks. KEEP plants, framed art on walls, and built-in architectural decoration (moldings, columns)."
        : mode === "PEOPLE"
          ? "ALL people, pets, and reflections of people. Leave every object, piece of furniture, and decoration exactly as it is."
          : mode === "PERSONAL"
            ? "personal clutter: papers, magazines, clothes, shoes, toys, cables, food, dishes, toiletries, remote controls, phones, bags. Keep furniture and structural elements intact."
            : "EVERY single piece of furniture, every personal object, every person, every loose item. Leave the room completely empty — bare walls, bare floor, only architectural elements remaining.";
    return [
      `TASK: object removal / inpainting for real-estate photography.`,
      `Remove ${target}`,
      `Inpaint behind removed objects so walls, floors, ceilings, and architectural surfaces look continuous, clean, and photorealistic — as if the objects were never there. Match texture, color, lighting, shadows, and perspective perfectly.`,
      `RESULT: a clean, empty, professionally-shot listing photo ready for virtual staging.`,
      `STRUCTURAL PRESERVATION (critical): do NOT modify walls, windows, doors, columns, ceilings, floors, room dimensions, or camera perspective. The viewpoint must be IDENTICAL.`,
      `Do NOT add new objects, furniture, text, watermarks, logos, or signage.`,
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

/**
 * Decode a `data:image/png;base64,xxxxx` URL into `{ mime, data }`.
 * Returns null if not a data URL (so a remote https mask URL would fall
 * through — we don't currently support that, MaskBrush always emits data URLs).
 */
function parseDataUrl(
  dataUrl: string | undefined | null
): { mime: string; data: string } | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], data: match[2] };
}

/**
 * Resolve a remote URL or local /public path to a base64 buffer + mime.
 * Used so we can multi-image input the original + current frame to Gemini.
 */
async function fetchImageAsBase64(
  urlOrPath: string
): Promise<{ data: string; mime: string }> {
  if (/^https?:\/\//i.test(urlOrPath)) {
    const r = await fetch(urlOrPath);
    if (!r.ok)
      throw new Error(`No se pudo descargar imagen: ${urlOrPath} (${r.status})`);
    const ab = await r.arrayBuffer();
    const mime =
      r.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    return { data: Buffer.from(ab).toString("base64"), mime };
  }
  const srcFs = path.join(
    process.cwd(),
    "public",
    urlOrPath.replace(/^\//, "")
  );
  const buf = await readFile(srcFs);
  const ext = path.extname(srcFs).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  return { data: buf.toString("base64"), mime };
}

/**
 * Master continuity preamble — prepended to EVERY Gemini call so the model
 * always anchors on the original architectural facts and produces an edit
 * that reads as the same photo with a small change, not a brand-new scene.
 *
 * When `withOriginalRef === true`, two reference images are included and the
 * prompt explains their roles. Otherwise only one image is sent.
 */
function buildContinuityPreamble(withOriginalRef: boolean): string {
  const lines: string[] = [
    `You are a professional real-estate photo editor. The user has uploaded a property photo and wants ONE specific edit. This edit may be the 1st, 2nd, or even 5th consecutive modification of the same scene. Visual continuity between versions is the absolute top priority.`,
    ``,
    `CONTEXT IMAGES YOU ARE BEING GIVEN:`,
  ];
  if (withOriginalRef) {
    lines.push(
      `- Image 1 = ORIGINAL UPLOAD. This is the architectural ground truth. Camera angle, walls, windows, doors, ceiling, floor geometry, lens perspective and lighting direction in this image are LAW — you must reproduce them.`,
      `- Image 2 = CURRENT WORKING VERSION. This is the most recent edited frame. Furniture, decor and style choices already applied here must be preserved unless the task explicitly overwrites them.`,
      `Your output must look like a natural next step from Image 2, while still respecting every architectural fact from Image 1.`
    );
  } else {
    lines.push(
      `- Image 1 = the photo to edit. Treat its architecture, camera angle, lens, and lighting as the immutable ground truth.`
    );
  }
  lines.push(
    ``,
    `ALWAYS PRESERVE (do NOT change under any circumstance):`,
    `• Exact property structure and architecture`,
    `• Camera angle, framing, and lens perspective`,
    `• Real proportions of the space`,
    `• Windows, doors, columns, ceilings, floors, moldings`,
    `• Base lighting and direction of light`,
    `• Natural shadow direction and intensity`,
    `• Original photo grain, sharpness, and color profile`,
    `• Composition, depth, focal distance`,
    ``,
    `NEVER:`,
    `• Repaint or rebuild architectural elements`,
    `• Shift camera angle, FOV, or perspective`,
    `• Alter real-world proportions`,
    `• Touch anything the user did not ask about`,
    `• Add text, logos, watermarks, or signage`,
    ``,
    `VISUAL STYLE TARGET:`,
    `• Photorealistic, MLS-grade real-estate photography`,
    `• High-end architectural magazine quality`,
    `• Realistic materials and colors, never artificial or over-saturated`,
    `• Premium real-estate lighting (cool natural daylight unless the task requires otherwise)`,
    ``,
    `THE ONLY EDIT YOU PERFORM (everything else stays identical):`
  );
  return lines.join("\n");
}

export class GeminiProcessor implements ImageProcessor {
  constructor(
    private apiKey: string,
    private userId: string
  ) {}

  async process(input: ProcessInput): Promise<ProcessResult> {
    const start = Date.now();

    // 1) Build task-specific prompt fragment
    const builder = TOOL_PROMPTS[input.tool] ?? (() => "Improve this real-estate photo.");
    let taskPrompt = builder(input.options);

    // 2) Optional textarea extra
    if (input.options?.extraPrompt?.trim()) {
      taskPrompt += `\n\nADDITIONAL USER INSTRUCTIONS: ${input.options.extraPrompt.trim()}`;
    }

    // 3) Resolve images:
    //    - currentImg = the photo the user has on screen NOW (last pipeline output or original)
    //    - originalImg = the very first upload, only when it differs from current
    const currentImg = await fetchImageAsBase64(input.inputUrl);
    const originalUrl = input.options?.originalUrl;
    const includeOriginal =
      typeof originalUrl === "string" && originalUrl !== input.inputUrl;
    const originalImg = includeOriginal
      ? await fetchImageAsBase64(originalUrl)
      : null;

    // 4) Mask (only present when the user painted with the magic brush)
    const maskParsed = parseDataUrl(input.options?.maskDataUrl);

    // 5) Compose the final prompt:
    //    [continuity preamble] + [optional mask rules] + [task]
    const continuity = buildContinuityPreamble(includeOriginal);
    const maskPreamble = maskParsed
      ? [
          ``,
          `MASK-GUIDED EDIT MODE — the task applies ONLY to the area painted WHITE in the LAST image attached (the "mask").`,
          `1. WHITE pixels in the mask = the region to MODIFY. Apply the task strictly inside this region.`,
          `2. BLACK pixels in the mask = REGION TO PRESERVE bit-for-bit from the CURRENT WORKING VERSION (same colors, texture, furniture, lighting, shadows, composition, perspective).`,
          `3. Where you remove or replace something inside the white area, inpaint so the edge blends seamlessly with the surrounding unmodified pixels.`,
          `4. Do NOT extend edits beyond the masked area.`,
          ``,
        ].join("\n")
      : "";

    const fullPrompt = `${continuity}\n${maskPreamble}\n${taskPrompt}`;

    // 6) Build multimodal parts list. Order matters — Gemini reads them
    //    in sequence, so the prompt comes first, then images in the
    //    same order they were named in the preamble.
    const reqParts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [{ text: fullPrompt }];

    if (originalImg) {
      // Image 1 = ORIGINAL (architectural anchor)
      reqParts.push({
        inlineData: { mimeType: originalImg.mime, data: originalImg.data },
      });
      // Image 2 = CURRENT WORKING VERSION (last edited frame)
      reqParts.push({
        inlineData: { mimeType: currentImg.mime, data: currentImg.data },
      });
    } else {
      // Single source image — first iteration of the pipeline
      reqParts.push({
        inlineData: { mimeType: currentImg.mime, data: currentImg.data },
      });
    }

    if (maskParsed) {
      // Mask always goes last so the model treats it as the constraint overlay.
      reqParts.push({
        inlineData: { mimeType: maskParsed.mime, data: maskParsed.data },
      });
    }

    // Call Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: reqParts }],
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
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    // Gemini v1beta returns inlineData (camelCase). Older code path used
    // inline_data (snake_case). Read both for forward+backward compat.
    type GeminiPart = {
      inlineData?: { data?: string; mimeType?: string };
      inline_data?: { data?: string; mime_type?: string };
      text?: string;
    };
    const imagePart = (parts as GeminiPart[]).find(
      (p) => p.inlineData?.data ?? p.inline_data?.data
    );
    const base64Out =
      imagePart?.inlineData?.data ?? imagePart?.inline_data?.data;

    if (!base64Out) {
      // Try to extract any text Gemini sent (often a safety / refusal note)
      const textPart = (parts as GeminiPart[]).find((p) => p.text)?.text;
      const finishReason = candidate?.finishReason ?? "unknown";
      const safety = candidate?.safetyRatings
        ? JSON.stringify(candidate.safetyRatings).slice(0, 200)
        : "";
      throw new Error(
        `Gemini no devolvió imagen (finishReason=${finishReason}${
          textPart ? `, text="${textPart.slice(0, 120)}"` : ""
        }${safety ? `, safety=${safety}` : ""})`
      );
    }

    // Save output to Vercel Blob (or local fs in dev). Filesystem is
    // read-only on Vercel serverless, so this MUST go through storage.ts.
    const outBuf = Buffer.from(base64Out, "base64");
    const outBlob = new Blob([new Uint8Array(outBuf)], { type: "image/png" });
    const uploaded = await uploadFile(outBlob, {
      filename: `gen-${Date.now()}.png`,
      prefix: `gen/${this.userId}`,
      contentType: "image/png",
    });

    return {
      outputUrl: uploaded.url,
      processingTimeMs: Date.now() - start,
    };
  }
}
