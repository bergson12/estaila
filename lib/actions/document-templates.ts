"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  SYSTEM_TEMPLATES,
  buildOrgHeaderBlock,
  cleanDocxHtml,
  type DocKind,
  type OrgContext,
} from "@/lib/document-templates";

// ============================================================
// SEED — copia SYSTEM_TEMPLATES a DB (idempotente, una sola vez)
// ============================================================

/**
 * Sembrar plantillas del sistema en DB. Idempotente:
 * inserta solo las que no existan ya (mismo nombre + kind + userId=null).
 */
export async function seedSystemTemplates() {
  let inserted = 0;
  for (const t of SYSTEM_TEMPLATES) {
    const exists = await prisma.documentTemplate.findFirst({
      where: { userId: null, kind: t.kind, name: t.name },
      select: { id: true },
    });
    if (!exists) {
      await prisma.documentTemplate.create({
        data: {
          userId: null,
          kind: t.kind,
          name: t.name,
          description: t.description,
          body: t.body,
          source: "SYSTEM",
          isDefault: t.name.endsWith("· Completo") || t.name.endsWith("· Completa") || t.name.endsWith("· Estándar"),
        },
      });
      inserted++;
    }
  }
  return { inserted };
}

// ============================================================
// LIST
// ============================================================

/**
 * Listar plantillas visibles al usuario actual.
 * Incluye:
 *   - SYSTEM (userId = null)
 *   - propias (userId = user.id)
 */
