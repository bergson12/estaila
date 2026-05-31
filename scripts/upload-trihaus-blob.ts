/**
 * PASO 1 (local) del seed demo Trihausgroup.
 *
 * Sube las fotos "Para web" de cada proyecto a Vercel Blob y escribe un
 * manifiesto (`scripts/demo-trihaus-manifest.json`) con metadata + URLs.
 * El manifiesto se commitea (URLs públicas, NO secretos) y luego CI
 * (`seed-trihaus-from-manifest.ts`) crea las propiedades en Turso usando
 * el TURSO_AUTH_TOKEN que vive en GitHub Secrets — el token nunca toca
 * esta máquina ni el chat.
 *
 * REQUISITO: BLOB_READ_WRITE_TOKEN en el entorno (lo tenemos local).
 * USO: npx tsx scripts/upload-trihaus-blob.ts
 *
 * Idempotente para el manifiesto (lo reescribe). Cada `put` usa
 * addRandomSuffix, así que re-correr crea blobs nuevos (no pisa los viejos).
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const ROOT = path.join(process.cwd(), "archivos", "Demo", "Trihausgroup");
const OUT = path.join(process.cwd(), "scripts", "demo-trihaus-manifest.json");
const MAX_PHOTOS = 8;

type Project = {
  folder: string;
  title: string;
  location: string;
  priceUSD: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
  status: string;
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
    const files = (await readdir(dir)).filter((f) =>
      /\.(jpe?g|png|webp)$/i.test(f)
    );
    // "Portada" (cover) primero, luego orden natural.
    files.sort((a, b) => {
      const pa = /portada/i.test(a) ? 0 : 1;
      const pb = /portada/i.test(b) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b, undefined, { numeric: true });
    });
    return files.map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

async function uploadLocal(filePath: string, prefix: string): Promise<string> {
  const buf = await readFile(filePath);
  const name = path.basename(filePath).replace(/[^a-zA-Z0-9.\-]/g, "-");
  const res = await put(`${prefix}/${name}`, buf, {
    access: "public",
    contentType: contentType(name),
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return res.url;
}

type ManifestEntry = Project & { slug: string; photoUrls: string[] };

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Falta BLOB_READ_WRITE_TOKEN.");
    process.exit(1);
  }

  const manifest: ManifestEntry[] = [];
  for (const p of PROJECTS) {
    const imgs = await imagesFor(p.folder);
    if (imgs.length === 0) {
      console.warn(`! ${p.title}: sin fotos en "${p.folder}/Para web" — omitido.`);
      continue;
    }
    const slug = `demo-${slugify(p.title)}`;
    const photoUrls: string[] = [];
    for (const img of imgs.slice(0, MAX_PHOTOS)) {
      try {
        photoUrls.push(await uploadLocal(img, `demo/${slugify(p.title)}`));
      } catch (e) {
        console.warn(`  foto falló (${path.basename(img)}): ${(e as Error).message}`);
      }
    }
    if (photoUrls.length === 0) {
      console.warn(`! ${p.title}: ninguna foto subió — omitido.`);
      continue;
    }
    manifest.push({ ...p, slug, photoUrls });
    console.log(`✓ ${p.title} — ${photoUrls.length} fotos subidas`);
  }

  await writeFile(OUT, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  const totalPhotos = manifest.reduce((s, m) => s + m.photoUrls.length, 0);
  console.log(
    `\nManifiesto escrito: ${path.relative(process.cwd(), OUT)} — ${manifest.length} proyectos, ${totalPhotos} fotos.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
