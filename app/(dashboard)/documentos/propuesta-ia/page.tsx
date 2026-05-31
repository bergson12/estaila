import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProposalWizard } from "@/components/documentos/proposal-wizard";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProposalIaPage() {
  const user = await requireUser();
  const [properties, contacts] = await Promise.all([
    prisma.property.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, location: true, priceUSD: true },
    }),
    prisma.contact.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, whatsapp: true },
      take: 500,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/documentos"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Volver a documentos
      </Link>
      <PageHeader
        title="Propuesta con IA"
        description="Genera una propuesta de venta personalizada en segundos y edítala antes de enviarla."
      />
      <ProposalWizard
        properties={properties.map((p) => ({
          id: p.id,
          title: p.title,
          location: p.location,
          priceUSD: p.priceUSD ? Number(p.priceUSD) : null,
        }))}
        contacts={contacts.map((c) => ({
          id: c.id,
          name: c.name,
          whatsapp: c.whatsapp,
        }))}
        agentName={user.name}
      />
    </div>
  );
}
