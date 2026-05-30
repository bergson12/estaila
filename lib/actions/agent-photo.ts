"use server";

/**
 * Foto Pro del Agente — retrato profesional de estudio a partir de la foto del
 * agente, conservando rostro y rasgos. Usa OpenAI gpt-image-1 (edits).
 *
 * Flujo autocontenido (no pasa por el `generate()` de Gemini): valida créditos,
 * registra un `AIGeneration` (tool=AGENT_PHOTO), llama a OpenAI, sube el
 * resultado a Blob y descuenta créditos. Devuelve tagged-union.
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { editAgentPhoto } from "@/lib/ai/openai-image";
import { AGENT_PHOTO_COST, type AgentPhotoInput } from "@/lib/ai/agent-photo-options";

const COST = AGENT_PHOTO_COST;

const STYLE_PROMPT: Record<string, string> = {
  corporativo: "formal corporate look, confident and trustworthy",
  moderno: "modern minimalist aesthetic, clean and contemporary",
  calido: "warm and approachable, friendly inviting mood",
  editorial: "editorial magazine-style portrait, polished and stylish",
  exterior: "natural outdoor setting with soft daylight",
  lujo: "high-end luxury real-estate branding, premium and elegant",
};
const WARDROBE_PROMPT: Record<string, string> = {
  traje: "wearing a well-tailored formal suit",
  business_casual: "wearing smart business-casual attire",
  blazer: "wearing a well-fitted blazer",
  camisa: "wearing a crisp dress shirt",
  actual: "keeping their current clothing",
};
const BACKGROUND_PROMPT: Record<string, string> = {
  estudio_gris: "on a neutral grey studio backdrop",
  blanco: "on a clean white studio background",
  oficina: "with a modern, softly blurred office background",
  ciudad: "with a blurred city street background",
  interior_lujo: "with an elegant luxury interior background",
  marca: "on a subtle green brand-colored gradient background",
};
const POSE_PROMPT: Record<string, string> = {
  frontal: "facing the camera with a natural, confident smile",
  brazos: "with arms crossed in a confident professional posture",
  tres_cuartos: "in a three-quarter angle pose",
  casual: "in a relaxed, casual leaning pose",
  actual: "keeping their current pose",
};
const FRAMING_PROMPT: Record<string, string> = {
  closeup: "tight close-up headshot framing (head and shoulders)",
  bust: "bust framing (chest up)",
  half: "half-body framing (waist up)",
};
const LIGHTING_PROMPT: Record<string, string> = {
  studio: "professional studio lighting with a soft key light",
  natural: "natural soft daylight",
  dramatic: "dramatic directional lighting with gentle shadows",
  soft: "soft, diffused, flattering lighting",
};
const EXPRESSION_PROMPT: Record<string, string> = {
  smile: "a warm, natural smile",
  serious: "a calm, serious expression",
  confident: "a confident, approachable expression",
};
const RETOUCH_PROMPT: Record<string, string> = {
  natural: "subtle natural retouching, keep realistic skin texture",
  polished: "polished magazine-grade retouching while staying photorealistic",
};
const KEEP_PROMPT: Record<string, string> = {
  beard: "the exact same beard",
  glasses: "the same glasses",
  hairstyle: "the same hairstyle",
  skintone: "the exact same skin tone",
};
const SIZE_MAP: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
  vertical: "1024x1536",
  cuadrado: "1024x1024",
  horizontal: "1536x1024",
};

const Input = z.object({
  inputUrl: z.string().url().max(2000),
  style: z.enum(["corporativo", "moderno", "calido", "editorial", "exterior", "lujo"]).default("corporativo"),
  wardrobe: z.enum(["traje", "business_casual", "blazer", "camisa", "actual"]).default("business_casual"),
  background: z.enum(["estudio_gris", "blanco", "oficina", "ciudad", "interior_lujo", "marca"]).default("estudio_gris"),
  pose: z.enum(["frontal", "brazos", "tres_cuartos", "casual", "actual"]).default("frontal"),
  size: z.enum(["vertical", "cuadrado", "horizontal"]).default("vertical"),
  framing: z.enum(["closeup", "bust", "half"]).default("bust"),
  lighting: z.enum(["studio", "natural", "dramatic", "soft"]).default("studio"),
  expression: z.enum(["smile", "serious", "confident"]).default("confident"),
  retouch: z.enum(["natural", "polished"]).default("natural"),
  keep: z.array(z.string()).max(8).default([]),
  referenceId: z.string().max(40).optional().nullable(),
  extra: z.string().trim().max(500).optional(),
});

type ParsedInput = z.infer<typeof Input>;

type AgentPhotoResult =
  | { ok: true; id: string; outputUrl: string; remainingCredits: number; model: string }
  | { ok: false; error: string; code?: string };

function buildPrompt(d: ParsedInput, hasReference: boolean): string {
  const keepClause =
    d.keep.length > 0
      ? `Keep ${d.keep.map((k) => KEEP_PROMPT[k]).filter(Boolean).join(", ")} identical to the original.`
      : "";
  return [
    "Transform this photograph into a professional, studio-quality portrait of THE SAME PERSON.",
    "CRITICAL: preserve their exact face, facial features, identity, bone structure, skin tone, hair and approximate age. Do NOT change or over-beautify the face beyond subtle, natural professional retouching.",
    keepClause,
    "This is a professional headshot for a real-estate agent.",
    STYLE_PROMPT[d.style] + ",",
    WARDROBE_PROMPT[d.wardrobe] + ",",
    BACKGROUND_PROMPT[d.background] + ",",
    POSE_PROMPT[d.pose] + ",",
    FRAMING_PROMPT[d.framing] + ",",
    LIGHTING_PROMPT[d.lighting] + ".",
    `Expression: ${EXPRESSION_PROMPT[d.expression]}.`,
    RETOUCH_PROMPT[d.retouch] + ".",
    hasReference
      ? "Use the SECOND image ONLY as a style/lighting/composition reference — replicate its look and feel, but keep the person (face and identity) from the FIRST image."
      : "",
    "Photorealistic, sharp focus, high-end corporate photography, flattering and clean composition.",
    d.extra?.trim() ? `Additional direction: ${d.extra.trim()}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateAgentPhoto(input: AgentPhotoInput): Promise<AgentPhotoResult> {
  const user = await requireUser();
  const data = Input.parse(input);

  // --- Créditos / cuenta ---
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, suspended: true },
  });
  if (!dbUser || dbUser.suspended) {
    return { ok: false, error: "Cuenta no disponible.", code: "AUTH" };
  }
  if (dbUser.credits < COST) {
    return {
      ok: false,
      error: `Créditos insuficientes. Foto Pro cuesta ${COST} créditos y tienes ${dbUser.credits}.`,
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // --- Resolver foto de referencia (opcional) ---
  let referenceUrl: string | null = null;
  if (data.referenceId) {
    const preset = await prisma.stylePreset
      .findUnique({ where: { id: data.referenceId }, select: { imageUrl: true } })
      .catch(() => null);
    referenceUrl = preset?.imageUrl ?? null;
  }
  const prompt = buildPrompt(data, !!referenceUrl);

  // --- Registro PROCESSING ---
  const gen = await prisma.aIGeneration.create({
    data: {
      userId: user.id,
      tool: "AGENT_PHOTO",
      inputUrl: data.inputUrl,
      prompt,
      style: data.style,
      options: JSON.stringify({
        wardrobe: data.wardrobe,
        background: data.background,
        pose: data.pose,
        size: data.size,
        framing: data.framing,
        lighting: data.lighting,
        expression: data.expression,
        retouch: data.retouch,
        keep: data.keep,
        referenceId: data.referenceId ?? null,
      }),
      status: "PROCESSING",
      creditsUsed: COST,
    },
    select: { id: true },
  });

  try {
    // --- Descarga la foto de origen ---
    const imgRes = await fetch(data.inputUrl);
    if (!imgRes.ok) throw new Error("No se pudo leer la foto de origen.");
    const type = imgRes.headers.get("content-type") || "image/png";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    const ext = type.includes("jpeg") || type.includes("jpg") ? "jpg" : type.includes("webp") ? "webp" : "png";

    const images: { data: Uint8Array; name: string; type: string }[] = [
      { data: bytes, name: `agente.${ext}`, type },
    ];

    // --- Foto de referencia (best-effort) → 2da imagen para gpt-image-2 ---
    if (referenceUrl) {
      try {
        const rRes = await fetch(referenceUrl);
        if (rRes.ok) {
          const rType = rRes.headers.get("content-type") || "image/png";
          images.push({
            data: new Uint8Array(await rRes.arrayBuffer()),
            name: "referencia.png",
            type: rType,
          });
        }
      } catch {
        // si falla la referencia, generamos solo con la foto del agente
      }
    }

    // --- OpenAI ---
    const result = await editAgentPhoto({
      images,
      prompt,
      size: SIZE_MAP[data.size],
      // "high" excede los 60s de Vercel (timeout). "medium" entra en tiempo y cuesta ~3x menos.
      quality: "medium",
    });

    if (!result.ok) {
      await prisma.aIGeneration.update({
        where: { id: gen.id },
        data: { status: "FAILED", errorMsg: result.error },
      });
      return { ok: false, error: result.error, code: result.code };
    }

    // --- Sube el resultado a Blob ---
    const outBuf = Buffer.from(result.base64, "base64");
    const outBlob = new Blob([new Uint8Array(outBuf)], { type: "image/png" });
    const uploaded = await uploadFile(outBlob, {
      filename: `foto-pro-${Date.now()}.png`,
      prefix: `gen/${user.id}`,
      contentType: "image/png",
    });

    // --- Completa + descuenta créditos (atómico) ---
    await prisma.$transaction([
      prisma.aIGeneration.update({
        where: { id: gen.id },
        data: { status: "COMPLETED", outputUrl: uploaded.url, completedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: COST } },
      }),
    ]);

    revalidatePath("/studio/galeria");
    return {
      ok: true,
      id: gen.id,
      outputUrl: uploaded.url,
      remainingCredits: dbUser.credits - COST,
      model: result.model,
    };
  } catch (e) {
    await prisma.aIGeneration
      .update({ where: { id: gen.id }, data: { status: "FAILED", errorMsg: (e as Error).message } })
      .catch(() => null);
    return { ok: false, error: (e as Error).message || "Error generando la foto.", code: "UNKNOWN" };
  }
}
