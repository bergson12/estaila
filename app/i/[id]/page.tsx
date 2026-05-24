import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InvoiceView } from "@/components/finanzas/invoice-view";

export const dynamic = "force-dynamic";

/**
 * Public invoice view — accessible without auth via the transaction cuid.
 * Used as the shareable link sent to clients/owners through WhatsApp/email.
 * High entropy of the cuid acts as the access token for MVP.
 */
export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          title: true,
          address: true,
          location: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          agentPhone: true,
          agentLocation: true,
          image: true,
        },
      },
    },
  });

  if (!tx) notFound();

  return (
    <InvoiceView
      transaction={{
        id: tx.id,
        concept: tx.concept,
        amount: Number(tx.amount),
        category: tx.category,
        type: tx.type,
        status: tx.status,
        currency: tx.currency,
        date: tx.date,
        notes: tx.notes,
        propertyTitle: tx.property?.title ?? null,
        propertyLocation: tx.property?.location ?? null,
        propertyAddress: tx.property?.address ?? null,
      }}
      agent={{
        name: tx.user.name,
        email: tx.user.email,
        phone: tx.user.agentPhone ?? null,
        location: tx.user.agentLocation ?? null,
        avatar: tx.user.image ?? null,
      }}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { concept: true },
  });
  return {
    title: tx ? `Recibo · ${tx.concept}` : "Recibo",
  };
}
