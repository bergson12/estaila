"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { ensureUploadedDocSchema, DOC_KINDS, DOC_STATUSES } from "@/lib/documents";
import { isTrustedStorageUrl } from "@/lib/storage";

type CreateDocInput = {
  name: string;
  fileUrl: string;
  mimeType?: string | null;
  kind?: string;
  propertyId?: string | null;
  contactId?: string | null;
  notes?: string | null;
};

export async function createUploadedDocument(
  input: CreateDocInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requireUser();
  await ensureUploadedDocSchema();

  // Solo aceptamos archivos de nuestro propio almacenamiento.
  if (!isTrustedStorageUrl(input.fileUrl)) {
    return { ok: false, error: "Archivo inválido." };
  }

  const kind =
    input.kind && (DOC_KINDS as readonly string[]).includes(input.kind)
      ? input.kind
      : "OTRO";

  const doc = await prisma.uploadedDocument.create({
    data: {
      userId: user.id,
      name: (input.name || "Documento").trim().slice(0, 200),
      fileUrl: input.fileUrl,
      mimeType: input.mimeType || null,
      kind,
      propertyId: input.propertyId || null,
      contactId: input.contactId || null,
      notes: input.notes?.trim().slice(0, 500) || null,
    },
    select: { id: true },
  });

  revalidatePath("/documentos");
  return { ok: true, id: doc.id };
}

export async function updateDocStatus(
  id: string,
  status: string
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (!(DOC_STATUSES as readonly string[]).includes(status)) {
    return { ok: false };
  }
  await prisma.uploadedDocument.updateMany({
    where: { id, userId: user.id },
    data: { status },
  });
  revalidatePath("/documentos");
  return { ok: true };
}

export async function deleteUploadedDocument(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await prisma.uploadedDocument.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/documentos");
  return { ok: true };
}
