"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getProcessor, TOOL_COST } from "@/lib/ai";
import { MockProcessor } from "@/lib/ai/mock-processor";
import { getAppSettings } from "@/lib/app-settings";
import type { AIToolName, ProcessOptions } from "@/lib/ai/types";

export type GenerateInput = {
  tool: AIToolName;
  inputUrl: string;
  photoId?: string;
  prompt?: string;
  options?: ProcessOptions;
};

export type GenerateResult =
  | {
      ok: true;
      id: string;
      outputUrl: string;
      cssFilter?: string;
      creditsUsed: number;
      remainingCredits: number;
      processingTimeMs: number;
      fallbackUsed?: "mock";
      fallbackReason?: string;
    }
  | {
      ok: false;
      error: string;
      code?:
        | "AUTH"
        | "SUSPENDED"
        | "DISABLED"
        | "INSUFFICIENT_CREDITS"
        | "QUOTA"
        | "UNKNOWN";
    };

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  try {
    return await generateInner(input);
  } catch (e) {
    const err = e as Error;
    const msg = err.message ?? String(err);
    console.error("[generate]", msg, err.stack);
    return { ok: false, error: msg, code: "UNKNOWN" };
  }
}

async function generateInner(input: GenerateInput): Promise<GenerateResult> {
  const user = await requireUser();

  // Global kill-switch from admin settings
  const settings = await getAppSettings();
  if (!settings.studioEnabled) {
    return {
      ok: false,
      error: "Studio IA está temporalmente desactivado por el administrador.",
      code: "DISABLED",
    };
  }

  // Suspended user check
  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { suspended: true },
  });
  if (userRow?.suspended) {
    return {
      ok: false,
      error: "Tu cuenta está suspendida. Contacta soporte.",
      code: "SUSPENDED",
    };
  }

  const cost = TOOL_COST[input.tool] ?? 1;

  // Refetch current credits (the session may be stale)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true },
  });
  if (!dbUser) {
    return { ok: false, error: "Usuario no encontrado", code: "AUTH" };
  }

  if (dbUser.credits < cost) {
    return {
      ok: false,
      error: `Créditos insuficientes. Necesitas ${cost} crédito${cost > 1 ? "s" : ""} pero solo tienes ${dbUser.credits}.`,
      code: "INSUFFICIENT_CREDITS",
    };
  }

  // Create generation record (PROCESSING) + deduct credits atomically
  const gen = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { credits: { decrement: cost } },
    });
    return tx.aIGeneration.create({
      data: {
        userId: user.id,
        photoId: input.photoId ?? null,
        tool: input.tool,
        inputUrl: input.inputUrl,
        prompt: input.prompt ?? null,
        style: input.options?.style ?? null,
        roomType: input.options?.roomType ?? null,
        options: input.options ? JSON.stringify(input.options) : null,
        status: "PROCESSING",
        creditsUsed: cost,
      },
    });
  });

  // Run processor with auto-fallback to mock on Gemini quota/billing errors
  let fallbackUsed: "mock" | undefined;
  let fallbackReason: string | undefined;
  try {
    const processor = getProcessor(user.id, settings.aiProvider);
    let result;
    try {
      result = await processor.process({
        tool: input.tool,
        inputUrl: input.inputUrl,
        options: input.options,
        prompt: input.prompt,
      });
    } catch (err) {
      const e = err as Error & { code?: string };
      // Auto-fallback to mock when Gemini quota is exhausted or auth fails
      if (
        e.code === "GEMINI_QUOTA" ||
        /quota|429|403|billing/i.test(e.message)
      ) {
        fallbackUsed = "mock";
        fallbackReason = e.message;
        result = await new MockProcessor(user.id).process({
          tool: input.tool,
          inputUrl: input.inputUrl,
          options: input.options,
          prompt: input.prompt,
        });
      } else {
        throw err;
      }
    }

    const updated = await prisma.aIGeneration.update({
      where: { id: gen.id },
      data: {
        status: "COMPLETED",
        outputUrl: result.outputUrl,
        completedAt: new Date(),
        options: JSON.stringify({
          ...(input.options ?? {}),
          _cssFilter: result.cssFilter,
          _fallback: fallbackUsed,
        }),
      },
    });

    revalidatePath("/studio");
    return {
      ok: true,
      id: updated.id,
      outputUrl: result.outputUrl,
      cssFilter: result.cssFilter,
      creditsUsed: cost,
      remainingCredits: dbUser.credits - cost,
      processingTimeMs: result.processingTimeMs,
      fallbackUsed,
      fallbackReason,
    };
  } catch (e) {
    const err = e as Error;
    const detail = err.message ?? String(err);
    console.error("[ai.generate] failed:", detail, err.stack);

    // Refund credits on failure
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: cost } },
      }),
      prisma.aIGeneration.update({
        where: { id: gen.id },
        data: {
          status: "FAILED",
          errorMsg: detail,
        },
      }),
    ]);

    const code = /quota|429|billing|prepayment|credits/i.test(detail)
      ? "QUOTA"
      : /401|403|api key|auth/i.test(detail)
        ? "AUTH"
        : "UNKNOWN";
    return { ok: false, error: detail, code };
  }
}

