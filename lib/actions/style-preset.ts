"use server";

/**
 * StylePreset — biblioteca de "fotos de muestra" (referencia de estilo) que el
 * admin sube desde /admin/muestras. El agente las elige al generar y se envían
 * como imagen de referencia a la IA (multi-imagen) para imitar el estilo.
 *
 * Tabla auto-create en Turso/dev vía SQL crudo (mismo patrón que tester/email).
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { describePoseTitle } from "@/lib/ai/gemini-vision";

let ready = false;
async function ensureSchema() {
  if (ready) return;
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "StylePreset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "label" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'AGENT_PHOTO',
      "imageUrl" TEXT NOT NULL,
      "prompt" TEXT,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "StylePreset_category_active_idx" ON "StylePreset"("category","active")`
    );
    ready = true;
  } catch (e) {
    console.warn("[ensureStylePresetSchema] failed:", (e as Error).message);
  }
}

export type StyleCategory = "AGENT_PHOTO" | "STAGING" | "GENERIC";

const CreateInput = z.object({
  label: z.string().trim().max(120).optional(),
  category: z.enum(["AGENT_PHOTO", "STAGING", "GENERIC"]).default("AGENT_PHOTO"),
  imageUrl: z.string().url().max(2000),
  prompt: z.string().trim().max(500).optional().nullable(),
});

export async function createStylePreset(input: z.infer<typeof CreateInput>) {
  await requireAdmin();
  await ensureSchema();
  const data = CreateInput.parse(input);
  // Título automático (Gemini flash-lite, el más barato) si no se especifica: "Personaje · Pose".
  let label = data.label?.trim();
  if (!label) {
    label = (await describePoseTitle(data.imageUrl)) || "Muestra de estilo";
  }
  await prisma.stylePreset.create({
    data: {
      label,
      category: data.category,
      imageUrl: data.imageUrl,
      prompt: data.prompt || null,
    },
  });
  revalidatePath("/admin/muestras");
  return { ok: true as const };
}

export async function deleteStylePreset(id: string) {
  await requireAdmin();
  await ensureSchema();
  await prisma.stylePreset.delete({ where: { id } });
  revalidatePath("/admin/muestras");
  return { ok: true as const };
}

export async function toggleStylePreset(id: string, active: boolean) {
  await requireAdmin();
  await ensureSchema();
  await prisma.stylePreset.update({ where: { id }, data: { active } });
  revalidatePath("/admin/muestras");
  return { ok: true as const };
}

/** Admin: todas las muestras. */
export async function listStylePresets() {
  await requireAdmin();
  await ensureSchema();
  return prisma.stylePreset.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

/** Tool (cualquier usuario logueado): muestras activas de una categoría. */
export async function listActivePresets(category: StyleCategory) {
  await requireUser();
  await ensureSchema();
  return prisma.stylePreset.findMany({
    where: { category, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, label: true, imageUrl: true },
  });
}
