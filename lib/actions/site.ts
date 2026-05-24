"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export type SiteInput = {
  slug: string;
  template: string;
  title?: string;
  tagline?: string;
  about?: string;
  primaryColor?: string;
  logoUrl?: string;
  coverUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  published?: boolean;
  // Customization
  fontPair?: string;
  language?: string;
  enabledSections?: string[]; // array of section keys
};

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set([
  "api",
  "login",
  "signup",
  "studio",
  "propiedades",
  "contactos",
  "pipeline",
  "agenda",
  "finanzas",
  "marketing",
  "pricing",
  "sitio",
  "settings",
  "uploads",
  "_next",
  "p",
]);

export async function getMySite() {
  const user = await requireUser();
  return prisma.site.findUnique({ where: { userId: user.id } });
}

export async function saveSite(input: SiteInput) {
  const user = await requireUser();

  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_REGEX.test(slug)) {
    throw new Error(
      "URL inválida: usa solo letras, números y guiones (3-40 caracteres, sin espacios)"
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`"${slug}" es una URL reservada — elige otra`);
  }

  // Verify slug is unique to others
  const otherWithSlug = await prisma.site.findUnique({ where: { slug } });
  if (otherWithSlug && otherWithSlug.userId !== user.id) {
    throw new Error(
      `La URL "/${slug}" ya está tomada — elige otra`
    );
  }

  const existing = await prisma.site.findUnique({
    where: { userId: user.id },
  });

  const data = {
    slug,
    template: input.template,
    title: input.title?.trim() || null,
    tagline: input.tagline?.trim() || null,
    about: input.about?.trim() || null,
    primaryColor: input.primaryColor?.trim() || null,
    logoUrl: input.logoUrl?.trim() || null,
    coverUrl: input.coverUrl?.trim() || null,
    phone: input.phone?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
    email: input.email?.trim() || null,
    facebookUrl: input.facebookUrl?.trim() || null,
    instagramUrl: input.instagramUrl?.trim() || null,
    tiktokUrl: input.tiktokUrl?.trim() || null,
    published: input.published ?? existing?.published ?? false,
    fontPair: input.fontPair ?? "ELEGANT",
    language: input.language ?? "es",
    enabledSections: input.enabledSections
      ? JSON.stringify(input.enabledSections)
      : existing?.enabledSections ?? undefined,
  };

  if (existing) {
    await prisma.site.update({
      where: { userId: user.id },
      data,
    });
  } else {
    await prisma.site.create({
      data: { ...data, userId: user.id },
    });
  }

  revalidatePath("/sitio");
  revalidatePath(`/p/${slug}`);
  return { ok: true, slug };
}

export async function togglePublished() {
  const user = await requireUser();
  const site = await prisma.site.findUnique({
    where: { userId: user.id },
    select: { published: true },
  });
  if (!site) throw new Error("Crea tu sitio primero");

  await prisma.site.update({
    where: { userId: user.id },
    data: { published: !site.published },
  });
  revalidatePath("/sitio");
  return { published: !site.published };
}

export async function suggestSlug(name: string): Promise<string> {
  // Convert name to slug-safe
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  if (!base) return "agente";

  // Check uniqueness with simple increment fallback
  let candidate = base;
  let suffix = 1;
  while (suffix < 100) {
    const existing = await prisma.site.findUnique({
      where: { slug: candidate },
    });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