export async function getCredits(): Promise<{ credits: number; plan: string }> {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, plan: true },
  });
  return {
    credits: dbUser?.credits ?? 0,
    plan: dbUser?.plan ?? "FREE",
  };
}

export async function getRecentGenerations(limit = 8) {
  const user = await requireUser();
  return prisma.aIGeneration.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: {
      id: true,
      tool: true,
      inputUrl: true,
      outputUrl: true,
      style: true,
      completedAt: true,
    },
  });
}

/** Lightweight property list for the post-generation save dialog. */
export async function listMyPropertiesLite(): Promise<
  { id: string; title: string; location: string | null; coverUrl: string | null }[]
> {
  const user = await requireUser();
  const rows = await prisma.property.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      location: true,
      photos: {
        take: 1,
        orderBy: { order: "asc" },
        select: { url: true },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    location: r.location,
    coverUrl: r.photos[0]?.url ?? null,
  }));
}

/** Lightweight contact list for the send-via-WhatsApp dialog. */
export async function listMyContactsLite(): Promise<
  { id: string; name: string; phone: string | null; email: string | null }[]
> {
  const user = await requireUser();
  const rows = await prisma.contact.findMany({
    where: { userId: user.id, phone: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, name: true, phone: true, email: true },
  });
  return rows;
}

/** Log that we sent a generated photo to a contact (so it appears in timeline). */
export async function logPhotoSentToContact(args: {
  generationId: string;
  contactId: string;
  channel: "WHATSAPP" | "EMAIL";
  note?: string;
}): Promise<void> {
  const user = await requireUser();
  const gen = await prisma.aIGeneration.findFirst({
    where: { id: args.generationId, userId: user.id },
    select: { id: true, outputUrl: true, tool: true },
  });
  if (!gen?.outputUrl) throw new Error("Generación no encontrada");
  const contact = await prisma.contact.findFirst({
    where: { id: args.contactId, userId: user.id },
    select: { id: true, name: true },
  });
  if (!contact) throw new Error("Contacto no encontrado");

  await prisma.contactActivity.create({
    data: {
      userId: user.id,
      contactId: contact.id,
      type: args.channel === "EMAIL" ? "EMAIL" : "WHATSAPP_SENT",
      title: `Foto Studio IA (${gen.tool}) enviada`,
      content: args.note ?? null,
      metadata: JSON.stringify({
        generationId: gen.id,
        photoUrl: gen.outputUrl,
      }),
    },
  });
  revalidatePath(`/contactos/${contact.id}`);
}

export async function savePhotoToProperty(
  generationId: string,
  propertyId: string
) {
  const user = await requireUser();
  const gen = await prisma.aIGeneration.findFirst({
    where: { id: generationId, userId: user.id, status: "COMPLETED" },
  });
  if (!gen || !gen.outputUrl) throw new Error("Generación no encontrada");

  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
  });
  if (!property) throw new Error("Propiedad no encontrada");

  const last = await prisma.photo.findFirst({
    where: { propertyId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const photo = await prisma.photo.create({
    data: {
      userId: user.id,
      propertyId,
      url: gen.outputUrl,
      type:
        gen.tool === "STAGING"
          ? "STAGED"
          : gen.tool === "DECLUTTER"
            ? "DECLUTTERED"
            : "ENHANCED",
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/propiedades/${propertyId}`);
  return photo;
}
