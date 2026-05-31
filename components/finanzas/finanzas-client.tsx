"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  MoreHorizontal,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
  CheckCircle2,
  Wallet,
  Layers,
  ScanLine,
  X,
} from "lucide-react";
import { GeneratingBar } from "@/components/shared/generating-bar";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatCurrency } from "@/lib/utils";
import {
  createTransaction,
  deleteTransaction,
  updateTransactionStatus,
  scanReceipt,
} from "@/lib/actions/transaction";
import { compressImage } from "@/lib/compress-image";
import { TransactionDetailDialog } from "./transaction-detail-dialog";
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

// Valores de subtipo (DB enum). Las etiquetas visibles salen del diccionario
// i18n vía `typeLabel(t, value)` dentro de cada componente.
const TYPE_VALUES = [
  "RESERVA",
  "COMISION",
  "MANTENIMIENTO",
  "PUBLICIDAD",
  "MARKETING",
  "SUSCRIPCION",
  "LEGAL",
  "OTRO",
] as const;

const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "bg-muted text-muted-foreground",
  EN_PROGRESO: "bg-amber-500/15 text-amber-400",
  PAGADO: "bg-emerald-500/15 text-emerald-400",
};

type Dict = ReturnType<typeof useT>["t"];

// Mapea el VALUE del subtipo (DB enum) a su etiqueta i18n. Claves planas.
function financeTypeLabels(t: Dict): Record<string, string> {
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

// Mapea el VALUE del estado (DB enum) a su etiqueta i18n. Claves planas.
function financeStatusLabels(t: Dict): Record<string, string> {
  return {
    PENDIENTE: t.finanzas.statusPending,
    EN_PROGRESO: t.finanzas.statusInProgress,
    PAGADO: t.finanzas.statusPaid,
  };
}

export function FinanzasClient({
  transactions,
  properties,
}: {
  transactions: Tx[];
  properties: { id: string; title: string }[];
}) {
  const { t } = useT();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [detailTx, setDetailTx] = useState<Tx | null>(null);

  const filtered = transactions.filter((t) => {
    if (filterCat !== "ALL" && t.category !== filterCat) return false;
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    return true;
  });

  // KPI calculations on ALL transactions (not filtered)
  const stats = useMemo(() => {
    const ingresos = transactions
      .filter((t) => t.category === "INGRESO")
      .reduce((s, t) => s + t.amount, 0);
    const gastos = transactions
      .filter((t) => t.category === "GASTO")
      .reduce((s, t) => s + t.amount, 0);
    const pending = transactions.filter((t) => t.status === "PENDIENTE").length;
    return { ingresos, gastos, balance: ingresos - gastos, pending };
  }, [transactions]);

  return (
    <>
      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={t.finanzas.kpiIncome}
          value={formatCurrency(stats.ingresos)}
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          accent="emerald"
        />
        <KpiCard
          label={t.finanzas.kpiExpenses}
          value={formatCurrency(stats.gastos)}
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          accent="rose"
        />
        <KpiCard
          label={t.finanzas.kpiBalance}
          value={formatCurrency(stats.balance)}
          icon={<Wallet className="h-4 w-4 text-primary" />}
          accent="primary"
        />
        <KpiCard
          label={t.finanzas.kpiPending}
          value={stats.pending.toString()}
          sub={t.finanzas.kpiPendingSub}
          icon={<CheckCircle2 className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Filters + actions */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { val: "ALL", label: t.finanzas.filterAll, count: transactions.length, Icon: Layers },
              { val: "INGRESO", label: t.finanzas.filterIncome, count: transactions.filter(t=>t.category==="INGRESO").length, Icon: ArrowDownLeft, color: "emerald" as const },
              { val: "GASTO", label: t.finanzas.filterExpenses, count: transactions.filter(t=>t.category==="GASTO").length, Icon: ArrowUpRight, color: "rose" as const },
            ]
          ).map(({ val, label, count, Icon, color }) => {
            const active = filterCat === val;
            // Active = solid filled chip with high contrast (ink-style)
            // Inactive = subtle outline pill that hovers
            const activeBg =
              color === "emerald"
                ? "bg-emerald-600 text-white border-emerald-600"
                : color === "rose"
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-ink text-ink-foreground border-ink";
            return (
              <button
                key={val}
                type="button"
                onClick={() => setFilterCat(val)}
                aria-pressed={active}
                className={cn(
                  "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? activeBg
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>{label}</span>
                <span
                  className={cn(
                    "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums",
                    active
                      ? "bg-white/20 text-current"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
          <span className="mx-2 h-4 w-px bg-border" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t.finanzas.statusAll}</SelectItem>
              <SelectItem value="PENDIENTE">{t.finanzas.statusPending}</SelectItem>
              <SelectItem value="EN_PROGRESO">{t.finanzas.statusInProgress}</SelectItem>
              <SelectItem value="PAGADO">{t.finanzas.statusPaid}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t.finanzas.newTransaction}
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t.finanzas.emptyTitle}
          description={
            transactions.length === 0
              ? t.finanzas.emptyDescNone
              : t.finanzas.emptyDescFiltered
          }
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.finanzas.newTransaction}
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">{t.finanzas.colConcept}</th>
                  <th className="px-4 py-3 text-left font-medium">{t.finanzas.colProperty}</th>
                  <th className="px-4 py-3 text-left font-medium">{t.finanzas.colCategory}</th>
                  <th className="px-4 py-3 text-left font-medium">{t.finanzas.colStatus}</th>
                  <th className="px-4 py-3 text-left font-medium">{t.finanzas.colDate}</th>
                  <th className="px-4 py-3 text-right font-medium">{t.finanzas.colAmount}</th>
                  <th className="w-8 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    t={tx}
                    onClick={() => setDetailTx(tx)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NewTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        properties={properties}
      />

      <TransactionDetailDialog
        open={!!detailTx}
        onOpenChange={(b) => !b && setDetailTx(null)}
        transaction={detailTx}
      />
    </>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: "emerald" | "rose" | "primary";
}) {
  const gradient = {
    emerald: "from-emerald-500/10",
    rose: "from-destructive/10",
    primary: "from-primary/10",
  }[accent ?? "primary"];
  return (
    <Card className="relative overflow-hidden p-4">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent",
          gradient
        )}
      />
      <div className="relative">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <p className="mt-2 font-mono text-xl font-semibold tabular-nums">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  );
}

function TransactionRow({ t: tx, onClick }: { t: Tx; onClick: () => void }) {
  const { t, locale } = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function changeStatus(status: string) {
    startTransition(async () => {
      try {
        await updateTransactionStatus(tx.id, status);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!confirm(t.finanzas.confirmDelete.replace("{concept}", tx.concept))) return;
    startTransition(async () => {
      try {
        await deleteTransaction(tx.id);
        toast.success(t.finanzas.toastDeleted);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const isIncome = tx.category === "INGRESO";
  const typeLabels = financeTypeLabels(t);
  const statusLabels = financeStatusLabels(t);

  return (
    <tr
      className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-card/50"
      onClick={(e) => {
        // Don't open detail when clicking dropdown trigger / its content
        const target = e.target as HTMLElement;
        if (target.closest("[data-row-action]")) return;
        onClick();
      }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              isIncome
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-destructive/15 text-destructive"
            )}
          >
            {isIncome ? (
              <ArrowDownLeft className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
          </div>
          <span className="font-medium">{tx.concept}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {tx.propertyTitle ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {typeLabels[tx.type] ?? tx.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium",
            STATUS_COLOR[tx.status]
          )}
        >
          {statusLabels[tx.status] ?? tx.status}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
        {format(new Date(tx.date), "d MMM yyyy", { locale: locale === "en" ? enUS : es })}
      </td>
      <td
        className={cn(
          "px-4 py-3 text-right font-mono font-semibold tabular-nums",
          isIncome ? "text-emerald-500" : "text-destructive"
        )}
      >
        {isIncome ? "+" : "−"}
        {formatCurrency(tx.amount, tx.currency as "USD" | "DOP")}
      </td>
      <td className="px-2 py-3" data-row-action>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-row-action>
            {tx.status !== "PAGADO" && (
              <DropdownMenuItem onClick={() => changeStatus("PAGADO")}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t.finanzas.markPaid}
              </DropdownMenuItem>
            )}
            {tx.status === "PENDIENTE" && (
              <DropdownMenuItem onClick={() => changeStatus("EN_PROGRESO")}>
                {t.finanzas.markInProgress}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.finanzas.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function NewTransactionDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  properties: { id: string; title: string }[];
}) {
  const { t } = useT();
  const typeLabels = financeTypeLabels(t);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  // OJO: `category` mapea a la columna DB `category` (INGRESO|GASTO) pero en la
  // UI se muestra como "Tipo". `type` mapea a la columna DB `type` (subtipo) y
  // en la UI se muestra como "Categoría". Mapeo DB intacto, etiquetas intuitivas.
  const [category, setCategory] = useState("INGRESO");
  const [type, setType] = useState("RESERVA");
  const [currency, setCurrency] = useState<"USD" | "DOP">("USD");
  const [status, setStatus] = useState("PENDIENTE");
  const [propertyId, setPropertyId] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  function resetForm() {
    setConcept("");
    setAmount("");
    setNotes("");
    setPropertyId("");
    setCategory("INGRESO");
    setType("RESERVA");
    setStatus("PENDIENTE");
    setDate(new Date().toISOString().slice(0, 10));
    setReceiptUrl(null);
    setScanning(false);
  }

  async function onPickReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    try {
      const compressed = await compressImage(file, "default");
      const fd = new FormData();
      fd.append("file", compressed);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error ?? t.finanzas.toastUploadError);
      setReceiptUrl(upData.url as string);

      const r = await scanReceipt(upData.url as string);
      if (r.ok) {
        setCategory(r.data.flujo ?? "GASTO"); // el OCR detecta ingreso/gasto
        if (r.data.concepto) setConcept(r.data.concepto);
        if (r.data.monto != null) setAmount(String(r.data.monto));
        if (r.data.moneda) setCurrency(r.data.moneda);
        if (r.data.fecha) setDate(r.data.fecha);
        if (r.data.categoria) setType(r.data.categoria);
        if (r.data.notes) setNotes(r.data.notes);
        toast.success(t.finanzas.toastReceiptScanned);
      } else {
        toast.error(r.error);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setScanning(false);
    }
  }

  async function onSubmit() {
    if (!concept.trim()) {
      toast.error(t.finanzas.toastConceptRequired);
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error(t.finanzas.toastAmountRequired);
      return;
    }
    setSubmitting(true);
    try {
      await createTransaction({
        concept: concept.trim(),
        amount: Number(amount),
        category,
        type,
        currency,
        status,
        propertyId: propertyId || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
        // Mediodía local para evitar que el huso horario corra el día.
        date: date ? new Date(`${date}T12:00:00`) : undefined,
      });
      toast.success(t.finanzas.toastCreated);
      onOpenChange(false);
      resetForm();
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isIngreso = category === "INGRESO";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle>{t.finanzas.newTransaction}</DialogTitle>
        </DialogHeader>

        {/* Cuerpo con scroll interno: el footer nunca queda inaccesible */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* OCR: escanear factura con IA (Gemini) → autocompleta campos */}
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            {receiptUrl ? (
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 shrink-0 rounded-md border border-border bg-cover bg-center"
                  style={{ backgroundImage: `url(${JSON.stringify(receiptUrl)})` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">
                    {scanning ? t.finanzas.scanReadingTitle : t.finanzas.scanAttachedTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {scanning
                      ? t.finanzas.scanReadingSub
                      : t.finanzas.scanAttachedSub}
                  </p>
                  {scanning && <GeneratingBar durationMs={9000} className="mt-2" />}
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  disabled={scanning}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card disabled:opacity-50"
                  aria-label={t.finanzas.removeReceipt}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3",
                  scanning && "pointer-events-none opacity-60"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onPickReceipt}
                  disabled={scanning}
                />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  {scanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ScanLine className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{t.finanzas.scanTitle}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.finanzas.scanHint}
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Tipo: segmentado Ingreso / Gasto */}
          <Field label={t.finanzas.fieldType}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("INGRESO")}
                aria-pressed={isIngreso}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  isIngreso
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                    : "border-border text-muted-foreground hover:bg-card/50"
                )}
              >
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                {t.finanzas.income}
              </button>
              <button
                type="button"
                onClick={() => setCategory("GASTO")}
                aria-pressed={!isIngreso}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  !isIngreso
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-500"
                    : "border-border text-muted-foreground hover:bg-card/50"
                )}
              >
                <ArrowDownLeft className="h-4 w-4" strokeWidth={2} />
                {t.finanzas.expense}
              </button>
            </div>
          </Field>

          <Field label={t.finanzas.fieldConcept}>
            <Input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={t.finanzas.conceptPlaceholder}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t.finanzas.fieldAmount}>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="font-mono tabular-nums"
                />
                <Select
                  value={currency}
                  onValueChange={(v) => setCurrency(v as "USD" | "DOP")}
                >
                  <SelectTrigger className="w-[5.5rem] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="DOP">DOP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Field>
            <Field label={t.finanzas.fieldDate}>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono tabular-nums"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t.finanzas.fieldCategory}>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {typeLabels[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.finanzas.fieldStatus}>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">{t.finanzas.statusPending}</SelectItem>
                  <SelectItem value="EN_PROGRESO">{t.finanzas.statusInProgress}</SelectItem>
                  <SelectItem value="PAGADO">{t.finanzas.statusPaid}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t.finanzas.fieldProperty}>
            <Select
              value={propertyId || "__none"}
              onValueChange={(v) => setPropertyId(v === "__none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.finanzas.noProperty} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">{t.finanzas.noProperty}</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t.finanzas.fieldNotes}>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.finanzas.notesPlaceholder}
            />
          </Field>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t.finanzas.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.finanzas.createTransaction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
