import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket } from "@/lib/actions/support";
import { TicketThread } from "@/components/support/ticket-thread";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/soporte"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a tickets
      </Link>
      <TicketThread ticket={ticket} basePath="/soporte" />
    </div>
  );
}
