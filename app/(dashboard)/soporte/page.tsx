import { LifeBuoy, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listMyTickets } from "@/lib/actions/support";
import { TicketsList } from "@/components/support/tickets-list";
import { NewTicketDialog } from "@/components/support/new-ticket-dialog";

export const dynamic = "force-dynamic";

export default async function SoportePage() {
  const tickets = await listMyTickets();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={
          <>
            <LifeBuoy className="h-6 w-6 text-primary" />
            Soporte
          </>
        }
        description="Reporta problemas, dudas o sugerencias. Te respondemos en máx 24h hábiles."
        actions={
          <NewTicketDialog>
            <Button>
              <MessageSquarePlus className="mr-1.5 h-4 w-4" />
              Nuevo ticket
            </Button>
          </NewTicketDialog>
        }
      />

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <LifeBuoy
            className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium">Sin tickets abiertos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Si tienes algún problema o sugerencia, ábrenos un ticket. Estamos
            aquí para ayudar.
          </p>
          <div className="mt-5">
            <NewTicketDialog>
              <Button>
                <MessageSquarePlus className="mr-1.5 h-4 w-4" />
                Abrir primer ticket
              </Button>
            </NewTicketDialog>
          </div>
        </div>
      ) : (
        <TicketsList tickets={tickets} basePath="/soporte" />
      )}

      <div className="mt-8 rounded-xl border border-border bg-card/40 p-5">
        <h3 className="mb-2 text-sm font-semibold">Antes de abrir un ticket</h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>
            ✓ Revisa el{" "}
            <Link href="/legal/reembolsos" className="text-primary underline">
              política de reembolsos
            </Link>{" "}
            si es sobre billing.
          </li>
          <li>
            ✓ Para problemas con Studio IA, intenta regenerar primero
            (créditos se reembolsan automático si falla).
          </li>
          <li>
            ✓ Incluye capturas o el mensaje exacto del error para acelerar la
            resolución.
          </li>
        </ul>
      </div>
    </div>
  );
}
