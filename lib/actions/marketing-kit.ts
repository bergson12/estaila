"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  generateMarketingKit,
  type MarketingParams,
} from "@/lib/ai/marketing-ai";

// ============================================================
// Validation
// ============================================================

const AudienceEnum = z.enum([
  "FAMILIA",
  "INVESTOR",
  "FOREIGN",
  "FIRST_BUYER",
  "LUXURY",
  "GENERAL",
]);
const ToneEnum = z.enum([
  "ELEGANT",
  "CASUAL",
  "URGENT",
  "ASPIRATIONAL",
  "TECHNICAL",
]);
const GoalEnum = z.enum([
  "VISIT",
  "OFFER",
  "AWARENESS",
  "OPEN_HOUSE",
  "PRICE_DROP",
]);

const ParamsSchema = z.object({
  audience: AudienceEnum.optional().or(z.literal("")),
  tone: ToneEnum.optional().or(z.literal("")),
  goal: GoalEnum.optional().or(z.literal("")),
  angle: z.string().trim().max(400).optional().or(z.literal("")),
  language: z.enum(["es", "en"]).optional().or(z.literal("")),
});

const CreateSchema = ParamsSchema.extend({
  propertyId: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
});

type CreateInput = z.infer<typeof CreateSchema>;

// ============================================================
// Helpers
// ============================================================

function defaultKitName(audience?: string, tone?: string): string {
  const a = audience && audience !== "GENERAL" ? audienceLabel(audience) : null;
  const t = tone ? toneLabel(tone) : null;
  if (a && t) return `Kit · ${a} · ${t}`;
  if (a) return `Kit · ${a}`;
  if (t) return `Kit · ${t}`;
  return `Kit · ${new Date().toLocaleDateString("es", { day: "numeric", month: "short" })}`;
}

function audienceLabel(a: string): string {
  return (
    {
      FAMILIA: "Familia",
      INVESTOR: "Inversor",
      FOREIGN: "Extranjero",
      FIRST_BUYER: "1er comprador",
      LUXURY: "Lujo",
      GENERAL: "General",
    }[a] ?? a
  );
}

function toneLabel(t: string): string {
  return (
    {
      ELEGANT: "Elegante",
      CASUAL: "Casual",
      URGENT: "Urgente",
      ASPIRATIONAL: "Aspiracional",
      TECHNICAL: "Técnico",
    }[t] ?? t
  );
}

function emptyToUndef<T extends string | undefined>(v: T): T | undefined {
  return v === "" ? undefined : v;
}

function paramsFromInput(input: z.infer<typeof ParamsSchema>): MarketingParams {
  return {
    audience: emptyToUndef(input.audience) as MarketingParams["audience"],
    tone: emptyToUndef(input.tone) as MarketingParams["tone"],
    goal: emptyToUndef(input.goal) as MarketingParams["goal"],
    angle: emptyToUndef(input.angle),
    language: emptyToUndef(input.language) as MarketingParams["language"],
  };
}

// ============================================================
// CRUD
// ============================================================

export async function createMarketingKit(input: CreateInput) {
  const user = await requireUser();
  const data = CreateSchema.parse(input);

  // Verify ownership
  const owned = await prisma.property.findFirst({
    where: { id: data.propertyId, userId: user.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Propiedad no encontrada");

  const params = paramsFromInput(data);

  // Generate AI content
  const generated = await generateMarketingKit(data.propertyId, params);

  const kit = await prisma.marketingKit.create({
    data: {
      userId: user.id,
      propertyId: data.propertyId,
      name: data.name?.trim() || defaultKitName(params.audience, params.tone),
      audience: params.audience ?? null,
      tone: params.tone ?? null,
      goal: params.goal ?? null,
      angle: params.angle ?? null,
      language: params.language ?? "es",
      captions: JSON.stringify(generated.captions),
      hashtags: JSON.stringify(generated.hashtags),
      bios: JSON.stringify(generated.bios),
      status: "DRAFT",
    },
  });

  revalidatePath(`/propiedades/${data.propertyId}`);
  return { id: kit.id };
}

export async function listMarketingKits(propertyId: string) {
  const user = await requireUser();
  return prisma.marketingKit.findMany({
    where: { userId: user.id, propertyId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function getMarketingKit(id: string) {
  const user = await requireUser();
  const kit = await prisma.marketingKit.findFirst({
    where: { id, userId: user.id },
  });
  if (!kit) throw new Error("Kit no encontrado");
  return kit;
}

// ----------------------------------------------------------
// Update — edits to name, status, picked indices, or array contents
// ----------------------------------------------------------

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  pickedCaption: z.number().int().min(0).nullable().optional(),
  pickedBio: z.number().int().min(0).nullable().optional(),
  captions: z.array(z.string().max(2000)).optional(),
  hashtags: z.array(z.string().max(60)).optional(),
  bios: z.array(z.string().max(800)).optional(),
});

export async function updateMarketingKit(
  id: string,
  patch: z.infer<typeof UpdateSchema>
) {
  const user = await requireUser();
  const kit = await prisma.marketingKit.findFirst({
    where: { id, userId: user.id },
    select: { id: true, propertyId: true },
  });
  if (!kit) throw new Error("Kit no encontrado");

  const data = UpdateSchema.parse(patch);

  await prisma.marketingKit.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.pickedCaption !== undefined && {
        pickedCaption: data.pickedCaption,
      }),
      ...(data.pickedBio !== undefined && { pickedBio: data.pickedBio }),
      ...(data.captions !== undefined && {
        captions: JSON.stringify(data.captions),
      }),
      ...(data.hashtags !== undefined && {
        hashtags: JSON.stringify(data.hashtags),
      }),
      ...(data.bios !== undefined && { bios: JSON.stringify(data.bios) }),
    },
  });

  revalidatePath(`/propiedades/${kit.propertyId}`);
  return { ok: true };
}

// ----------------------------------------------------------
// Regenerate — re-runs AI with new params, replaces outputs
// ----------------------------------------------------------

export async function regenerateMarketingKit(
  id: string,
  params: z.infer<typeof ParamsSchema>
) {
  const user = await requireUser();
  const kit = await prisma.marketingKit.findFirst({
    where: { id, userId: user.id },
  });
  if (!kit) throw new Error("Kit no encontrado");

  const merged = paramsFromInput(params);

  const generated = await generateMarketingKit(kit.propertyId, merged);

  await prisma.marketingKit.update({
    where: { id },
    data: {
      audience: merged.audience ?? null,
      tone: merged.tone ?? null,
      goal: merged.goal ?? null,
      angle: merged.angle ?? null,
      language: merged.language ?? "es",
      captions: JSON.stringify(generated.captions),
      hashtags: JSON.stringify(generated.hashtags),
      bios: JSON.stringify(generated.bios),
      // Reset picks since content changed
      pickedCaption: null,
      pickedBio: null,
    },
  });

  revalidatePath(`/propiedades/${kit.propertyId}`);
  return { ok: true };
}

export async function deleteMarketingKit(id: string) {
  const user = await requireUser();
  const kit = await prisma.marketingKit.findFirst({
    where: { id, userId: user.id },
    select: { id: true, propertyId: true },
  });
  if (!kit) throw new Error("Kit no encontrado");
  await prisma.marketingKit.delete({ where: { id } });
  revalidatePath(`/propiedades/${kit.propertyId}`);
  return { ok: true };
}