export async function listTemplates(kind?: DocKind) {
  const user = await requireUser();
  // Auto-seed si no hay system templates aún (primera vez en este server)
  const anySystem = await prisma.documentTemplate.count({ where: { userId: null } });
  if (anySystem === 0) {
    await seedSystemTemplates();
  }

  const rows = await prisma.documentTemplate.findMany({
    where: {
      AND: [
        kind ? { kind } : {},
        { OR: [{ userId: null }, { userId: user.id }] },
      ],
    },
    orderBy: [{ kind: "asc" }, { userId: "asc" }, { isDefault: "desc" }, { name: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    kind: r.kind as DocKind,
    name: r.name,
    description: r.description,
    body: r.body,
    source: r.source as "MANUAL" | "DOCX" | "SYSTEM",
    isDefault: r.isDefault,
    isSystem: r.userId === null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

// ============================================================
// CREATE / UPDATE / DELETE
// ============================================================

export type TemplateInput = {
  kind: DocKind;
  name: string;
  description?: string | null;
  body: string;
  source?: "MANUAL" | "DOCX";
};

export async function createTemplate(input: TemplateInput) {
  const user = await requireUser();
  const t = await prisma.documentTemplate.create({
    data: {
      userId: user.id,
      kind: input.kind,
      name: input.name.trim().slice(0, 120),
      description: input.description?.trim().slice(0, 240) || null,
      body: input.body,
      source: input.source ?? "MANUAL",
      isDefault: false,
    },
  });
  revalidatePath("/propiedades");
  return { id: t.id };
}

export async function updateTemplate(
  id: string,
  patch: Partial<TemplateInput>
) {
  const user = await requireUser();
  const existing = await prisma.documentTemplate.findFirst({
    where: { id, userId: user.id }, // sólo se pueden editar las propias
  });
  if (!existing) throw new Error("Plantilla no encontrada o no editable");
  await prisma.documentTemplate.update({
    where: { id },
    data: {
      ...(patch.name !== undefined && { name: patch.name.trim().slice(0, 120) }),
      ...(patch.description !== undefined && {
        description: patch.description?.trim().slice(0, 240) || null,
      }),
      ...(patch.body !== undefined && { body: patch.body }),
      ...(patch.kind !== undefined && { kind: patch.kind }),
    },
  });
  revalidatePath("/propiedades");
}

export async function deleteTemplate(id: string) {
  const user = await requireUser();
  const existing = await prisma.documentTemplate.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error("Plantilla no encontrada o no eliminable");
  await prisma.documentTemplate.delete({ where: { id } });
  revalidatePath("/propiedades");
}

/**
 * Marca esta plantilla como default del usuario para su `kind`,
 * desmarcando las demás propias del mismo kind.
 */
export async function setDefaultTemplate(id: string) {
  const user = await requireUser();
  const t = await prisma.documentTemplate.findFirst({ where: { id } });
  if (!t) throw new Error("Plantilla no encontrada");
  // Sólo se puede setear como default plantillas propias
  if (t.userId !== user.id) {
    throw new Error("Sólo puedes marcar como default tus propias plantillas");
  }
  await prisma.$transaction([
    prisma.documentTemplate.updateMany({
      where: { userId: user.id, kind: t.kind, id: { not: id } },
      data: { isDefault: false },
    }),
    prisma.documentTemplate.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/propiedades");
}

// ============================================================
// DOCX → HTML (vía mammoth)
// ============================================================

/**
 * Sube un DOCX (como string base64), lo convierte a HTML con mammoth,
 * y lo guarda como plantilla custom del usuario.
 *
 * Ejemplo del lado del cliente:
 *   const buf = await file.arrayBuffer();
 *   const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
 *   await uploadDocxTemplate({ kind, name, base64: b64 });
 */
export async function uploadDocxTemplate(input: {
  kind: DocKind;
  name: string;
  description?: string;
  base64: string;
}) {
  const user = await requireUser();

  // dynamic import — mammoth es server-only
  const mammoth = (await import("mammoth")).default;

  // Style map: traduce estilos Word → headings semánticos
  const styleMap = [
    "p[style-name='Title'] => h1:fresh",
    "p[style-name='Subtitle'] => h2:fresh",
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Heading 4'] => h4:fresh",
    "p[style-name='Quote'] => blockquote:fresh",
    "p[style-name='List Paragraph'] => p.list",
    "r[style-name='Strong'] => strong",
    "r[style-name='Emphasis'] => em",
  ];

  const buffer = Buffer.from(input.base64, "base64");
  const result = await mammoth.convertToHtml({ buffer }, { styleMap });
  const rawHtml = (result.value || "").trim();
  if (!rawHtml) throw new Error("No se pudo extraer contenido del DOCX");

  // Post-process — limpia dashes, splits ordinals, promotes title
  let cleaned = cleanDocxHtml(rawHtml);

  // Auto-prepend org branded header if user belongs to a team
  const org = await getOrgContextForUser(user.id);
  if (org) {
    const header = `{{org.headerBlock}}`; // placeholder — se reemplaza al renderizar
    cleaned = `${header}\n${cleaned}`;
  }

  // Insertar plantilla
  const t = await prisma.documentTemplate.create({
    data: {
      userId: user.id,
      kind: input.kind,
      name: input.name.trim().slice(0, 120) || "Plantilla DOCX",
      description:
        input.description?.trim().slice(0, 240) ||
        "Importada desde DOCX. Edita el HTML y reemplaza datos fijos por placeholders {{form.campo}} o {{property.title}} desde el panel derecho.",
      body: cleaned,
      source: "DOCX",
      isDefault: false,
    },
  });
  revalidatePath("/propiedades");
  return { id: t.id, messages: result.messages.map((m) => m.message) };
}

// ============================================================
// ORG CONTEXT (para inyectar en plantillas)
// ============================================================

/**
 * Devuelve los datos de la primera organización aceptada del usuario.
 * Usado para inyectar {{org.*}} en el render del documento.
 */
export async function getOrgContextForUser(
  userIdOverride?: string
): Promise<OrgContext | null> {
  const user = userIdOverride ? { id: userIdOverride } : await requireUser();
  const member = await prisma.organizationMember.findFirst({
    where: { userId: user.id, acceptedAt: { not: null } },
    select: {
      organization: {
        select: {
          name: true,
          legalName: true,
          taxId: true,
          email: true,
          phone: true,
          website: true,
          address: true,
          logoUrl: true,
          primaryColor: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!member?.organization) return null;
  return member.organization as OrgContext;
}

/**
 * Devuelve el contexto org listo para el dialog (incluye headerBlock HTML).
 */
export async function getOrgContext() {
  const org = await getOrgContextForUser();
  if (!org) return null;
  return {
    ...org,
    headerBlock: buildOrgHeaderBlock(org),
  };
}
