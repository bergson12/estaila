import { PageHeader } from "@/components/shared/page-header";
import { FinanzasClient } from "@/components/finanzas/finanzas-client";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const user = await requireUser();

  const [txs, properties] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      include: { property: { select: { title: true } } },
    }),
    prisma.property.findMany({
      where: { userId: user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const transactions = txs.map((t) => ({
    id: t.id,
    concept: t.concept,
    amount: Number(t.amount),
    category: t.category,
    type: t.type,
    status: t.status,
    currency: t.currency,
    date: t.date,
    notes: t.notes,
    propertyId: t.propertyId,
    propertyTitle: t.property?.title ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Finanzas"
        description="Registra ingresos y gastos por propiedad o generales."
      />
      <FinanzasClient transactions={transactions} properties={properties} />
    </div>
  );
}
