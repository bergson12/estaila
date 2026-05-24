"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// ============================================================
// TAGS
// ============================================================

export type TagInput = {
  name: string;
  color?: string;
  icon?: string;
};

export async function createTag(input: TagInput) {
  const user = await requireUser();
  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: input.name.trim() } },
    create: {
      userId: user.id,
      name: input.name.trim().slice(0, 40),
      color: input.color ?? "#6B7280",
      icon: input.icon ?? null,
    },
    update: {
      color: input.color ?? undefined,
      icon: input.icon ?? undefined,
    },
  });
  revalidatePath("/contactos");
  return tag;
}

export async function deleteTag(id: string) {
  const user = await requireUser();
  await prisma.tag.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/contactos");
}

export async function listTags() {
  const user = await requireUser();
  return prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

export async function attachTag(contactId: string, tagId: string) {
  const user = await requireUser();
  // Verify ownership of both
  const [c, t] = await Promise.all([
    prisma.contact.findFirst({ where: { id: contactId, userId: user.id } }),
    prisma.tag.findFirst({ where: { id: tagId, userId: user.id } }),
  ]);
  if (!c || !t) throw new Error("Recurso no encontrado");

  await prisma.contactTag.upsert({
    where: { contactId_tagId: { contactId, tagId } },
    create: { contactId, tagId },
    update: {},
  });
  await logActivityInternal({
    contactId,
    userId: user.id,
    type: "TAG_ADDED",
    title: `Tag «${t.name}» añadido`,
  });
  revalidatePath("/contactos");
  revalidatePath(`/contactos/${contactId}`);
}

export async function detachTag(contactId: string, tagId: string) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!c) throw new Error("Contacto no encontrado");
  await prisma.contactTag.deleteMany({ where: { contactId, tagId } });
  revalidatePath("/contactos");
  revalidatePath(`/contactos/${contactId}`);
}

/** Bulk attach a tag to many contacts. */
export async function bulkAttachTag(contactIds: string[], tagId: string) {
  const user = await requireUser();
  const tag = await prisma.tag.findFirst({ where: { id: tagId, userId: user.id } });
  if (!tag) throw new Error("Tag no encontrado");
  const owned = await prisma.contact.findMany({
    where: { id: { in: contactIds }, userId: user.id },
    select: { id: true },
  });
  for (const c of owned) {
    await prisma.contactTag
      .upsert({
        where: { contactId_tagId: { contactId: c.id, tagId } },
        create: { contactId: c.id, tagId },
        update: {},
      })
      .catch(() => null);
  }
  revalidatePath("/contactos");
  return { tagged: owned.length };
}

// ============================================================
// ACTIVITIES (timeline)
// ============================================================

export type ActivityInput = {
  contactId: string;
  type: string;
  title: string;
  content?: string;
  durationMin?: number;
  propertyId?: string;
  appointmentId?: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: ActivityInput) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id: input.contactId, userId: user.id },
  });
  if (!c) throw new Error("Contacto no encontrado");
  await logActivityInternal({ ...input, userId: user.id });
  revalidatePath(`/contactos/${input.contactId}`);
}

async function logActivityInternal(args: {
  contactId: string;
  userId: string;
  type: string;
  title: string;
  content?: string;
  durationMin?: number;
  propertyId?: string;
  appointmentId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.$transaction([
    prisma.contactActivity.create({
      data: {
        contactId: args.contactId,
        userId: args.userId,
        type: args.type,
        title: args.title.slice(0, 200),
        content: args.content?.slice(0, 2000) ?? null,
        durationMin: args.durationMin ?? null,
        propertyId: args.propertyId ?? null,
        appointmentId: args.appointmentId ?? null,
        metadata: args.metadata ? JSON.stringify(args.metadata) : null,
      },
    }),
    // Update lastContactedAt for engagement tracking
    prisma.contact.update({
      where: { id: args.contactId },
      data: { lastContactedAt: new Date() },
    }),
  ]);
}

export async function listActivities(contactId: string, limit = 50) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
  });
  if (!c) return [];
  return prisma.contactActivity.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Logs a quick note. Returns the activity. */
export async function addNote(contactId: string, content: string) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
  });
  if (!c) throw new Error("Contacto no encontrado");
  await logActivityInternal({
    contactId,
    userId: user.id,
    type: "NOTE",
    title: "Nota",
    content,
  });
  revalidatePath(`/contactos/${contactId}`);
}

