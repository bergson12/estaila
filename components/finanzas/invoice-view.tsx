"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
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

export function InvoiceView({
  transaction: t,
  agent,
}: {
  transaction: Transaction;
  agent: Agent;
}) {
  const isIncome = t.category === "INGRESO";
  const docNumber = t.id.slice(-8).toUpperCase();
  const cur = t.currency as "USD" | "DOP";
  const amountInWords = `${numberToWords(Math.floor(t.amount))} ${
    cur === "USD" ? "dólares" : "pesos"
  } con ${String(Math.round((t.amount % 1) * 100)).padStart(2, "0")}/100`;

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
            Imprimir / Guardar PDF
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
                {isIncome ? "Recibo de ingreso" : "Comprobante de gasto"}
              </p>
              <h1 className="mt-2 font-mono text-2xl font-bold tabular-nums">
                #{docNumber}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Emitido el{" "}
                {format(new Date(t.date), "d 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </p>
            </div>
            <StatusPill status={t.status} />
          </div>

          {/* Parties — issued by */}
          <div className="grid grid-cols-1 gap-6 border-b border-border py-7 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Emitido por
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
                Recibo de
              </p>
              <p className="text-base font-semibold text-muted-foreground">
                _______________________________
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Espacio para nombre del cliente (rellenar a mano si corresponde)
              </p>
            </div>
          </div>

          {/* Property reference */}
          {t.propertyTitle && (
            <div className="border-b border-border py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Propiedad
              </p>
              <p className="mt-2 text-sm font-medium">{t.propertyTitle}</p>
              {(t.propertyAddress || t.propertyLocation) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.propertyAddress ?? t.propertyLocation}
                </p>
              )}
            </div>
          )}

          {/* Concept + amount */}
          <div className="py-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Concepto
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
                    <p className="text-lg font-semibold">{t.concept}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t.type.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                </div>
                {t.notes && (
                  <p className="mt-4 whitespace-pre-line rounded-lg border border-border bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
                    {t.notes}
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
                  {formatCurrency(t.amount, cur)}
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
              Monto en letras
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed">
              {amountInWords}
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-12 grid grid-cols-1 gap-12 sm:grid-cols-2">
            <SignatureLine label="Firma del emisor" name={agent.name} />
            <SignatureLine label="Firma del receptor" />
          </div>

          {/* Footer — legal disclaimer */}
          <div className="mt-12 border-t border-border pt-5 text-center">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Este documento es un comprobante de la transacción registrada. Para
              uso administrativo y legal entre las partes. Generado por estaila.
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/70">
              Doc · {t.id}
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

function StatusPill({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; icon: typeof Clock; color: string }
  > = {
    PENDIENTE: {
      label: "Pendiente",
      icon: Clock,
      color: "bg-warning/15 text-warning border-warning/30",
    },
    EN_PROGRESO: {
      label: "En progreso",
      icon: Clock,
      color: "bg-primary/15 text-primary border-primary/30",
    },
    PAGADO: {
      label: "Pagado",
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
