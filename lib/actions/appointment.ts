"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export type AppointmentInput = {
  title: string;
  propertyId?: string;
  startAt: Date;
  endAt?: Date;
  status?: string;
  location?: string;
  attendees?: string;
  notes?: string;
};

export async function createAppointment(input: AppointmentInput) {
  const user = await requireUser();
  const a = await prisma.appointment.create({
    data: {
      userId: user.id,
      title: input.title,
      propertyId: input.propertyId || null,
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      status: input.status ?? "PENDIENTE",
      location: input.location || null,
      attendees: input.attendees || null,
      notes: input.notes || null,
    },
  });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { id: a.id };
}

/**
 * Full update — keeps null for unspecified fields so the dialog can clear them.
 */
export async function updateAppointment(id: string, input: AppointmentInput) {
  const user = await requireUser();
  const owned = await prisma.appointment.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Cita no encontrada");
  await prisma.appointment.update({
    where: { id },
    data: {
      title: input.title,
      propertyId: input.propertyId || null,
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      status: input.status ?? undefined,
      location: input.location || null,
      attendees: input.attendees || null,
      notes: input.notes || null,
    },
  });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true };
}

export async function updateAppointmentStatus(id: string, status: string) {
  const user = await requireUser();
  await prisma.appointment.updateMany({
    where: { id, userId: user.id },
    data: { status },
  });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteAppointment(id: string) {
  const user = await requireUser();
  await prisma.appointment.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true };
}