/** Used by the WhatsApp dialog after sending. */
export async function logWhatsAppSent(args: {
  contactId: string;
  message: string;
}) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id: args.contactId, userId: user.id },
  });
  if (!c) return;
  await logActivityInternal({
    contactId: args.contactId,
    userId: user.id,
    type: "WHATSAPP_SENT",
    title: "WhatsApp enviado",
    content: args.message,
  });
  revalidatePath(`/contactos/${args.contactId}`);
  revalidatePath("/contactos");
}

export async function logCall(args: {
  contactId: string;
  durationMin?: number;
  notes?: string;
}) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id: args.contactId, userId: user.id },
  });
  if (!c) return;
  await logActivityInternal({
    contactId: args.contactId,
    userId: user.id,
    type: "CALL",
    title: args.durationMin
      ? `Llamada · ${args.durationMin} min`
      : "Llamada",
    content: args.notes,
    durationMin: args.durationMin,
  });
  revalidatePath(`/contactos/${args.contactId}`);
  revalidatePath("/contactos");
}

// ============================================================
// SMART LISTS
// ============================================================

export type SmartListFilters = {
  type?: string;
  tagIds?: string[];
  favorite?: boolean;
  /** Days since lastContactedAt is > N */
  daysSinceContact?: number;
  /** Birthday within next N days */
  birthdayWithinDays?: number;
  /** Search string */
  q?: string;
};

export type SmartListInput = {
  name: string;
  icon?: string;
  color?: string;
  filters: SmartListFilters;
  pinned?: boolean;
};

export async function createSmartList(input: SmartListInput) {
  const user = await requireUser();
  const sl = await prisma.smartList.create({
    data: {
      userId: user.id,
      name: input.name.trim().slice(0, 60),
      icon: input.icon ?? "List",
      color: input.color ?? "#3B82F6",
      filters: JSON.stringify(input.filters),
      pinned: input.pinned ?? false,
    },
  });
  revalidatePath("/contactos");
  return sl;
}

export async function updateSmartList(
  id: string,
  patch: Partial<SmartListInput>
) {
  const user = await requireUser();
  const sl = await prisma.smartList.findFirst({
    where: { id, userId: user.id },
  });
  if (!sl) throw new Error("Lista no encontrada");
  await prisma.smartList.update({
    where: { id },
    data: {
      ...(patch.name !== undefined && { name: patch.name.trim().slice(0, 60) }),
      ...(patch.icon !== undefined && { icon: patch.icon }),
      ...(patch.color !== undefined && { color: patch.color }),
      ...(patch.filters !== undefined && { filters: JSON.stringify(patch.filters) }),
      ...(patch.pinned !== undefined && { pinned: patch.pinned }),
    },
  });
  revalidatePath("/contactos");
}

export async function deleteSmartList(id: string) {
  const user = await requireUser();
  await prisma.smartList.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/contactos");
}

export async function listSmartLists() {
  const user = await requireUser();
  const rows = await prisma.smartList.findMany({
    where: { userId: user.id },
    orderBy: [{ pinned: "desc" }, { order: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    ...r,
    filters: JSON.parse(r.filters) as SmartListFilters,
  }));
}

// ============================================================
// BULK ACTIONS
// ============================================================

export async function bulkUpdateContactType(
  contactIds: string[],
  type: string
) {
  const user = await requireUser();
  await prisma.contact.updateMany({
    where: { id: { in: contactIds }, userId: user.id },
    data: { type },
  });
  revalidatePath("/contactos");
  return { updated: contactIds.length };
}

export async function bulkDeleteContacts(contactIds: string[]) {
  const user = await requireUser();
  const r = await prisma.contact.deleteMany({
    where: { id: { in: contactIds }, userId: user.id },
  });
  revalidatePath("/contactos");
  return { deleted: r.count };
}

export async function bulkToggleFavorite(contactIds: string[], favorite: boolean) {
  const user = await requireUser();
  await prisma.contact.updateMany({
    where: { id: { in: contactIds }, userId: user.id },
    data: { favorite },
  });
  revalidatePath("/contactos");
}

// ============================================================
// CUSTOM FIELDS
// ============================================================

export async function setCustomField(
  contactId: string,
  key: string,
  value: string
) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
  });
  if (!c) throw new Error("Contacto no encontrado");
  await prisma.contactCustomField.upsert({
    where: { contactId_key: { contactId, key } },
    create: { contactId, key, value },
    update: { value },
  });
  revalidatePath(`/contactos/${contactId}`);
}

export async function deleteCustomField(contactId: string, key: string) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
  });
  if (!c) throw new Error("Contacto no encontrado");
  await prisma.contactCustomField.deleteMany({ where: { contactId, key } });
  revalidatePath(`/contactos/${contactId}`);
}
