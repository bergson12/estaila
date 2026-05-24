"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;
const RESERVED = new Set([
  "admin", "api", "app", "auth", "billing", "c", "contact", "demo",
  "help", "login", "p", "pricing", "privacy", "settings", "signup",
  "studio", "support", "terms", "welcome",
]);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ============================================================
// DIGITAL CARDS (Linktree-style)
// ============================================================

export type DigitalCardInput = {
  slug?: string;
  title: string;
  role?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  theme?: string;
  primaryColor?: string;
  accentColor?: string | null;
  isActive?: boolean;
  showProperties?: boolean;
  showWhatsapp?: boolean;
};

export async function createDigitalCard(input: DigitalCardInput) {
  const user = await requireUser();

  const baseSlug = input.slug
    ? slugify(input.slug)
    : slugify(input.title) || `card-${Date.now().toString(36)}`;

  if (!SLUG_REGEX.test(baseSlug) || RESERVED.has(baseSlug)) {
    throw new Error("Slug inválido o reservado");
  }

  // Find unique slug
  let slug = baseSlug;
  let i = 1;
  while (await prisma.digitalCard.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++i}`;
  }

  const card = await prisma.digitalCard.create({
    data: {
      userId: user.id,
      slug,
      title: input.title.trim().slice(0, 80),
      role: input.role?.trim().slice(0, 120) || null,
      bio: input.bio?.trim().slice(0, 600) || null,
      avatarUrl: input.avatarUrl || null,
      coverUrl: input.coverUrl || null,
      theme: input.theme ?? "MINIMAL",
      primaryColor: input.primaryColor ?? "#3B82F6",
      accentColor: input.accentColor || null,
      isActive: input.isActive ?? true,
      showProperties: input.showProperties ?? true,
      showWhatsapp: input.showWhatsapp ?? true,
    },
  });

  revalidatePath("/marketing");
  return card;
}

export async function updateDigitalCard(
  id: string,
  patch: Partial<DigitalCardInput>
) {
  const user = await requireUser();
  const card = await prisma.digitalCard.findFirst({
    where: { id, userId: user.id },
  });
  if (!card) throw new Error("Tarjeta no encontrada");

  // Slug change
  let newSlug: string | undefined;
  if (patch.slug !== undefined && patch.slug !== card.slug) {
    const cleaned = slugify(patch.slug);
    if (!SLUG_REGEX.test(cleaned) || RESERVED.has(cleaned)) {
      throw new Error("Slug inválido o reservado");
    }
    const exists = await prisma.digitalCard.findUnique({ where: { slug: cleaned } });
    if (exists) throw new Error("Ese slug ya está en uso");
    newSlug = cleaned;
  }

  await prisma.digitalCard.update({
    where: { id },
    data: {
      ...(newSlug !== undefined && { slug: newSlug }),
      ...(patch.title !== undefined && { title: patch.title.trim().slice(0, 80) }),
      ...(patch.role !== undefined && { role: patch.role?.trim().slice(0, 120) || null }),
      ...(patch.bio !== undefined && { bio: patch.bio?.trim().slice(0, 600) || null }),
      ...(patch.avatarUrl !== undefined && { avatarUrl: patch.avatarUrl }),
      ...(patch.coverUrl !== undefined && { coverUrl: patch.coverUrl }),
      ...(patch.theme !== undefined && { theme: patch.theme }),
      ...(patch.primaryColor !== undefined && { primaryColor: patch.primaryColor }),
      ...(patch.accentColor !== undefined && { accentColor: patch.accentColor }),
      ...(patch.isActive !== undefined && { isActive: patch.isActive }),
      ...(patch.showProperties !== undefined && { showProperties: patch.showProperties }),
      ...(patch.showWhatsapp !== undefined && { showWhatsapp: patch.showWhatsapp }),
    },
  });

  revalidatePath("/marketing");
  revalidatePath(`/c/${card.slug}`);
  if (newSlug) revalidatePath(`/c/${newSlug}`);
}

export async function deleteDigitalCard(id: string) {
  const user = await requireUser();
  await prisma.digitalCard.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/marketing");
}

export async function listDigitalCards() {
  const user = await requireUser();
  return prisma.digitalCard.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      links: { orderBy: { order: "asc" } },
      _count: { select: { cardViews: true } },
    },
  });
}

// ============================================================
// CARD LINKS
// ============================================================

export type CardLinkInput = {
  cardId: string;
  label: string;
  url: string;
  icon?: string;
  imageUrl?: string | null;
  description?: string | null;
  color?: string | null;
  highlight?: boolean;
  active?: boolean;
};

export async function createCardLink(input: CardLinkInput) {
  const user = await requireUser();
  const card = await prisma.digitalCard.findFirst({
    where: { id: input.cardId, userId: user.id },
    select: { id: true, slug: true, _count: { select: { links: true } } },
  });
  if (!card) throw new Error("Tarjeta no encontrada");

  const link = await prisma.cardLink.create({
    data: {
      cardId: input.cardId,
      label: input.label.trim().slice(0, 60),
      url: input.url.trim(),
      icon: input.icon ?? "Link",
      imageUrl: input.imageUrl || null,
      description: input.description?.trim().slice(0, 120) || null,
      color: input.color || null,
      highlight: input.highlight ?? false,
      order: card._count.links,
      active: input.active ?? true,
    },
  });

  revalidatePath("/marketing");
  revalidatePath(`/c/${card.slug}`);
  return link;
}

export async function updateCardLink(
  id: string,
  patch: Partial<Omit<CardLinkInput, "cardId">> & { order?: number }
) {
  const user = await requireUser();
  const link = await prisma.cardLink.findFirst({
    where: { id, card: { userId: user.id } },
    include: { card: { select: { slug: true } } },
  });
  if (!link) throw new Error("Link no encontrado");
  await prisma.cardLink.update({
    where: { id },
    data: {
      ...(patch.label !== undefined && { label: patch.label.trim().slice(0, 60) }),
      ...(patch.url !== undefined && { url: patch.url.trim() }),
      ...(patch.icon !== undefined && { icon: patch.icon }),
      ...(patch.imageUrl !== undefined && { imageUrl: patch.imageUrl }),
      ...(patch.description !== undefined && {
        description: patch.description?.trim().slice(0, 120) || null,
      }),
      ...(patch.color !== undefined && { color: patch.color }),
      ...(patch.highlight !== undefined && { highlight: patch.highlight }),
      ...(patch.active !== undefined && { active: patch.active }),
      ...(patch.order !== undefined && { order: patch.order }),
    },
  });
  revalidatePath("/marketing");
  revalidatePath(`/c/${link.card.slug}`);
}

export async function deleteCardLink(id: string) {
  const user = await requireUser();
  const link = await prisma.cardLink.findFirst({
    where: { id, card: { userId: user.id } },
    include: { card: { select: { slug: true } } },
  });
  if (!link) return;
  await prisma.cardLink.delete({ where: { id } });
  revalidatePath("/marketing");
  revalidatePath(`/c/${link.card.slug}`);
}

export async function reorderCardLinks(cardId: string, orderedIds: string[]) {
  const user = await requireUser();
  const card = await prisma.digitalCard.findFirst({
    where: { id: cardId, userId: user.id },
    select: { id: true, slug: true },
  });
  if (!card) throw new Error("Tarjeta no encontrada");

  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.cardLink.updateMany({
        where: { id, cardId },
        data: { order: idx },
      })
    )
  );

  revalidatePath("/marketing");
  revalidatePath(`/c/${card.slug}`);
}

// ============================================================
// TRACKING (public — no auth required)
// ============================================================

export async function trackCardView(slug: string, referrer?: string) {
  const card = await prisma.digitalCard.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });
  if (!card || !card.isActive) return;
  await prisma.$transaction([
    prisma.cardView.create({
      data: {
        cardId: card.id,
        referrer: referrer?.slice(0, 240) || null,
      },
    }),
    prisma.digitalCard.update({
      where: { id: card.id },
      data: { views: { increment: 1 } },
    }),
  ]);
}

export async function trackCardLinkClick(linkId: string) {
  await prisma.cardLink
    .update({ where: { id: linkId }, data: { clicks: { increment: 1 } } })
    .catch(() => null);
}
