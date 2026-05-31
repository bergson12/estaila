import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket } from "@/lib/actions/support";
import { TicketThread } from "@/components/support/ticket-thread";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, t] = await Promise.all([getTicket(id), getDict()]);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/soporte"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t.soporte.backToTickets}
      </Link>
      <TicketThread ticket={ticket} basePath="/soporte" />
    </div>
  );
}
