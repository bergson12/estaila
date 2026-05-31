/**
 * PASO 2 (CI) del seed demo Trihausgroup.
 *
 * Lee `scripts/demo-trihaus-manifest.json` (fotos ya subidas a Blob por
 * `upload-trihaus-blob.ts`) y crea las propiedades demo en Turso para la
 * cuenta agente (default demo@estaila.com). No toca el filesystem de fotos,
 * así que corre perfecto en GitHub Actions donde /archivos/ no existe.
 *
 * REQUISITO: DATABASE_URL (libsql://) + TURSO_AUTH_TOKEN en el entorno.
 * USO: npx tsx scripts/seed-trihaus-from-manifest.ts [email]
 *
 * Idempotente: borra las propiedades demo previas (slugs del manifiesto)
 * para ESE agente antes de recrear.
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma, ensureLightweightMigrations } from "../lib/db";

const MANIFEST = path.join(process.cwd(), "scripts", "demo-trihaus-manifest.json");
const DEMO_EMAIL =
  process.argv[2] || process.env.DEMO_SEED_EMAIL || "demo@estaila.com";

type ManifestEntry = {
  title: string;
  location: string;
  priceUSD: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
  status: string;
  description: string;
  slug: string;
  photoUrls: string[];
};

async function main() {
  await ensureLightweightMigrations();

  let manifest: ManifestEntry[] = [];
  try {
    manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    console.log("Sin manifiesto Trihaus (scripts/demo-trihaus-manifest.json) — nada que sembrar.");
    return;
  }
  if (!Array.isArray(manifest) || manifest.length === 0) {
    console.log("Manifiesto Trihaus vacío — nada que sembrar.");
    return;
  }

  const agent = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (!agent) {
    console.error(
      `No existe el usuario ${DEMO_EMAIL}. Corre primero el seed base (prisma/seed.ts).`
    );
    process.exit(1);
  }

  const slugs = manifest.map((m) => m.slug);
  const removed = await prisma.property.deleteMany({
    where: { userId: agent.id, slug: { in: slugs } },
  });
  console.log(`Limpieza: ${removed.count} propiedades demo Trihaus previas eliminadas.`);

  let created = 0;
  for (const p of manifest) {
    if (!p.photoUrls?.length) {
      console.warn(`! ${p.title}: sin fotos en manifiesto — omitido.`);
      continue;
    }
    const prop = await prisma.property.create({
      data: {
        userId: agent.id,
        title: p.title,
        description: p.description,
        category: "APARTAMENTO",
        operation: "EN_VENTA",
        status: p.status,
        priceUSD: p.priceUSD ?? undefined,
        bedrooms: p.bedrooms ?? undefined,
        bathrooms: p.bathrooms ?? undefined,
        metersSquared: p.metersSquared ?? undefined,
        location: p.location,
        slug: p.slug,
        featuredPhoto: p.photoUrls[0],
        publicEnabled: true,
      },
      select: { id: true },
    });

    if (p.photoUrls.length > 1) {
      await prisma.photo.createMany({
        data: p.photoUrls.slice(1).map((url, i) => ({
          propertyId: prop.id,
          userId: agent.id,
          url,
          type: "ORIGINAL",
          order: i + 1,
        })),
      });
    }
    created++;
    console.log(`✓ ${p.title} — ${p.photoUrls.length} fotos`);
  }

  console.log(`\nListo: ${created} propiedades demo Trihaus creadas para ${DEMO_EMAIL}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
