"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export type MarketingPostInput = {
  title: string;
  content: string;
  channel?: string;
  status?: string;
  scheduledFor?: Date;
  imageUrl?: string;
};

export async function createMarketingPost(input: MarketingPostInput) {
  const user = await requireUser();
  const p = await prisma.marketingPost.create({
    data: {
      userId: user.id,
      title: input.title,
      content: input.content,
      channel: input.channel ?? "INSTAGRAM",
      status: input.status ?? "DRAFT",
      scheduledFor: input.scheduledFor ?? null,
      imageUrl: input.imageUrl || null,
    },
  });
  revalidatePath("/marketing");
  return { id: p.id };
}

export async function updateMarketingStatus(id: string, status: string) {
  const user = await requireUser();
  await prisma.marketingPost.updateMany({
    where: { id, userId: user.id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
  revalidatePath("/marketing");
  return { ok: true };
}

export async function deleteMarketingPost(id: string) {
  const user = await requireUser();
  await prisma.marketingPost.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/marketing");
  return { ok: true };
}

// Generate post content from a property (template-based, no AI)
export async function generatePostFromProperty(propertyId: string) {
  const user = await requireUser();
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: user.id },
  });
  if (!property) throw new Error("Propiedad no encontrada");

  const price = property.priceUSD
    ? new Intl.NumberFormat("es", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(property.priceUSD))
    : "Precio a consultar";

  const specs = [
    property.bedrooms ? `${property.bedrooms} hab` : null,
    property.bathrooms ? `${property.bathrooms} baños` : null,
    property.parking ? `${property.parking} parqueos` : null,
    property.metersSquared ? `${property.metersSquared}m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const operationLabel =
    property.operation === "EN_VENTA" ? "EN VENTA" : "EN ALQUILER";

  const content = `✨ ${operationLabel}: ${property.title}

${property.description ?? ""}

${specs ? `📐 ${specs}\n` : ""}${property.location ? `📍 ${property.location}\n` : ""}💰 ${price}

DM para más info 📩
#RealEstate #BienesRaíces #${property.category.replace("_", "")}`;

  return {
    title: property.title,
    content,
    imageUrl: property.featuredPhoto ?? undefined,
  };
}
