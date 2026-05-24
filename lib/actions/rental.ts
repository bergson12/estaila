"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// ============================================================
// TENANTS
// ============================================================

export type TenantInput = {
  propertyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  identification?: string | null;
  monthlyRent: number;
  deposit?: number | null;
  currency?: string;
  startDate: string; // ISO
  endDate?: string | null;
  paymentDay?: number;
  notes?: string | null;
};

export async function createTenant(input: TenantInput) {
  const user = await requireUser();
  // Verify property ownership
  const prop = await prisma.property.findFirst({
    where: { id: input.propertyId, userId: user.id },
    select: { id: true },
  });
  if (!prop) throw new Error("Propiedad no encontrada");

  const t = await prisma.tenant.create({
    data: {
      propertyId: input.propertyId,
      userId: user.id,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      identification: input.identification?.trim() || null,
      monthlyRent: input.monthlyRent,
      deposit: input.deposit ?? null,
      currency: input.currency ?? "USD",
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      paymentDay: input.paymentDay ?? 5,
      notes: input.notes?.trim() || null,
    },
  });
  revalidatePath(`/propiedades/${input.propertyId}`);
  return t;
}

export async function updateTenant(id: string, patch: Partial<TenantInput & { status: string }>) {
  const user = await requireUser();
  const t = await prisma.tenant.findFirst({ where: { id, userId: user.id } });
  if (!t) throw new Error("Inquilino no encontrado");
  await prisma.tenant.update({
    where: { id },
    data: {
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.email !== undefined && { email: patch.email }),
      ...(patch.phone !== undefined && { phone: patch.phone }),
      ...(patch.whatsapp !== undefined && { whatsapp: patch.whatsapp }),
      ...(patch.identification !== undefined && { identification: patch.identification }),
      ...(patch.monthlyRent !== undefined && { monthlyRent: patch.monthlyRent }),
      ...(patch.deposit !== undefined && { deposit: patch.deposit }),
      ...(patch.startDate !== undefined && { startDate: new Date(patch.startDate) }),
      ...(patch.endDate !== undefined && { endDate: patch.endDate ? new Date(patch.endDate) : null }),
      ...(patch.paymentDay !== undefined && { paymentDay: patch.paymentDay }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      ...(patch.status !== undefined && { status: patch.status }),
    },
  });
  revalidatePath(`/propiedades/${t.propertyId}`);
}

export async function deleteTenant(id: string) {
  const user = await requireUser();
  const t = await prisma.tenant.findFirst({ where: { id, userId: user.id } });
  if (!t) throw new Error("Inquilino no encontrado");
  await prisma.tenant.delete({ where: { id } });
  revalidatePath(`/propiedades/${t.propertyId}`);
}

export async function getTenantsForProperty(propertyId: string) {
  const user = await requireUser();
  return prisma.tenant.findMany({
    where: { propertyId, userId: user.id },
    orderBy: { startDate: "desc" },
  });
}

// ============================================================
// PAYMENTS
// ============================================================

export type PaymentInput = {
  propertyId: string;
  tenantId?: string | null;
  amount: number;
  currency?: string;
  concept?: string;
  dueDate: string;
  paidDate?: string | null;
  status?: "PENDING" | "PAID" | "LATE" | "PARTIAL";
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
};

export async function createPayment(input: PaymentInput) {
  const user = await requireUser();
  const p = await prisma.rentalPayment.create({
    data: {
      propertyId: input.propertyId,
      tenantId: input.tenantId || null,
      userId: user.id,
      amount: input.amount,
      currency: input.currency ?? "USD",
      concept: input.concept ?? "RENT",
      dueDate: new Date(input.dueDate),
      paidDate: input.paidDate ? new Date(input.paidDate) : null,
      status:
        input.status ??
        (input.paidDate ? "PAID" : new Date(input.dueDate) < new Date() ? "LATE" : "PENDING"),
      method: input.method || null,
      reference: input.reference || null,
      notes: input.notes || null,
    },
  });
  revalidatePath(`/propiedades/${input.propertyId}`);
  return p;
}

export async function markPaymentPaid(id: string, method?: string, reference?: string) {
  const user = await requireUser();
  const p = await prisma.rentalPayment.findFirst({ where: { id, userId: user.id } });
  if (!p) throw new Error("Pago no encontrado");
  await prisma.rentalPayment.update({
    where: { id },
    data: {
      status: "PAID",
      paidDate: new Date(),
      method: method ?? p.method,
      reference: reference ?? p.reference,
    },
  });
  revalidatePath(`/propiedades/${p.propertyId}`);
}

export async function deletePayment(id: string) {
  const user = await requireUser();
  const p = await prisma.rentalPayment.findFirst({ where: { id, userId: user.id } });
  if (!p) throw new Error("Pago no encontrado");
  await prisma.rentalPayment.delete({ where: { id } });
  revalidatePath(`/propiedades/${p.propertyId}`);
}

