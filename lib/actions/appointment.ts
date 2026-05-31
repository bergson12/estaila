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

/**
 * Cita en curso AHORA mismo (para el banner global "En cita activa").
 * Activa si: empezó (startAt <= now), no está COMPLETADA/CANCELADA, y aún no
 * termina. Si `endAt` es null se asume una duración por defecto de 90 min.
 * De paso marca la cita como EN_CURSO (oportunista, no bloqueante).
 */
export async function getActiveAppointment() {
  const user = await requireUser();
  const now = new Date();
  const DEFAULT_MIN = 90;
  // Cota inferior para citas sin endAt (no queremos mostrar una de hace horas).
  const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  const candidates = await prisma.appointment.findMany({
    where: {
      userId: user.id,
      status: { in: ["PENDIENTE", "EN_CURSO"] },
      startAt: { lte: now },
      OR: [
        { endAt: { gte: now } },
        { endAt: null, startAt: { gte: windowStart } },
      ],
    },
    orderBy: { startAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      location: true,
      status: true,
      propertyId: true,
      contactId: true,
      property: { select: { title: true } },
    },
  });

  const active = candidates.find((a) => {
    const end =
      a.endAt ?? new Date(a.startAt.getTime() + DEFAULT_MIN * 60 * 1000);
    return now >= a.startAt && now <= end;
  });
  if (!active) return null;

  if (active.status !== "EN_CURSO") {
    prisma.appointment
      .update({ where: { id: active.id }, data: { status: "EN_CURSO" } })
      .catch(() => {});
  }

  return {
    id: active.id,
    title: active.title,
    startAt: active.startAt,
    endAt: active.endAt,
    location: active.location,
    propertyId: active.propertyId,
    contactId: active.contactId,
    propertyTitle: active.property?.title ?? null,
  };
}

/** Cierra una cita y, opcionalmente, agrega notas de seguimiento. */
export async function completeAppointment(id: string, notes?: string) {
  const user = await requireUser();
  const owned = await prisma.appointment.findFirst({
    where: { id, userId: user.id },
    select: { id: true, notes: true },
  });
  if (!owned) throw new Error("Cita no encontrada");

  const followUp = notes?.trim();
  const merged = followUp
    ? owned.notes
      ? `${owned.notes}\n\n— Seguimiento: ${followUp}`
      : followUp
    : undefined;

  await prisma.appointment.update({
    where: { id },
    data: { status: "COMPLETADO", ...(merged ? { notes: merged } : {}) },
  });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true };
}
