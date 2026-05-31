"use client";

import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Printer,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteTransaction,
  updateTransactionStatus,
} from "@/lib/actions/transaction";
import { cn, formatCurrency } from "@/lib/utils";
import { SendInvoiceDialog } from "./send-invoice-dialog";
import { useT } from "@/lib/i18n/provider";

type Tx = {
  id: string;
  concept: string;
  amount: number;
  category: string;
  type: string;
  status: string;
  currency: string;
  date: Date;
  notes: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
};

const STATUS_VALUES = ["PENDIENTE", "EN_PROGRESO", "PAGADO"] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDIENTE: "bg-warning/15 text-warning border-warning/30",
  EN_PROGRESO: "bg-primary/15 text-primary border-primary/30",
  PAGADO: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

type Dict = ReturnType<typeof useT>["t"];

// Etiqueta i18n del estado (DB enum -> texto UI). Claves planas en `finanzas`.
function statusLabels(t: Dict): Record<string, string> {
  return {
    PENDIENTE: t.finanzas.statusPending,
    EN_PROGRESO: t.finanzas.statusInProgress,
    PAGADO: t.finanzas.statusPaid,
  };
}

// Etiqueta i18n del subtipo (DB enum -> texto UI). Claves planas en `finanzas`.
function typeLabels(t: Dict): Record<string, string> {
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

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction: tx,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  transaction: Tx | null;
}) {
  const { t, locale } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sendOpen, setSendOpen] = useState(false);

  if (!tx) return null;

  const statusLabel = statusLabels(t);
  const typeLabel = typeLabels(t);
  const isIncome = tx.category === "INGRESO";
  const docNumber = tx.id.slice(-8).toUpperCase();
  const invoiceUrl = `/i/${tx.id}`;

  function changeStatus(status: string) {
    if (!tx) return;
    startTransition(async () => {
      try {
        await updateTransactionStatus(tx.id, status);
        toast.success(
          t.finanzas.toastMarkedAs.replace(
            "{status}",
            statusLabel[status]?.toLowerCase() ?? status
          )
        );
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!tx) return;
    if (!confirm(t.finanzas.confirmDelete.replace("{concept}", tx.concept))) return;
    startTransition(async () => {
      try {
        await deleteTransaction(tx.id);
        toast.success(t.finanzas.toastDeletedShort);
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border bg-card/50 px-6 py-4">
            <DialogTitle className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
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
              <div className="min-w-0">
                <span className="block truncate text-lg leading-tight">
                  {tx.concept}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  #{docNumber} · {typeLabel[tx.type] ?? tx.type}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t.finanzas.detailSrTitle.replace("{concept}", tx.concept)}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5">
            {/* Hero amount */}
            <div className="mb-6 flex items-end justify-between gap-3 rounded-xl border border-border bg-background/40 p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.finanzas.amount}
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-3xl font-bold tabular-nums",
                    isIncome ? "text-emerald-600" : "text-destructive"
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(tx.amount, tx.currency as "USD" | "DOP")}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {tx.currency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.finanzas.date}
                </p>
                <p className="mt-1 font-mono text-sm font-medium tabular-nums">
                  {format(new Date(tx.date), "d MMM yyyy", { locale: locale === "en" ? enUS : es })}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(tx.date), "EEEE", { locale: locale === "en" ? enUS : es })}
                </p>
              </div>
            </div>

            {/* Status — interactive */}
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.finanzas.status}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    STATUS_STYLE[tx.status]
                  )}
                >
                  {tx.status === "PAGADO" ? (
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <Clock className="h-3 w-3" strokeWidth={2} />
                  )}
                  {statusLabel[tx.status]}
                </span>
                <Select
                  value={tx.status}
                  onValueChange={changeStatus}
                  disabled={pending}
                >
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue placeholder={t.finanzas.changeStatusPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s} disabled={s === tx.status}>
                        {statusLabel[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property */}
            {tx.propertyTitle && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.finanzas.property}
                  </p>
                  <Link
                    href={`/propiedades/${tx.propertyId}`}
                    className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium hover:text-primary"
                  >
                    {tx.propertyTitle}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                </div>
              </div>
            )}

            {/* Notes */}
            {tx.notes && (
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.finanzas.notes}
                </p>
                <p className="whitespace-pre-line rounded-xl border border-border bg-background/40 p-3 text-sm leading-relaxed">
                  {tx.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action footer */}
          <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border bg-card/40 px-6 py-3 sm:flex-row sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={pending}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {t.finanzas.delete}
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  {t.finanzas.print}
                </Link>
              </Button>
              <Button
                variant="ink"
                size="sm"
                onClick={() => setSendOpen(true)}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {t.finanzas.send}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendInvoiceDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        transaction={tx}
      />
    </>
  );
}
