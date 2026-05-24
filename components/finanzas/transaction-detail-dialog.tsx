"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
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

const STATUS_OPTIONS = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROGRESO", label: "En progreso" },
  { value: "PAGADO", label: "Pagado" },
];

const STATUS_STYLE: Record<string, string> = {
  PENDIENTE: "bg-warning/15 text-warning border-warning/30",
  EN_PROGRESO: "bg-primary/15 text-primary border-primary/30",
  PAGADO: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  PAGADO: "Pagado",
};

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction: t,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  transaction: Tx | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sendOpen, setSendOpen] = useState(false);

  if (!t) return null;

  const isIncome = t.category === "INGRESO";
  const docNumber = t.id.slice(-8).toUpperCase();
  const invoiceUrl = `/i/${t.id}`;

  function changeStatus(status: string) {
    if (!t) return;
    startTransition(async () => {
      try {
        await updateTransactionStatus(t.id, status);
        toast.success(`Marcada como ${STATUS_LABEL[status]?.toLowerCase()}`);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!t) return;
    if (!confirm(`¿Eliminar "${t.concept}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTransaction(t.id);
        toast.success("Eliminada");
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
                  {t.concept}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  #{docNumber} · {t.type.replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalle de transacción {t.concept}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5">
            {/* Hero amount */}
            <div className="mb-6 flex items-end justify-between gap-3 rounded-xl border border-border bg-background/40 p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Monto
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-3xl font-bold tabular-nums",
                    isIncome ? "text-emerald-600" : "text-destructive"
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(t.amount, t.currency as "USD" | "DOP")}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {t.currency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha
                </p>
                <p className="mt-1 font-mono text-sm font-medium tabular-nums">
                  {format(new Date(t.date), "d MMM yyyy", { locale: es })}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(t.date), "EEEE", { locale: es })}
                </p>
              </div>
            </div>

            {/* Status — interactive */}
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estado
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    STATUS_STYLE[t.status]
                  )}
                >
                  {t.status === "PAGADO" ? (
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <Clock className="h-3 w-3" strokeWidth={2} />
                  )}
                  {STATUS_LABEL[t.status]}
                </span>
                <Select
                  value={t.status}
                  onValueChange={changeStatus}
                  disabled={pending}
                >
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue placeholder="Cambiar a..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value} disabled={s.value === t.status}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property */}
            {t.propertyTitle && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Propiedad
                  </p>
                  <Link
                    href={`/propiedades/${t.propertyId}`}
                    className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium hover:text-primary"
                  >
                    {t.propertyTitle}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                </div>
              </div>
            )}

            {/* Notes */}
            {t.notes && (
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Notas
                </p>
                <p className="whitespace-pre-line rounded-xl border border-border bg-background/40 p-3 text-sm leading-relaxed">
                  {t.notes}
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
              Eliminar
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Imprimir
                </Link>
              </Button>
              <Button
                variant="ink"
                size="sm"
                onClick={() => setSendOpen(true)}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Enviar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendInvoiceDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        transaction={t}
      />
    </>
  );
}
