"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

/** Normalize phone for comparison (digits only, drop country code variants) */
function normPhone(s: string | null | undefined): string {
  if (!s) return "";
  const digits = s.replace(/\D/g, "");
  // Drop leading 1 (US) or country code variation — keep last 10
  return digits.slice(-10);
}
function normEmail(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export type DuplicateGroup = {
  key: string;
  reason: "email" | "phone" | "name";
  contacts: {
    id: string;
    name: string;
    type: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    updatedAt: string;
    favorite: boolean;
  }[];
};

/**
 * Returns groups of contacts that share email/phone.
 * Each group has ≥2 contacts. Sorted by group size.
 */
export async function findDuplicates(): Promise<DuplicateGroup[]> {
  const user = await requireUser();
  const all = await prisma.contact.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      phone: true,
      whatsapp: true,
      updatedAt: true,
      favorite: true,
    },
  });

  const byEmail = new Map<string, typeof all>();
  const byPhone = new Map<string, typeof all>();

  for (const c of all) {
    const e = normEmail(c.email);
    if (e) {
      if (!byEmail.has(e)) byEmail.set(e, []);
      byEmail.get(e)!.push(c);
    }
    for (const p of [normPhone(c.phone), normPhone(c.whatsapp)]) {
      if (!p || p.length < 7) continue;
      if (!byPhone.has(p)) byPhone.set(p, []);
      const existing = byPhone.get(p)!;
      // Avoid adding same contact twice if phone === whatsapp
      if (!existing.find((x) => x.id === c.id)) existing.push(c);
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const [k, rows] of byEmail) {
    if (rows.length >= 2) {
      groups.push({
        key: `email:${k}`,
        reason: "email",
        contacts: rows.map((r) => ({
          ...r,
          updatedAt: r.updatedAt.toISOString(),
        })),
      });
    }
  }
  for (const [k, rows] of byPhone) {
    if (rows.length >= 2) {
      // Avoid duplicating a group already captured by email
      const ids = rows.map((r) => r.id).sort().join(",");
      if (groups.some((g) => g.contacts.map((c) => c.id).sort().join(",") === ids)) continue;
      groups.push({
        key: `phone:${k}`,
        reason: "phone",
        contacts: rows.map((r) => ({
          ...r,
          updatedAt: r.updatedAt.toISOString(),
        })),
      });
    }
  }

  groups.sort((a, b) => b.contacts.length - a.contacts.length);
  return groups;
}

/**
 * Merge `sourceIds` INTO `targetId`.
 * - Re-parent properties, pipelineCards, activities, tags, appointments to target
 * - Merge custom fields (target wins on conflict)
 * - Delete source contacts
 */
export async function mergeContacts(args: {
  targetId: string;
  sourceIds: string[];
  /** Optional patch to apply to target (e.g. consolidated email/phone) */
  patch?: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    location?: string | null;
    notes?: string | null;
  };
}) {
  const user = await requireUser();
  if (args.sourceIds.includes(args.targetId)) {
    throw new Error("Target no puede estar en sources");
  }
  // Verify ownership
  const all = await prisma.contact.findMany({
    where: {
      id: { in: [args.targetId, ...args.sourceIds] },
      userId: user.id,
    },
    select: { id: true },
  });
  if (all.length !== args.sourceIds.length + 1) {
    throw new Error("Contactos no encontrados o no autorizados");
  }

  await prisma.$transaction(async (tx) => {
    // Re-parent owned properties
    await tx.property.updateMany({
      where: { ownerId: { in: args.sourceIds }, userId: user.id },
      data: { ownerId: args.targetId },
    });
    // Pipeline cards
    await tx.pipelineCard.updateMany({
      where: { contactId: { in: args.sourceIds }, userId: user.id },
      data: { contactId: args.targetId },
    });
    // Activities
    await tx.contactActivity.updateMany({
      where: { contactId: { in: args.sourceIds } },
      data: { contactId: args.targetId },
    });
    // Appointments
    await tx.appointment.updateMany({
      where: { contactId: { in: args.sourceIds }, userId: user.id },
      data: { contactId: args.targetId },
    });
    // Tags: re-attach (skip duplicates)
    const srcTags = await tx.contactTag.findMany({
      where: { contactId: { in: args.sourceIds } },
    });
    for (const ct of srcTags) {
      await tx.contactTag
        .upsert({
          where: {
            contactId_tagId: { contactId: args.targetId, tagId: ct.tagId },
          },
          create: { contactId: args.targetId, tagId: ct.tagId },
          update: {},
        })
        .catch(() => null);
    }
    // Custom fields: target wins on conflict
    const srcFields = await tx.contactCustomField.findMany({
      where: { contactId: { in: args.sourceIds } },
    });
    for (const f of srcFields) {
      await tx.contactCustomField
        .upsert({
          where: {
            contactId_key: { contactId: args.targetId, key: f.key },
          },
          create: {
            contactId: args.targetId,
            key: f.key,
            value: f.value,
          },
          update: {}, // keep target value if exists
        })
        .catch(() => null);
    }
    // Apply patch
    if (args.patch) {
      await tx.contact.update({
        where: { id: args.targetId },
        data: {
          ...(args.patch.name !== undefined && { name: args.patch.name }),
          ...(args.patch.email !== undefined && { email: args.patch.email }),
          ...(args.patch.phone !== undefined && { phone: args.patch.phone }),
          ...(args.patch.whatsapp !== undefined && {
            whatsapp: args.patch.whatsapp,
          }),
          ...(args.patch.location !== undefined && {
            location: args.patch.location,
          }),
          ...(args.patch.notes !== undefined && { notes: args.patch.notes }),
        },
      });
    }
    // Log merge activity on target
    await tx.contactActivity.create({
      data: {
        contactId: args.targetId,
        userId: user.id,
        type: "STATUS_CHANGE",
        title: `Fusión: ${args.sourceIds.length} contactos absorbidos`,
        content: `IDs: ${args.sourceIds.join(", ")}`,
      },
    });
    // Delete sources
    await tx.contact.deleteMany({
      where: { id: { in: args.sourceIds }, userId: user.id },
    });
  });

  revalidatePath("/contactos");
  revalidatePath(`/contactos/${args.targetId}`);
  return { merged: args.sourceIds.length };
}
