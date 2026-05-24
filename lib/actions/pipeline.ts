"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export type PipelineCardInput = {
  contactId: string;
  propertyId?: string;
  stage?: string;
  value?: number;
  notes?: string;
  nextAction?: string;
  nextActionDate?: Date;
};

export async function createPipelineCard(input: PipelineCardInput) {
  const user = await requireUser();

  const last = await prisma.pipelineCard.findFirst({
    where: { userId: user.id, stage: input.stage ?? "NUEVO" },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const card = await prisma.pipelineCard.create({
    data: {
      userId: user.id,
      contactId: input.contactId,
      propertyId: input.propertyId || null,
      stage: input.stage ?? "NUEVO",
      value: input.value ?? null,
      notes: input.notes || null,
      nextAction: input.nextAction || null,
      nextActionDate: input.nextActionDate ?? null,
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidatePath("/pipeline");
  return { id: card.id };
}

export async function updateCardStage(id: string, newStage: string) {
  const user = await requireUser();
  const existing = await prisma.pipelineCard.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error("Lead no encontrado");

  const last = await prisma.pipelineCard.findFirst({
    where: { userId: user.id, stage: newStage },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.pipelineCard.update({
    where: { id },
    data: { stage: newStage, order: (last?.order ?? -1) + 1 },
  });
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updatePipelineCard(
  id: string,
  data: Partial<PipelineCardInput>
) {
  const user = await requireUser();
  await prisma.pipelineCard.updateMany({
    where: { id, userId: user.id },
    data: {
      contactId: data.contactId,
      propertyId: data.propertyId || null,
      value: data.value ?? null,
      notes: data.notes ?? null,
      nextAction: data.nextAction ?? null,
      nextActionDate: data.nextActionDate ?? null,
    },
  });
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function deletePipelineCard(id: string) {
  const user = await requireUser();
  await prisma.pipelineCard.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/pipeline");
  return { ok: true };
}
