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
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SoportePage() {
  const [tickets, t] = await Promise.all([listMyTickets(), getDict()]);
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
            {t.soporte.title}
          </>
        }
        description={t.soporte.description}
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
                  {t.soporte.aiHeroTitle}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  <Zap className="h-2.5 w-2.5" />
                  24/7
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong className="text-foreground">
                  {t.soporte.aiHeroLead}
                </strong>{" "}
                {t.soporte.aiHeroBody}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <a href="#chatbot-trigger" id="open-chatbot-link">
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {t.soporte.talkToAssistant}
                  </a>
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  {t.soporte.floatingButtonHint}
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
              {t.soporte.escalationTitle}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t.soporte.escalationBody}{" "}
              <strong>{t.soporte.escalationSla}</strong>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <NewTicketDialog>
                <Button variant="outline" size="sm">
                  <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                  {t.soporte.openTicketBtn}
                </Button>
              </NewTicketDialog>
              <Link
                href="/legal/reembolsos"
                className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.soporte.refundPolicyLink} →
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Existing tickets */}
      {tickets.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t.soporte.yourTickets} ({openTickets.length} {t.soporte.openCount})
          </h2>
          {openTickets.length > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              {t.soporte.awaitingReply}
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
            {t.soporte.emptyTickets}
          </p>
        </div>
      ) : (
        <TicketsList tickets={tickets} basePath="/soporte" />
      )}

      {/* Quick tips */}
      <Card className="mt-8 p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.soporte.tipsTitle}
        </h3>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>
              <strong>{t.soporte.tipStudioLead}</strong> {t.soporte.tipStudioBody}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>
              <strong>{t.soporte.tipBillingLead}</strong>{" "}
              {t.soporte.tipBillingBefore}{" "}
              <Link
                href="/legal/reembolsos"
                className="text-primary underline"
              >
                {t.soporte.refundPolicyInline}
              </Link>{" "}
              {t.soporte.tipBillingAfter}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>
              <strong>{t.soporte.tipSpeedLead}</strong> {t.soporte.tipSpeedBody}
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
