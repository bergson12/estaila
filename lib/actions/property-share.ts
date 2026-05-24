"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { propertySlug, uniqueSlug } from "@/lib/slug";
import { SHARE_CHANNELS, type ShareChannel } from "@/lib/share-channels";

// ============================================================
// Ensure a property has a slug — generates one on demand
// ============================================================

export async function ensurePropertySlug(propertyId: string): Promise<string> {
  const user = await requireUser();
  const prop = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
    select: { id: true, slug: true, title: true, location: true },
  });
  if (!prop) throw new Error("Propiedad no encontrada");
  if (prop.slug) return prop.slug;

  const base = propertySlug(prop.title, prop.location);
  const finalSlug = await uniqueSlug(base, async (s) => {
    const exists = await prisma.property.findFirst({
      where: { slug: s },
      select: { id: true },
    });
    return !!exists;
  });

  await prisma.property.update({
    where: { id: propertyId },
    data: { slug: finalSlug },
  });

  revalidatePath(`/propiedades/${propertyId}`);
  return finalSlug;
}

// ============================================================
// Create a share record + tracking link
// ============================================================

const CreateShareSchema = z.object({
  propertyId: z.string().min(1),
  channel: z.enum(SHARE_CHANNELS),
  contactId: z.string().optional(),
  message: z.string().max(1000).optional(),
});

export async function createPropertyShare(
  input: z.infer<typeof CreateShareSchema>
) {
  const user = await requireUser();
  const data = CreateShareSchema.parse(input);

  // Verify ownership
  const prop = await prisma.property.findFirst({
    where: { id: data.propertyId, userId: user.id },
    select: { id: true },
  });
  if (!prop) throw new Error("Propiedad no encontrada");

  // Make sure property has a slug
  const slug = await ensurePropertySlug(data.propertyId);

  const share = await prisma.propertyShare.create({
    data: {
      propertyId: data.propertyId,
      userId: user.id,
      channel: data.channel,
      contactId: data.contactId || null,
      message: data.message ?? null,
    },
  });

  // Increment shareCount
  await prisma.property.update({
    where: { id: data.propertyId },
    data: { shareCount: { increment: 1 } },
  });

  return {
    id: share.id,
    trackingId: share.trackingId,
    slug,
    // Caller can build the full URL with origin
    pathWithRef: `/propiedad/${slug}?ref=${share.trackingId}`,
  };
}

// ============================================================
// Public click tracking (called by /r/[trackingId] redirect route)
// ============================================================

export async function trackShareClick(trackingId: string) {
  const share = await prisma.propertyShare.findUnique({
    where: { trackingId },
    select: { id: true, propertyId: true },
  });
  if (!share) return null;

  await prisma.propertyShare.update({
    where: { id: share.id },
    data: {
      clicks: { increment: 1 },
      lastClickAt: new Date(),
    },
  });

  // Resolve property slug for the redirect target
  const prop = await prisma.property.findUnique({
    where: { id: share.propertyId },
    select: { slug: true },
  });
  return prop?.slug ?? null;
}
