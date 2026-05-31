import { LifeBuoy } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { isAdmin } from "@/lib/auth-server";
import { listAllTickets } from "@/lib/actions/support";
import { TicketsList } from "@/components/support/tickets-list";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminSoportePage() {
  if (!(await isAdmin())) redirect("/inicio");

  const [tickets, t] = await Promise.all([listAllTickets(), getDict()]);
  const open = tickets.filter((tk) => tk.status === "OPEN").length;
  const inProgress = tickets.filter((tk) => tk.status === "IN_PROGRESS").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={
          <>
            <LifeBuoy className="h-6 w-6 text-primary" />
            {t.adminPanel.supportTicketsTitle}
          </>
        }
        description={`${open} ${t.adminPanel.ticketsOpen} · ${inProgress} ${t.adminPanel.ticketsInProgress} · ${tickets.length} ${t.adminPanel.ticketsTotal}`}
      />
      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <LifeBuoy
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium">{t.adminPanel.noTickets}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.adminPanel.noTicketsHint}
          </p>
        </div>
      ) : (
        <TicketsList tickets={tickets} basePath="/admin/soporte" showUser />
      )}
    </div>
  );
}
