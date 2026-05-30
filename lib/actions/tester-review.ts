"use server";

/**
 * Reseñas de tester — feedback estructurado de cuentas con rol tester.
 *
 * Una reseña tiene: opinión positiva / negativa / puntos de mejora, una
 * calificación global, calificaciones 1-5 por módulo y capturas anotadas
 * (PNG aplanado con marcas + texto). Las tablas se auto-crean en Turso/dev
 * vía SQL crudo (mismo patrón que chat y EmailCampaign) para no depender de
 * un paso de migración frágil con el adapter libSQL.
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { MODULE_IDS, TESTER_CREDIT_CAP } from "@/lib/modules";

let schemaReady = false;
async function ensureTesterSchema() {
  if (schemaReady) return;
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TesterReview" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "positive" TEXT,
      "negative" TEXT,
      "improvements" TEXT,
      "overall" INTEGER,
      "status" TEXT NOT NULL DEFAULT 'NEW',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "TesterReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TesterModuleRating" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "reviewId" TEXT NOT NULL,
      "moduleId" TEXT NOT NULL,
      "rating" INTEGER NOT NULL,
      "note" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TesterModuleRating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "TesterReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TesterReviewImage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "reviewId" TEXT NOT NULL,
      "moduleId" TEXT,
      "imageUrl" TEXT NOT NULL,
      "caption" TEXT,
      "annotations" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TesterReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "TesterReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "TesterModuleRating_reviewId_moduleId_key" ON "TesterModuleRating"("reviewId","moduleId")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TesterReview_userId_createdAt_idx" ON "TesterReview"("userId","createdAt")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TesterReview_status_idx" ON "TesterReview"("status")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "TesterReviewImage_reviewId_idx" ON "TesterReviewImage"("reviewId")`
    );
    schemaReady = true;
  } catch (e) {
    console.warn("[ensureTesterSchema] failed, will retry:", (e as Error).message);
  }
}

/** Gate: solo cuentas tester (o admin, para poder probar) envían/leen sus reseñas. */
async function requireTester() {
  const user = await requireUser();
  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isTester: true, role: true },
  });
  if (!db?.isTester && db?.role !== "ADMIN") {
    throw new Error("Solo las cuentas tester pueden enviar reseñas.");
  }
  return user;
}

export async function isTesterUser(): Promise<boolean> {
  const user = await requireUser();
  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isTester: true, role: true },
  });
  return !!db?.isTester || db?.role === "ADMIN";
}

// ============================================================
// SUBMIT
// ============================================================

const RatingInput = z.object({
  moduleId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  note: z.string().trim().max(500).optional().nullable(),
});

const ImageInput = z.object({
  imageUrl: z.string().url().max(2000),
  moduleId: z.string().optional().nullable(),
  caption: z.string().trim().max(500).optional().nullable(),
  annotations: z.string().max(200_000).optional().nullable(),
});

const ReviewInput = z.object({
  positive: z.string().trim().max(4000).optional().nullable(),
  negative: z.string().trim().max(4000).optional().nullable(),
  improvements: z.string().trim().max(4000).optional().nullable(),
  overall: z.number().int().min(1).max(5).optional().nullable(),
  ratings: z.array(RatingInput).max(30).default([]),
  images: z.array(ImageInput).max(20).default([]),
});

type SubmitReviewInput = z.infer<typeof ReviewInput>;

export async function submitTesterReview(input: SubmitReviewInput) {
  const user = await requireTester();
  await ensureTesterSchema();
  const data = ReviewInput.parse(input);

  const valid = new Set(MODULE_IDS);
  const ratings = data.ratings.filter((r) => valid.has(r.moduleId));

  if (
    !data.positive &&
    !data.negative &&
    !data.improvements &&
    ratings.length === 0 &&
    data.images.length === 0
  ) {
    throw new Error("La reseña está vacía. Agrega al menos una opinión o calificación.");
  }

  const review = await prisma.testerReview.create({
    data: {
      userId: user.id,
      positive: data.positive || null,
      negative: data.negative || null,
      improvements: data.improvements || null,
      overall: data.overall ?? null,
      ratings: {
        create: ratings.map((r) => ({
          moduleId: r.moduleId,
          rating: r.rating,
          note: r.note || null,
        })),
      },
      images: {
        create: data.images.map((im) => ({
          moduleId: im.moduleId && valid.has(im.moduleId) ? im.moduleId : null,
          imageUrl: im.imageUrl,
          caption: im.caption || null,
          annotations: im.annotations || null,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/resenas");
  revalidatePath("/admin/reviews");
  return { ok: true as const, id: review.id };
}

// ============================================================
// READ (tester — sus propias reseñas)
// ============================================================

export async function getMyTesterReviews() {
  const user = await requireTester();
  await ensureTesterSchema();
  return prisma.testerReview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { ratings: true, images: true },
  });
}

// ============================================================
// ADMIN
// ============================================================

export async function listTesterReviews() {
  await requireAdmin();
  await ensureTesterSchema();
  return prisma.testerReview.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      ratings: true,
      images: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}

export async function setTesterReviewStatus(
  id: string,
  status: "NEW" | "SEEN" | "RESOLVED"
) {
  await requireAdmin();
  await ensureTesterSchema();
  await prisma.testerReview.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reviews");
  return { ok: true as const };
}

/** Convierte (o revierte) un usuario en tester: desbloquea módulos (AGENCY) + cap de créditos. */
export async function setUserTester(email: string, on: boolean) {
  await requireAdmin();
  const target = await prisma.user.findUnique({
    where: { email: email.trim() },
    select: { id: true, credits: true },
  });
  if (!target) throw new Error("No existe un usuario con ese email.");
  await prisma.user.update({
    where: { id: target.id },
    data: on
      ? {
          isTester: true,
          plan: "AGENCY",
          // Si tiene menos créditos que el cap, lo subimos al cap; si tiene más, lo dejamos.
          credits: target.credits < TESTER_CREDIT_CAP ? TESTER_CREDIT_CAP : target.credits,
        }
      : { isTester: false },
  });
  revalidatePath("/admin/reviews");
  return { ok: true as const };
}
