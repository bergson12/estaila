"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { PropertySchema, type PropertyInput } from "@/lib/validations";
import { assertWithinPlanLimit } from "@/lib/plan-limits";

function cleanOptionals<T extends Record<string, unknown>>(data: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export async function createProperty(
  input: PropertyInput
) {
  const user = await requireUser();
  await assertWithinPlanLimit(user.id, "property");
  const data = PropertySchema.parse(input);
  const cleaned = cleanOptionals(data);

  const prop = await prisma.property.create({
    data: {
      ...cleaned,
      userId: user.id,
    } as never,
  });

  revalidatePath("/propiedades");
  revalidatePath("/");
  return { id: prop.id };
}

export async function updateProperty(
  id: string,
  input: PropertyInput
) {
  const user = await requireUser();
  const existing = await prisma.property.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error("Propiedad no encontrada");

  const data = PropertySchema.parse(input);
  const cleaned = cleanOptionals(data);

  await prisma.property.update({
    where: { id },
    data: cleaned as never,
  });

  revalidatePath("/propiedades");
  revalidatePath(`/propiedades/${id}`);
  return { id };
}

export async function deleteProperty(id: string) {
  const user = await requireUser();
  const existing = await prisma.property.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error("Propiedad no encontrada");

  await prisma.property.delete({ where: { id } });
  revalidatePath("/propiedades");
  redirect("/propiedades");
}

export async function addPhotoToProperty(
  propertyId: string,
  url: string,
  setAsFeatured?: boolean
) {
  const user = await requireUser();
  const existing = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
  });
  if (!existing) throw new Error("Propiedad no encontrada");

  const last = await prisma.photo.findFirst({
    where: { propertyId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? -1) + 1;

  const photo = await prisma.photo.create({
    data: {
      userId: user.id,
      propertyId,
      url,
      order,
    },
  });

  if (setAsFeatured || !existing.featuredPhoto) {
    await prisma.property.update({
      where: { id: propertyId },
      data: { featuredPhoto: url },
    });
  }

  revalidatePath(`/propiedades/${propertyId}`);
  revalidatePath("/propiedades");
  return photo;
}

export async function removePhoto(photoId: string) {
  const user = await requireUser();
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, userId: user.id },
    include: { property: true },
  });
  if (!photo) throw new Error("Foto no encontrada");

  await prisma.photo.delete({ where: { id: photoId } });

  // If this was the featured photo on the property, pick another
  if (photo.property && photo.property.featuredPhoto === photo.url) {
    const next = await prisma.photo.findFirst({
      where: { propertyId: photo.propertyId! },
      orderBy: { order: "asc" },
    });
    await prisma.property.update({
      where: { id: photo.propertyId! },
      data: { featuredPhoto: next?.url ?? null },
    });
  }

  revalidatePath(`/propiedades/${photo.propertyId}`);
  revalidatePath("/propiedades");
  return { ok: true };
}

export async function setFeaturedPhoto(propertyId: string, url: string) {
  const user = await requireUser();
  await prisma.property.updateMany({
    where: { id: propertyId, userId: user.id },
    data: { featuredPhoto: url },
  });
  revalidatePath(`/propiedades/${propertyId}`);
  revalidatePath("/propiedades");
  return { ok: true };
}