export async function getPaymentsForProperty(propertyId: string) {
  const user = await requireUser();
  return prisma.rentalPayment.findMany({
    where: { propertyId, userId: user.id },
    orderBy: [{ dueDate: "desc" }],
    include: { tenant: { select: { name: true } } },
  });
}

/**
 * Auto-generate next 12 months of expected rent payments for a tenant.
 */
export async function generateRentSchedule(tenantId: string, months: number = 12) {
  const user = await requireUser();
  const t = await prisma.tenant.findFirst({ where: { id: tenantId, userId: user.id } });
  if (!t) throw new Error("Inquilino no encontrado");

  const rows: Promise<unknown>[] = [];
  const start = new Date(t.startDate);
  for (let i = 0; i < months; i++) {
    const dueDate = new Date(start.getFullYear(), start.getMonth() + i, t.paymentDay);
    const exists = await prisma.rentalPayment.findFirst({
      where: {
        tenantId,
        concept: "RENT",
        dueDate,
      },
    });
    if (!exists) {
      rows.push(
        prisma.rentalPayment.create({
          data: {
            propertyId: t.propertyId,
            tenantId,
            userId: user.id,
            amount: t.monthlyRent,
            currency: t.currency,
            concept: "RENT",
            dueDate,
            status: dueDate < new Date() ? "LATE" : "PENDING",
          },
        })
      );
    }
  }
  await Promise.all(rows);
  revalidatePath(`/propiedades/${t.propertyId}`);
  return { generated: rows.length };
}

// ============================================================
// MAINTENANCE
// ============================================================

export type MaintenanceInput = {
  propertyId: string;
  title: string;
  description?: string | null;
  category?: string;
  priority?: string;
  cost?: number | null;
  vendor?: string | null;
};

export async function createMaintenance(input: MaintenanceInput) {
  const user = await requireUser();
  const m = await prisma.maintenanceTicket.create({
    data: {
      propertyId: input.propertyId,
      userId: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category ?? "OTHER",
      priority: input.priority ?? "MEDIUM",
      cost: input.cost ?? null,
      vendor: input.vendor?.trim() || null,
    },
  });
  revalidatePath(`/propiedades/${input.propertyId}`);
  return m;
}

export async function updateMaintenanceStatus(
  id: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED"
) {
  const user = await requireUser();
  const m = await prisma.maintenanceTicket.findFirst({ where: { id, userId: user.id } });
  if (!m) throw new Error("Ticket no encontrado");
  await prisma.maintenanceTicket.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
  });
  revalidatePath(`/propiedades/${m.propertyId}`);
}

export async function deleteMaintenance(id: string) {
  const user = await requireUser();
  const m = await prisma.maintenanceTicket.findFirst({ where: { id, userId: user.id } });
  if (!m) throw new Error("Ticket no encontrado");
  await prisma.maintenanceTicket.delete({ where: { id } });
  revalidatePath(`/propiedades/${m.propertyId}`);
}

export async function getMaintenanceForProperty(propertyId: string) {
  const user = await requireUser();
  return prisma.maintenanceTicket.findMany({
    where: { propertyId, userId: user.id },
    orderBy: [{ status: "asc" }, { reportedAt: "desc" }],
  });
}

// ============================================================
// AGGREGATE SUMMARY
// ============================================================

export async function getRentalSummary(propertyId: string) {
  const user = await requireUser();
  const [tenants, payments, maintenance] = await Promise.all([
    prisma.tenant.findMany({
      where: { propertyId, userId: user.id },
      orderBy: { startDate: "desc" },
    }),
    prisma.rentalPayment.findMany({
      where: { propertyId, userId: user.id },
      orderBy: { dueDate: "desc" },
      include: { tenant: { select: { id: true, name: true } } },
    }),
    prisma.maintenanceTicket.findMany({
      where: { propertyId, userId: user.id },
      orderBy: [{ status: "asc" }, { reportedAt: "desc" }],
    }),
  ]);

  // Totals
  const totalCollected = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING" || p.status === "LATE" || p.status === "PARTIAL")
    .reduce((s, p) => s + Number(p.amount), 0);
  const lateCount = payments.filter((p) => p.status === "LATE").length;
  const openTickets = maintenance.filter(
    (m) => m.status === "OPEN" || m.status === "IN_PROGRESS"
  ).length;

  return {
    tenants: tenants.map((t) => ({
      ...t,
      monthlyRent: Number(t.monthlyRent),
      deposit: t.deposit ? Number(t.deposit) : null,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate?.toISOString() ?? null,
    })),
    payments: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      dueDate: p.dueDate.toISOString(),
      paidDate: p.paidDate?.toISOString() ?? null,
    })),
    maintenance: maintenance.map((m) => ({
      ...m,
      cost: m.cost ? Number(m.cost) : null,
      reportedAt: m.reportedAt.toISOString(),
      resolvedAt: m.resolvedAt?.toISOString() ?? null,
    })),
    stats: {
      activeTenants: tenants.filter((t) => t.status === "ACTIVE").length,
      totalCollected,
      totalPending,
      lateCount,
      openTickets,
    },
  };
}
