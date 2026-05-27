import {
  ArrowRight,
  Bot,
  Clock,
  LifeBuoy,
  MessageSquarePlus,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listMyTickets } from "@/lib/actions/support";
import { TicketsList } from "@/components/support/tickets-list";
import { NewTicketDialog } from "@/components/support/new-ticket-dialog";
import { isDeepSeekConfigured } from "@/lib/ai/deepseek";

export const dynamic = "force-dynamic";

export default async function SoportePage() {
  const [tickets] = await Promise.all([listMyTickets()]);
  const aiEnabled = isDeepSeekConfigured();
  const openTickets = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={
          <>
            <LifeBuoy className="h-6 w-6 text-primary" />
            Centro de ayuda
          </>
        }
        description="Resuelve tu duda al instante con el asistente IA. Si necesitas a un humano, abre un ticket."
      />

      {/* AI-first hero */}
      {aiEnabled && (
        <Card className="relative mb-5 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Bot className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">
                  Asistente IA · instantáneo
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  <Zap className="h-2.5 w-2.5" />
                  24/7
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong className="text-foreground">Empieza por aquí.</strong>{" "}
                Resuelve 90% de las dudas al instante: usar Studio IA, ajustar
                billing, navegar el CRM, crear contactos, automatizar emails…
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <a href="#chatbot-trigger" id="open-chatbot-link">
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Hablar con el asistente
                  </a>
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Pulsa el botón verde flotante 💚 abajo a la derecha
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Escalation path */}
      <Card className="mb-6 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <Clock className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">
              ¿El asistente no resuelve tu caso?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Abre un ticket solo si el asistente IA no pudo ayudar, o si es un
              problema técnico que requiere atención humana (cobros, errores
              del sistema, datos perdidos). Respuesta en{" "}
              <strong>máx 24h hábiles</strong>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <NewTicketDialog>
                <Button variant="outline" size="sm">
                  <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                  Abrir ticket de soporte
                </Button>
              </NewTicketDialog>
              <Link
                href="/legal/reembolsos"
                className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Política de reembolsos →
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Existing tickets */}
      {tickets.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tus tickets ({openTickets.length} abiertos)
          </h2>
          {openTickets.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              Pendiente respuesta
            </span>
          )}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Bot
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <p className="text-xs text-muted-foreground">
            Sin tickets abiertos. Si el asistente IA no resuelve tu duda,
            abre uno aquí.
          </p>
        </div>
      ) : (
        <TicketsList tickets={tickets} basePath="/soporte" />
      )}

      {/* Quick tips */}
      <Card className="mt-8 p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Antes de abrir un ticket
        </h3>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>
              <strong>Studio IA falla:</strong> los créditos se reembolsan
              automáticamente cuando una generación falla. Vuelve a intentarlo
              antes de reportar.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>
              <strong>Cobros / facturación:</strong> consulta primero la{" "}
              <Link
                href="/legal/reembolsos"
                className="text-primary underline"
              >
                política de reembolsos
              </Link>{" "}
              — la mayoría de casos tienen respuesta clara ahí.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>
              <strong>Para acelerar resolución:</strong> incluye capturas, el
              mensaje exacto del error y la URL donde ocurrió.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
