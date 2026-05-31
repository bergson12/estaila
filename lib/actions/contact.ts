"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { ContactSchema, type ContactInput } from "@/lib/validations";
import { assertWithinPlanLimit } from "@/lib/plan-limits";

function clean<T extends Record<string, unknown>>(data: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export async function createContact(input: ContactInput) {
  const user = await requireUser();
  await assertWithinPlanLimit(user.id, "contact");
  const parsed = ContactSchema.parse(input);
  const c = await prisma.contact.create({
    data: {
      ...clean(parsed),
      userId: user.id,
    } as never,
  });
  revalidatePath("/contactos");
  return { id: c.id };
}

export async function updateContact(id: string, input: ContactInput) {
  const user = await requireUser();
  const existing = await prisma.contact.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error("Contacto no encontrado");

  const parsed = ContactSchema.parse(input);
  await prisma.contact.update({
    where: { id },
    data: clean(parsed) as never,
  });
  revalidatePath("/contactos");
  return { id };
}

export async function deleteContact(id: string) {
  const user = await requireUser();
  await prisma.contact.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/contactos");
  return { ok: true };
}

export async function toggleContactFavorite(id: string) {
  const user = await requireUser();
  const c = await prisma.contact.findFirst({
    where: { id, userId: user.id },
    select: { favorite: true },
  });
  if (!c) throw new Error("Contacto no encontrado");
  await prisma.contact.update({
    where: { id },
    data: { favorite: !c.favorite },
  });
  revalidatePath("/contactos");
  return { favorite: !c.favorite };
}
