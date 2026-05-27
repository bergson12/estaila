"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  agentRole: z.string().trim().max(120).optional().or(z.literal("")),
  agentLocation: z.string().trim().max(120).optional().or(z.literal("")),
  agentPhone: z.string().trim().max(40).optional().or(z.literal("")),
  agentBio: z.string().trim().max(600).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

/**
 * Auto-add agentBio column if missing (Turso fresh deploy without migration).
 */
let bioColumnReady = false;
async function ensureBioColumn() {
  if (bioColumnReady) return;
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "user" ADD COLUMN "agentBio" TEXT`
    );
  } catch {
    // Column already exists or different error — Prisma will surface the real one
  }
  bioColumnReady = true;
}

export async function updateProfile(input: ProfileInput) {
  const user = await requireUser();
  const data = ProfileSchema.parse(input);
  await ensureBioColumn();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      agentRole: data.agentRole || null,
      agentLocation: data.agentLocation || null,
      agentPhone: data.agentPhone || null,
      agentBio: data.agentBio || null,
      image: data.image || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
