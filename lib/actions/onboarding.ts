"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// ============================================================
// SCHEMAS
// ============================================================

const ProfileSchema = z.object({
  agentRole: z.string().trim().max(120).optional(),
  agentLocation: z.string().trim().max(120).optional(),
  agentPhone: z.string().trim().max(40).optional(),
  image: z.string().url().optional().or(z.literal("")),
});

const PropertySchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.enum([
    "CASA",
    "APARTAMENTO",
    "VILLA",
    "TERRENO",
    "LOCAL",
    "OFICINA",
    "EDIFICIO",
  ]),
  operation: z.enum(["EN_VENTA", "EN_ALQUILER", "EN_CONSIGNACION"]),
  location: z.string().trim().min(2).max(160),
  priceUSD: z.coerce.number().positive().max(99_999_999),
  bedrooms: z.coerce.number().int().min(0).max(99).optional(),
  bathrooms: z.coerce.number().int().min(0).max(99).optional(),
  metersSquared: z.coerce.number().positive().max(999_999).optional(),
});

// ============================================================
// ACTIONS
// ============================================================

/**
 * Step 1: save quick profile fields. Optional fields, all best-effort.
 * Updates User row with agent metadata.
 */
export async function saveOnboardingProfile(
  input: z.infer<typeof ProfileSchema>
) {
  const user = await requireUser();
  const data = ProfileSchema.parse(input);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      agentRole: data.agentRole || null,
      agentLocation: data.agentLocation || null,
      agentPhone: data.agentPhone || null,
      ...(data.image ? { image: data.image } : {}),
    },
  });

  return { ok: true };
}

/**
 * Step 2: create first property with minimum required fields.
 * Returns the new property id so the wizard can deep-link to it.
 */
export async function createOnboardingProperty(
  input: z.infer<typeof PropertySchema>
) {
  const user = await requireUser();
  const data = PropertySchema.parse(input);

  const prop = await prisma.property.create({
    data: {
      userId: user.id,
      title: data.title,
      category: data.category,
      operation: data.operation,
      location: data.location,
      priceUSD: data.priceUSD,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      metersSquared: data.metersSquared,
    } as never,
  });

  revalidatePath("/propiedades");
  revalidatePath("/");
  return { id: prop.id };
}

/**
 * Final step: mark onboarding as complete. Soft — user can keep using app
 * without finishing all steps if they bail out (we still set the timestamp
 * when they hit "Saltar y explorar" so the wizard doesn't keep prompting).
 */
export async function completeOnboarding(opts?: { skipped?: boolean }) {
  const user = await requireUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });

  revalidatePath("/");
  return { ok: true, skipped: !!opts?.skipped };
}

/**
 * Helper for the dashboard banner — server-only.
 */
export async function getOnboardingStatus() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { onboardedAt: true },
  });
  return {
    completed: !!dbUser?.onboardedAt,
  };
}
