/**
 * Seed de datos demo — proyectos reales de Trihausgroup con fotos.
 * Crea propiedades para la cuenta demo/tester y sube las fotos "Para web"
 * a Vercel Blob.
 *
 * REQUISITOS DE ENTORNO (en .env / shell antes de correr):
 *   - DATABASE_URL (libsql:// de Turso) + TURSO_AUTH_TOKEN
 *   - BLOB_READ_WRITE_TOKEN (Vercel Blob)
 *
 * USO:
 *   npx tsx scripts/seed-demo-trihaus.ts [email]
 *   (email = agente dueño; default demo@estaila.com)
 *
 * Idempotente: borra las propiedades demo previas (slugs demo-*) antes de recrear.
 * NOTA: los precios faltantes en el docx quedan como null ("a consultar"); ajusta
 * a mano si tienes el dato real.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { prisma } from "../lib/db";

const ROOT = path.join(process.cwd(), "archivos", "Demo", "Trihausgroup");
const DEMO_EMAIL = process.argv[2] || process.env.DEMO_SEED_EMAIL || "demo@estaila.com";
const MAX_PHOTOS = 10;

type Project = {
  folder: string; // nombre de carpeta en archivos/Demo/Trihausgroup/
  title: string;
  location: string;
  priceUSD: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
  status: string; // NUEVO | EN_PLANO | EN_CONSTRUCCION
  description: string;
};

// Dataset curado a partir de "Detalles de propiedades.docx".
const PROJECTS: Project[] = [
  {
    folder: "CORAL BAY",
    title: "Coral Bay Residences",
    location: "Cana Bay, Punta Cana",
    priceUSD: 290000,
    bedrooms: 2,
    bathrooms: 2,
    metersSquared: 115,
    status: "EN_CONSTRUCCION",
    description:
      "Apartamentos de lujo en Cana Bay, Punta Cana, en un entorno tropical de ensueño. Arquitectura moderna y elegante con acabados de alta calidad. Amenidades: Club de Playa, restaurante, tenis y pádel, piscina, Hard Rock Golf Club. Solo 1 unidad disponible (1er nivel, 115 m²).",
  },
  {
    folder: "FULHAM GARDEN II",
    title: "Residencial Fulham Gardens II",
    location: "Monte Verde, Los Álamos, Santiago",
    priceUSD: 63000,
    bedrooms: 2,
    bathrooms: 2,
    metersSquared: 90,
    status: "EN_PLANO",
    description:
      "Proyecto residencial de 2 edificios de 4 niveles, 4 apartamentos por nivel, de 1 y 2 habitaciones. Zona exclusiva de Santiago (frente al hospital HOMS). Cocinas modulares con tope de granito, porcelanato importado, gas centralizado, lobby con control de acceso. Precio desde US$63,000. Inicial 30%, separación US$2,000, cuotas desde US$700.",
  },
  {
    folder: "AMANA RESIDENCES",
    title: "Amana Residences",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 2,
    bathrooms: 2,
    metersSquared: 95,
    status: "EN_PLANO",
    description:
      "Vanguardista diseño arquitectónico con fina terminación, espacios funcionales e integridad estructural. 28 apartamentos de 90 y 97 m²; primer nivel con patio exclusivo, cuarto nivel con área en azotea. Amenidades: piscina, gazebo, BBQ, garita de seguridad, cámaras, gas centralizado.",
  },
  {
    folder: "HAUS RESIDENCES",
    title: "Haus Residences",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 3,
    bathrooms: 3,
    metersSquared: 120,
    status: "EN_CONSTRUCCION",
    description:
      "Imponente torre de diseño vanguardista con rooftop espectacular: gimnasio equipado, jacuzzi y terraza con vistas panorámicas. Apartamentos de 3 habitaciones (principal con walking closet), 2 parqueos. Amenidades: lobby, ascensor, planta eléctrica, vigilancia 24h, cámaras.",
  },
  {
    folder: "GREEN VALLEY",
    title: "Green Valley Residences",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 3,
    bathrooms: 2,
    metersSquared: 130,
    status: "EN_PLANO",
    description:
      "Propuesta vanguardista que integra flora y urbanismo. 3 habitaciones, estudio y terraza. Amenidades: piscina, gimnasio, gazebo, área de juegos infantiles, ascensor, planta eléctrica, vigilancia 24h, amplio jardín.",
  },
  {
    folder: "ALINA TOWERS",
    title: "Alina Towers",
    location: "Villa María, Santiago",
    priceUSD: null,
    bedrooms: 3,
    bathrooms: 3,
    metersSquared: 141,
    status: "EN_CONSTRUCCION",
    description:
      "Lujosas torres en Villa María, Santiago, a 2 min del HOMS, Los Álamos y centros comerciales. Apartamentos de 141 m² y 200 m²: dormitorio principal con baño y vestidor, 2 dormitorios con baño común, cuarto de servicio. Primer nivel con derecho a patio.",
  },
  {
    folder: "ELEGANT TOWER",
    title: "Elegant Tower",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 2,
    bathrooms: 2,
    metersSquared: 110,
    status: "EN_CONSTRUCCION",
    description:
      "Torre residencial de línea contemporánea en Santiago. Apartamentos con acabados de calidad, amplios espacios sociales y amenidades modernas. (Datos demo — ajustar specs/precio reales.)",
  },
  {
    folder: "GARDENO RESIDENCES",
    title: "Gardeno Residences",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 2,
    bathrooms: 2,
    metersSquared: 100,
    status: "EN_PLANO",
    description:
      "Residencial moderno rodeado de áreas verdes en Santiago. Apartamentos funcionales con amenidades familiares. (Datos demo — ajustar specs/precio reales.)",
  },
  {
    folder: "LAURA MARI RESIDENCES",
    title: "Laura Mari Residences",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 2,
    bathrooms: 2,
    metersSquared: 95,
    status: "EN_PLANO",
    description:
      "Proyecto residencial de diseño elegante y acabados de calidad en Santiago. (Datos demo — ajustar specs/precio reales.)",
  },
  {
    folder: "RESIDENCIAL VISTA DON DIEGO",
    title: "Residencial Vista Don Diego",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 3,
    bathrooms: 2,
    metersSquared: 125,
    status: "EN_CONSTRUCCION",
    description:
      "Residencial con vistas privilegiadas y amenidades completas en Santiago. Apartamentos amplios ideales para familias. (Datos demo — ajustar specs/precio reales.)",
  },
  {
    folder: "ZORAL RESIDENCES",
    title: "Zoral Residences",
    location: "Santiago de los Caballeros",
    priceUSD: null,
    bedrooms: 2,
    bathrooms: 2,
    metersSquared: 105,
    status: "EN_PLANO",
    description:
      "Proyecto contemporáneo con espacios bien distribuidos y amenidades modernas en Santiago. (Datos demo — ajustar specs/precio reales.)",
  },
  // RESIDENCIAL FLORIS: sin fotos "Para web" en los archivos → omitido.
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function contentType(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function imagesFor(folder: string): Promise<string[]> {
  const dir = path.join(ROOT, folder, "Para web");
  try {
    const files = (await readdir(dir))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
    return files.map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

async function uploadLocal(filePath: string, prefix: string): Promise<string> {
  const buf = await readFile(filePath);
  const name = path.basename(filePath).replace(/[^a-zA-Z0-9.\-]/g, "-");
  const ct = contentType(name);
  const res = await put(`${prefix}/${name}`, buf, {
    access: "public",
    contentType: ct,
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return res.url;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Falta BLOB_READ_WRITE_TOKEN — necesario para subir las fotos.");
    process.exit(1);
  }

  const agent = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true },
  });
  if (!agent) {
    console.error(
      `No existe el usuario ${DEMO_EMAIL}. Corre primero el seed base (npm run db:seed).`
    );
    process.exit(1);
  }

  const slugs = PROJECTS.map((p) => `demo-${slugify(p.title)}`);
  const removed = await prisma.property.deleteMany({
    where: { userId: agent.id, slug: { in: slugs } },
  });
  console.log(`Limpieza: ${removed.count} propiedades demo previas eliminadas.`);

  let created = 0;
  for (const p of PROJECTS) {
    const imgs = await imagesFor(p.folder);
    if (imgs.length === 0) {
      console.warn(`! ${p.title}: sin fotos en "${p.folder}/Para web" — omitido.`);
      continue;
    }

    const uploaded: string[] = [];
    for (const img of imgs.slice(0, MAX_PHOTOS)) {
      try {
        uploaded.push(await uploadLocal(img, `demo/${slugify(p.title)}`));
      } catch (e) {
        console.warn(`  foto falló (${path.basename(img)}): ${(e as Error).message}`);
      }
    }
    if (uploaded.length === 0) {
      console.warn(`! ${p.title}: ninguna foto subió — omitido.`);
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
        slug: `demo-${slugify(p.title)}`,
        featuredPhoto: uploaded[0],
        publicEnabled: true,
      },
      select: { id: true },
    });

    if (uploaded.length > 1) {
      await prisma.photo.createMany({
        data: uploaded.slice(1).map((url, i) => ({
          propertyId: prop.id,
          userId: agent.id,
          url,
          type: "ORIGINAL",
          order: i + 1,
        })),
      });
    }

    created++;
    console.log(`✓ ${p.title} — ${uploaded.length} fotos`);
  }

  console.log(`\nListo: ${created} propiedades demo creadas para ${DEMO_EMAIL}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
