"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma, ensureLightweightMigrations } from "@/lib/db";
import { isDeepSeekConfigured } from "@/lib/ai/deepseek";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateProposalContent,
  type ProposalContent,
  type ProposalType,
  type ProposalTone,
} from "@/lib/ai/proposal-ai";

type GenerateInput = {
  propertyId: string;
  contactId?: string | null;
  recipientName?: string;
  type: ProposalType;
  tone: ProposalTone;
};

export async function generateProposal(
  input: GenerateInput
): Promise<
  | { ok: true; content: ProposalContent; recipientName: string }
  | { ok: false; error: string }
> {
  const user = await requireUser();
  await ensureLightweightMigrations();

  if (!isDeepSeekConfigured()) {
    return {
      ok: false,
      error: "El generador de IA no está configurado (DEEPSEEK_API_KEY).",
    };
  }

  // Rate-limit: evita abuso de costo (DeepSeek) — 15 generaciones por minuto.
  if (!(await checkRateLimit(`proposal:${user.id}`, 15, 60))) {
    return {
      ok: false,
      error: "Demasiadas generaciones seguidas. Espera un momento e intenta de nuevo.",
    };
  }

  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, userId: user.id },
    select: {
      title: true,
      location: true,
      priceUSD: true,
      bedrooms: true,
      bathrooms: true,
      metersSquared: true,
      operation: true,
      description: true,
    },
  });
  if (!property) return { ok: false, error: "Propiedad no encontrada." };

  let recipientName = input.recipientName?.trim() || "Estimado cliente";
  let clientNotes: string | null = null;
  let clientType: string | null = null;
  if (input.contactId) {
    const c = await prisma.contact.findFirst({
      where: { id: input.contactId, userId: user.id },
      select: { name: true, notes: true, type: true },
    });
    if (c) {
      recipientName = c.name;
      clientNotes = c.notes;
      clientType = c.type;
    }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, agentBio: true },
  });

  try {
    const content = await generateProposalContent({
      propertyTitle: property.title,
      propertyLocation: property.location,
      priceUSD: property.priceUSD ? Number(property.priceUSD) : null,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
      metersSquared: property.metersSquared,
      operation: property.operation,
      description: property.description,
      recipientName,
      clientNotes,
      clientType,
      type: input.type,
      tone: input.tone,
      agentName: dbUser?.name ?? user.name,
      agentBio: dbUser?.agentBio ?? null,
    });
    return { ok: true, content, recipientName };
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message || "Error generando la propuesta.",
    };
  }
}

/**
 * Registra la propuesta en el historial de Documentos (reusa PdfGeneration con
 * template "PROPOSAL"). Se llama al exportar/guardar, no en cada generación.
 */
export async function recordProposal(input: {
  propertyId: string;
  contactId?: string | null;
  recipientName: string;
  titulo: string;
}): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const owns = await prisma.property.findFirst({
    where: { id: input.propertyId, userId: user.id },
    select: { id: true },
  });
  if (!owns) return { ok: false };

  await prisma.pdfGeneration.create({
    data: {
      propertyId: input.propertyId,
      userId: user.id,
      contactId: input.contactId || null,
      recipientName: input.recipientName || null,
      template: "PROPOSAL",
      personalMessage: input.titulo.slice(0, 280),
    },
  });
  revalidatePath("/documentos");
  return { ok: true };
}
