"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { applySmartFill, buildSpecs, type SmartFillData } from "@/lib/editor/smart-fill";
import {
  TEMPLATES,
  type RealEstateTemplate,
} from "@/lib/editor/templates/real-estate-templates";

// ============================================================
// Projects
// ============================================================

export async function listProjects(): Promise<
  Array<{
    id: string;
    name: string;
    thumbnail: string | null;
    updatedAt: Date;
    format: string;
    propertyTitle: string | null;
  }>
> {
  const user = await requireUser();
  const rows = await prisma.editorProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: {
      id: true,
      name: true,
      thumbnail: true,
      updatedAt: true,
      format: true,
      property: { select: { title: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    thumbnail: r.thumbnail,
    updatedAt: r.updatedAt,
    format: r.format,
    propertyTitle: r.property?.title ?? null,
  }));
}

export async function createProjectFromTemplate(args: {
  templateId: string;
  propertyId?: string;
}): Promise<{ id: string }> {
  const user = await requireUser();
  const tpl = TEMPLATES.find((t) => t.id === args.templateId);
  if (!tpl) throw new Error("Plantilla no encontrada");

  // Build smart-fill data from property if provided
  let smartData: SmartFillData = {
    agentName: user.name,
  };
  if (args.propertyId) {
    const prop = await prisma.property.findFirst({
      where: { id: args.propertyId, userId: user.id },
      select: {
        title: true,
        priceUSD: true,
        location: true,
        bedrooms: true,
        bathrooms: true,
        metersSquared: true,
      },
    });
    if (prop) {
      const photo = await prisma.photo.findFirst({
        where: { propertyId: args.propertyId },
        select: { url: true },
        orderBy: { order: "asc" },
      });
      const bathrooms = prop.bathrooms ? Number(prop.bathrooms) : null;
      smartData = {
        ...smartData,
        title: prop.title,
        price: prop.priceUSD ? Number(prop.priceUSD) : null,
        location: prop.location ?? "",
        bedrooms: prop.bedrooms,
        bathrooms,
        area: prop.metersSquared,
        specs: buildSpecs({
          bedrooms: prop.bedrooms,
          bathrooms,
          area: prop.metersSquared,
        }),
        propertyPhotoUrl: photo?.url,
      };
    }
  }

  // Build a minimal Polotno-compatible page with a title placeholder.
  // The user can then drag, edit and add elements using Polotno's UI.
  const polotnoJson = {
    width: tpl.width,
    height: tpl.height,
    fonts: [],
    pages: [
      {
        id: "page-1",
        background: tpl.background,
        width: tpl.width,
        height: tpl.height,
        children: [
          {
            type: "text",
            x: 60,
            y: tpl.height - 240,
            width: tpl.width - 120,
            text: "{{title}}",
            fontSize: 56,
            fontFamily: "Raleway",
            fill: "#0a0a0a",
            fontWeight: "bold",
            align: "left",
          },
          {
            type: "text",
            x: 60,
            y: tpl.height - 140,
            width: tpl.width - 120,
            text: "{{price}}",
            fontSize: 40,
            fontFamily: "Raleway",
            fill: "#00bf63",
            fontWeight: "bold",
            align: "left",
          },
          {
            type: "text",
            x: 60,
            y: tpl.height - 70,
            width: tpl.width - 120,
            text: "{{agent_name}}  ·  {{agent_phone}}",
            fontSize: 18,
            fontFamily: "Raleway",
            fill: "#525252",
            fontWeight: "normal",
            align: "left",
          },
        ],
      },
    ],
    audios: [],
  };
  const canvasJson = JSON.stringify(polotnoJson);
  const filled = applySmartFill(canvasJson, smartData);

  const project = await prisma.editorProject.create({
    data: {
      userId: user.id,
      propertyId: args.propertyId ?? null,
      name: tpl.name,
      canvasData: filled,
      width: tpl.width,
      height: tpl.height,
      format: tpl.format,
    },
    select: { id: true },
  });

  revalidatePath("/studio/editor");
  return { id: project.id };
}

export async function loadProject(id: string) {
  const user = await requireUser();
  const project = await prisma.editorProject.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) throw new Error("Proyecto no encontrado");
  return project;
}

export async function saveProject(
  id: string,
  data: {
    name?: string;
    canvasData?: string;
    thumbnail?: string;
    width?: number;
    height?: number;
    format?: string;
  }
): Promise<void> {
  const user = await requireUser();
  const owned = await prisma.editorProject.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Proyecto no encontrado");
  await prisma.editorProject.update({
    where: { id },
    data,
  });
}

export async function deleteProject(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.editorProject.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/studio/editor");
}

export async function renameProject(id: string, name: string): Promise<void> {
  await saveProject(id, { name });
}

// ============================================================
// Brand Assets
// ============================================================

export async function listBrandAssets(type?: string) {
  const user = await requireUser();
  return prisma.brandAsset.findMany({
    where: { userId: user.id, ...(type ? { type } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBrandAsset(data: {
  type: string;
  name: string;
  fileUrl: string;
  fileSize: number;
}) {
  const user = await requireUser();
  return prisma.brandAsset.create({
    data: { ...data, userId: user.id },
  });
}

export async function deleteBrandAsset(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.brandAsset.deleteMany({
    where: { id, userId: user.id },
  });
}

// ============================================================
// Property images for picker
// ============================================================

export async function listPropertiesForPicker() {
  const user = await requireUser();
  const props = await prisma.property.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      location: true,
      priceUSD: true,
    },
  });
  // Fetch one photo per property (n+1 acceptable for 50 max)
  const ids = props.map((p) => p.id);
  const photos = await prisma.photo.findMany({
    where: { propertyId: { in: ids } },
    select: { propertyId: true, url: true, order: true },
    orderBy: { order: "asc" },
  });
  const photoByProp = new Map<string, string>();
  for (const ph of photos) {
    if (ph.propertyId && !photoByProp.has(ph.propertyId)) {
      photoByProp.set(ph.propertyId, ph.url);
    }
  }
  return props.map((p) => ({
    id: p.id,
    title: p.title,
    location: p.location,
    price: p.priceUSD ? Number(p.priceUSD) : null,
    photos: photoByProp.has(p.id) ? [{ url: photoByProp.get(p.id)! }] : [],
  }));
}
