"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export type TransactionInput = {
  concept: string;
  amount: number;
  category: string; // INGRESO | GASTO
  type: string; // RESERVA | COMISION | MANTENIMIENTO | PUBLICIDAD | MARKETING | SUSCRIPCION | LEGAL | OTRO
  status?: string;
  currency?: string;
  propertyId?: string;
  notes?: string;
  reference?: string;
  date?: Date;
};

export async function createTransaction(input: TransactionInput) {
  const user = await requireUser();
  const t = await prisma.transaction.create({
    data: {
      userId: user.id,
      concept: input.concept,
      amount: input.amount,
      category: input.category,
      type: input.type,
      status: input.status ?? "PENDIENTE",
      currency: input.currency ?? "USD",
      propertyId: input.propertyId || null,
      notes: input.notes || null,
      reference: input.reference || null,
      date: input.date ?? new Date(),
    },
  });
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { id: t.id };
}

export async function updateTransactionStatus(id: string, status: string) {
  const user = await requireUser();
  await prisma.transaction.updateMany({
    where: { id, userId: user.id },
    data: { status },
  });
  revalidatePath("/finanzas");
  return { ok: true };
}

export async function deleteTransaction(id: string) {
  const user = await requireUser();
  await prisma.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { ok: true };
}
