"use client";

import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { numberToWords } from "@/lib/document-templates";
import type { Dict, Locale } from "@/lib/i18n/dictionary";

type Transaction = {
  id: string;
  concept: string;
  amount: number;
  category: string;
  type: string;
  status: string;
  currency: string;
  date: Date;
  notes: string | null;
  propertyTitle: string | null;
  propertyLocation: string | null;
  propertyAddress: string | null;
};

type Agent = {
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  avatar: string | null;
};

// Etiqueta i18n del subtipo (DB enum -> texto UI). Claves planas en `finanzas`.
function invoiceTypeLabels(t: Dict): Record<string, string> {
  return {
    RESERVA: t.finanzas.typeReserva,
    COMISION: t.finanzas.typeComision,
    MANTENIMIENTO: t.finanzas.typeMantenimiento,
    PUBLICIDAD: t.finanzas.typePublicidad,
    MARKETING: t.finanzas.typeMarketing,
    SUSCRIPCION: t.finanzas.typeSuscripcion,
    LEGAL: t.finanzas.typeLegal,
    OTRO: t.finanzas.typeOtro,
  };
}

export function InvoiceView({
  transaction: tx,
  agent,
  t,
  locale,
}: {
  transaction: Transaction;
  agent: Agent;
  t: Dict;
  locale: Locale;
}) {
  const isIncome = tx.category === "INGRESO";
  const docNumber = tx.id.slice(-8).toUpperCase();
  const cur = tx.currency as "USD" | "DOP";
  const currencyWord =
    cur === "USD" ? t.finanzas.wordsDollars : t.finanzas.wordsPesos;
  const cents = String(Math.round((tx.amount % 1) * 100)).padStart(2, "0");
  const amountInWords = t.finanzas.amountInWordsTemplate
    .replace("{words}", numberToWords(Math.floor(tx.amount)))
    .replace("{currency}", currencyWord)
    .replace("{cents}", cents);
  const dateFnsLocale = locale === "en" ? enUS : es;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-secondary/30 print:bg-white">
      {/* Action bar — hidden on print */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-[820px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              estaila<span className="text-primary">.</span>
            </span>
          </div>
          <Button onClick={handlePrint} variant="ink">
            <Printer className="mr-2 h-4 w-4" />
            {t.finanzas.printSavePdf}
          </Button>
        </div>
      </div>

      {/* Document */}
      <div className="mx-auto max-w-[820px] px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <article className="rounded-2xl border border-border bg-card p-10 shadow-sm print:rounded-none print:border-0 print:p-12 print:shadow-none">
          {/* Header — number + date + status */}
          <div className="flex items-start justify-between border-b border-border pb-7">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {isIncome ? t.finanzas.incomeReceiptTitle : t.finanzas.expenseVoucherTitle}
              </p>
              <h1 className="mt-2 font-mono text-2xl font-bold tabular-nums">
                #{docNumber}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.finanzas.issuedOn}{" "}
                {format(new Date(tx.date), t.finanzas.dateFormatLong, {
                  locale: dateFnsLocale,
                })}
              </p>
            </div>
            <StatusPill status={tx.status} t={t} />
          </div>

          {/* Parties — issued by */}
          <div className="grid grid-cols-1 gap-6 border-b border-border py-7 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t.finanzas.issuedBy}
              </p>
              <p className="text-base font-semibold">{agent.name}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {agent.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {agent.email}
                  </p>
                )}
                {agent.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {agent.phone}
                  </p>
                )}
                {agent.location && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {agent.location}
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t.finanzas.receivedBy}
              </p>
              <p className="text-base font-semibold text-muted-foreground">
                _______________________________
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.finanzas.clientNameHint}
              </p>
            </div>
          </div>

          {/* Property reference */}
          {tx.propertyTitle && (
            <div className="border-b border-border py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t.finanzas.property}
              </p>
              <p className="mt-2 text-sm font-medium">{tx.propertyTitle}</p>
              {(tx.propertyAddress || tx.propertyLocation) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tx.propertyAddress ?? tx.propertyLocation}
                </p>
              )}
            </div>
          )}

          {/* Concept + amount */}
          <div className="py-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t.finanzas.concept}
            </p>
            <div className="mt-3 flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isIncome
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-destructive/15 text-destructive"
                    )}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-lg font-semibold">{tx.concept}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {invoiceTypeLabels(t)[tx.type] ?? tx.type}
                    </p>
                  </div>
                </div>
                {tx.notes && (
                  <p className="mt-4 whitespace-pre-line rounded-lg border border-border bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
                    {tx.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "font-mono text-3xl font-bold tabular-nums",
                    isIncome ? "text-emerald-600" : "text-destructive"
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(tx.amount, cur)}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {cur}
                </p>
              </div>
            </div>
          </div>

          {/* Amount in words — legal */}
          <div className="rounded-xl border border-dashed border-border bg-background/40 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t.finanzas.amountInWords}
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed">
              {amountInWords}
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-12 grid grid-cols-1 gap-12 sm:grid-cols-2">
            <SignatureLine label={t.finanzas.issuerSignature} name={agent.name} />
            <SignatureLine label={t.finanzas.receiverSignature} />
          </div>

          {/* Footer — legal disclaimer */}
          <div className="mt-12 border-t border-border pt-5 text-center">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {t.finanzas.legalDisclaimer}
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/70">
              {t.finanzas.docWord} · {tx.id}
            </p>
          </div>
        </article>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          html,
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 0.6in;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// STATUS PILL
// ============================================================

function StatusPill({ status, t }: { status: string; t: Dict }) {
  const map: Record<
    string,
    { label: string; icon: typeof Clock; color: string }
  > = {
    PENDIENTE: {
      label: t.finanzas.statusPending,
      icon: Clock,
      color: "bg-warning/15 text-warning border-warning/30",
    },
    EN_PROGRESO: {
      label: t.finanzas.statusInProgress,
      icon: Clock,
      color: "bg-primary/15 text-primary border-primary/30",
    },
    PAGADO: {
      label: t.finanzas.statusPaid,
      icon: CheckCircle2,
      color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    },
  };
  const cfg = map[status] ?? map.PENDIENTE;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function SignatureLine({ label, name }: { label: string; name?: string }) {
  return (
    <div>
      <div className="border-b border-foreground/40 pb-1">
        {name && (
          <p className="font-mono text-xs italic text-muted-foreground">
            {name}
          </p>
        )}
      </div>
      <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
