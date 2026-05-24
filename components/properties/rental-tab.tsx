"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Key,
  Mail,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createMaintenance,
  createPayment,
  createTenant,
  deleteMaintenance,
  deletePayment,
  deleteTenant,
  generateRentSchedule,
  getRentalSummary,
  markPaymentPaid,
  updateMaintenanceStatus,
  updateTenant,
} from "@/lib/actions/rental";

type Summary = Awaited<ReturnType<typeof getRentalSummary>>;
type SubTab = "tenants" | "payments" | "maintenance";

export function RentalTab({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tab, setTab] = useState<SubTab>("tenants");
  const [pending, startTransition] = useTransition();

  async function load() {
    const data = await getRentalSummary(propertyId);
    setSummary(data);
  }

  useEffect(() => {
    load();
  }, [propertyId]);

  function refresh() {
    load();
    router.refresh();
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  const { stats } = summary;

  return (
    <div className="space-y-5">
      {/* Stats banner */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Inquilinos activos"
          value={stats.activeTenants.toString()}
          color="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Cobrado"
          value={`$${stats.totalCollected.toLocaleString()}`}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="Pendiente"
          value={`$${stats.totalPending.toLocaleString()}`}
          color={stats.lateCount > 0 ? "amber" : "primary"}
          sub={stats.lateCount > 0 ? `${stats.lateCount} en mora` : undefined}
        />
        <StatCard
          icon={Wrench}
          label="Mantenimiento"
          value={stats.openTickets.toString()}
          color={stats.openTickets > 0 ? "rose" : "primary"}
          sub={stats.openTickets > 0 ? "abiertos" : "todo bien"}
        />
      </div>

      {/* Sub-tabs */}
      <div className="border-b">
        <div className="flex items-center gap-0.5">
          {[
            { key: "tenants" as const, label: "Inquilinos", icon: Users, count: summary.tenants.length },
            { key: "payments" as const, label: "Pagos", icon: Wallet, count: summary.payments.length },
            { key: "maintenance" as const, label: "Mantenimiento", icon: Wrench, count: summary.maintenance.length },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className={cn("h-3.5 w-3.5", active && "text-primary")} strokeWidth={1.75} />
                {t.label}
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono tabular-nums">
                  {t.count}
                </span>
                {active && (
                  <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === "tenants" && (
        <TenantsPanel
          tenants={summary.tenants}
          propertyId={propertyId}
          pending={pending}
          onAction={(fn) => startTransition(async () => { await fn(); refresh(); })}
        />
      )}
      {tab === "payments" && (
        <PaymentsPanel
          payments={summary.payments}
          tenants={summary.tenants}
          propertyId={propertyId}
          pending={pending}
          onAction={(fn) => startTransition(async () => { await fn(); refresh(); })}
        />
      )}
      {tab === "maintenance" && (
        <MaintenancePanel
          tickets={summary.maintenance}
          propertyId={propertyId}
          pending={pending}
          onAction={(fn) => startTransition(async () => { await fn(); refresh(); })}
        />
      )}
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  color = "primary",
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  color?: "primary" | "emerald" | "amber" | "rose";
  sub?: string;
}) {
  const colors = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-600 bg-emerald-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    rose: "text-rose-600 bg-rose-500/10",
  };
  return (
    <Card className="p-4">
      <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md", colors[color])}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="mt-3 font-mono text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

async function handleAsync<T>(p: Promise<T>, success: string): Promise<T | null> {
  try {
    const r = await p;
    toast.success(success);
    return r;
  } catch (e) {
    toast.error((e as Error).message);
    return null;
  }
}

// ============================================================
// TENANTS PANEL
// ============================================================

function TenantsPanel({
  tenants,
  propertyId,
  pending,
  onAction,
}: {
  tenants: Summary["tenants"];
  propertyId: string;
  pending: boolean;
  onAction: (fn: () => Promise<unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tenants.length === 0 ? "Ningún inquilino registrado aún" : `${tenants.length} inquilino${tenants.length === 1 ? "" : "s"}`}
        </p>
        <TenantDialog propertyId={propertyId} onSaved={() => onAction(async () => {})}>
          <Button size="sm" disabled={pending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo inquilino
          </Button>
        </TenantDialog>
      </div>

      {tenants.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="mt-4 text-sm font-medium">Sin inquilinos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registra el primero para empezar a gestionar pagos.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tenants.map((t) => (
            <Card key={t.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{t.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      t.status === "ACTIVE"
                        ? "border-emerald-500/40 text-emerald-600"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {t.status === "ACTIVE" ? "Activo" : t.status === "PAST" ? "Pasado" : "Evicción"}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {t.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {t.phone}
                    </span>
                  )}
                  {t.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {t.email}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Desde {new Date(t.startDate).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-semibold tabular-nums">
                  ${t.monthlyRent.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.currency} / mes</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  onAction(async () => {
                    const r = await handleAsync(generateRentSchedule(t.id, 12), "12 pagos generados");
                    return r;
                  })
                }
              >
                <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                Generar 12 pagos
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  onAction(async () => {
                    if (confirm(`Eliminar inquilino ${t.name}?`)) {
                      await handleAsync(deleteTenant(t.id), "Inquilino eliminado");
                    }
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TenantDialog({
  propertyId,
  onSaved,
  children,
}: {
  propertyId: string;
  onSaved: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    monthlyRent: "",
    deposit: "",
    startDate: today,
    paymentDay: "5",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim() || !form.monthlyRent) {
      toast.error("Nombre y renta son obligatorios");
      return;
    }
    setSaving(true);
    try {
      await createTenant({
        propertyId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        monthlyRent: parseFloat(form.monthlyRent),
        deposit: form.deposit ? parseFloat(form.deposit) : null,
        startDate: form.startDate,
        paymentDay: parseInt(form.paymentDay) || 5,
        notes: form.notes || null,
      });
      toast.success("Inquilino registrado");
      setOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        monthlyRent: "",
        deposit: "",
        startDate: today,
        paymentDay: "5",
        notes: "",
      });
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo inquilino</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FieldGroup label="Nombre completo *">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Teléfono">
              <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Renta mensual *">
              <Input
                type="number"
                value={form.monthlyRent}
                onChange={(e) => set("monthlyRent", e.target.value)}
                placeholder="1500"
              />
            </FieldGroup>
            <FieldGroup label="Depósito">
              <Input
                type="number"
                value={form.deposit}
                onChange={(e) => set("deposit", e.target.value)}
                placeholder="1500"
              />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Inicio">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Día de pago">
              <Input
                type="number"
                min={1}
                max={31}
                value={form.paymentDay}
                onChange={(e) => set("paymentDay", e.target.value)}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Notas">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear inquilino"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ============================================================
// PAYMENTS PANEL
// ============================================================

function PaymentsPanel({
  payments,
  tenants,
  propertyId,
  pending,
  onAction,
}: {
  payments: Summary["payments"];
  tenants: Summary["tenants"];
  propertyId: string;
  pending: boolean;
  onAction: (fn: () => Promise<unknown>) => void;
}) {
  const statusColors: Record<string, string> = {
    PAID: "bg-emerald-500/15 text-emerald-600",
    PENDING: "bg-amber-500/15 text-amber-600",
    LATE: "bg-rose-500/15 text-rose-600",
    PARTIAL: "bg-blue-500/15 text-blue-600",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {payments.length === 0 ? "Sin pagos registrados" : `${payments.length} movimientos`}
        </p>
        <PaymentDialog
          propertyId={propertyId}
          tenants={tenants}
          onSaved={() => onAction(async () => {})}
        >
          <Button size="sm" disabled={pending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Registrar pago
          </Button>
        </PaymentDialog>
      </div>

      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="mt-4 text-sm font-medium">Sin pagos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registra un pago manual o usa &ldquo;Generar 12 pagos&rdquo; en un inquilino para crear el calendario.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Vencimiento</th>
                <th className="px-3 py-2.5">Inquilino</th>
                <th className="px-3 py-2.5">Concepto</th>
                <th className="px-3 py-2.5 text-right">Monto</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs">
                    {new Date(p.dueDate).toLocaleDateString("es", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {p.tenant?.name ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className="text-[10px]">
                      {p.concept}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-semibold tabular-nums">
                      ${p.amount.toLocaleString()}
                    </span>
                    <span className="ml-1 text-[10px] text-muted-foreground">{p.currency}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge className={cn(statusColors[p.status] ?? "bg-muted", "hover:bg-current/15")}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {p.status !== "PAID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        className="mr-1 text-xs"
                        onClick={() =>
                          onAction(async () => {
                            await handleAsync(markPaymentPaid(p.id), "Marcado pagado");
                          })
                        }
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Pagar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        onAction(async () => {
                          await handleAsync(deletePayment(p.id), "Pago eliminado");
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3 text-rose-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function PaymentDialog({
  propertyId,
  tenants,
  onSaved,
  children,
}: {
  propertyId: string;
  tenants: Summary["tenants"];
  onSaved: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    tenantId: "",
    amount: "",
    concept: "RENT",
    dueDate: today,
    paid: false,
    method: "TRANSFER",
    reference: "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.amount) {
      toast.error("Monto requerido");
      return;
    }
    setSaving(true);
    try {
      await createPayment({
        propertyId,
        tenantId: form.tenantId || null,
        amount: parseFloat(form.amount),
        concept: form.concept,
        dueDate: form.dueDate,
        paidDate: form.paid ? new Date().toISOString() : null,
        status: form.paid ? "PAID" : undefined,
        method: form.paid ? form.method : null,
        reference: form.reference || null,
      });
      toast.success("Pago registrado");
      setOpen(false);
      setForm({
        tenantId: "",
        amount: "",
        concept: "RENT",
        dueDate: today,
        paid: false,
        method: "TRANSFER",
        reference: "",
      });
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FieldGroup label="Inquilino (opcional)">
            <Select value={form.tenantId} onValueChange={(v) => set("tenantId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Monto *">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Concepto">
              <Select value={form.concept} onValueChange={(v) => set("concept", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RENT">Renta</SelectItem>
                  <SelectItem value="DEPOSIT">Depósito</SelectItem>
                  <SelectItem value="LATE_FEE">Mora</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
          <FieldGroup label="Fecha de vencimiento">
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </FieldGroup>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(e) => set("paid", e.target.checked)}
              className="h-4 w-4"
            />
            Ya está pagado
          </label>
          {form.paid && (
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Método">
                <Select value={form.method} onValueChange={(v) => set("method", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                    <SelectItem value="CARD">Tarjeta</SelectItem>
                    <SelectItem value="ZELLE">Zelle</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Referencia">
                <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} />
              </FieldGroup>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MAINTENANCE PANEL
// ============================================================

function MaintenancePanel({
  tickets,
  propertyId,
  pending,
  onAction,
}: {
  tickets: Summary["maintenance"];
  propertyId: string;
  pending: boolean;
  onAction: (fn: () => Promise<unknown>) => void;
}) {
  const PRIORITY_COLORS: Record<string, string> = {
    URGENT: "bg-rose-500/15 text-rose-600 border-rose-500/40",
    HIGH: "bg-amber-500/15 text-amber-600 border-amber-500/40",
    MEDIUM: "bg-blue-500/15 text-blue-600 border-blue-500/40",
    LOW: "bg-muted text-muted-foreground border-muted-foreground/30",
  };
  const STATUS_LABEL: Record<string, string> = {
    OPEN: "Abierto",
    IN_PROGRESS: "En proceso",
    RESOLVED: "Resuelto",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tickets.length === 0 ? "Sin tickets" : `${tickets.length} tickets`}
        </p>
        <MaintenanceDialog propertyId={propertyId} onSaved={() => onAction(async () => {})}>
          <Button size="sm" disabled={pending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo ticket
          </Button>
        </MaintenanceDialog>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <Wrench className="mx-auto h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="mt-4 text-sm font-medium">Todo en orden</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sin tickets de mantenimiento abiertos.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{t.title}</p>
                    <Badge variant="outline" className={cn("text-[9px]", PRIORITY_COLORS[t.priority])}>
                      {t.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">
                      {t.category}
                    </Badge>
                  </div>
                  {t.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                    <span>
                      Reportado{" "}
                      {new Date(t.reportedAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {t.vendor && <span>· {t.vendor}</span>}
                    {t.cost && <span>· Costo: ${Number(t.cost).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={t.status}
                    onValueChange={(v) =>
                      onAction(async () => {
                        await handleAsync(
                          updateMaintenanceStatus(t.id, v as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED"),
                          "Status actualizado"
                        );
                      })
                    }
                    disabled={pending}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"] as const).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      onAction(async () => {
                        if (confirm("Eliminar ticket?")) {
                          await handleAsync(deleteMaintenance(t.id), "Ticket eliminado");
                        }
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MaintenanceDialog({
  propertyId,
  onSaved,
  children,
}: {
  propertyId: string;
  onSaved: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
    cost: "",
    vendor: "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Título requerido");
      return;
    }
    setSaving(true);
    try {
      await createMaintenance({
        propertyId,
        title: form.title,
        description: form.description || null,
        category: form.category,
        priority: form.priority,
        cost: form.cost ? parseFloat(form.cost) : null,
        vendor: form.vendor || null,
      });
      toast.success("Ticket creado");
      setOpen(false);
      setForm({
        title: "",
        description: "",
        category: "OTHER",
        priority: "MEDIUM",
        cost: "",
        vendor: "",
      });
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo ticket de mantenimiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FieldGroup label="Título *">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej: Goteo en cocina" />
          </FieldGroup>
          <FieldGroup label="Descripción">
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Categoría">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLUMBING">Plomería</SelectItem>
                  <SelectItem value="ELECTRICAL">Eléctrico</SelectItem>
                  <SelectItem value="APPLIANCE">Electrodomésticos</SelectItem>
                  <SelectItem value="STRUCTURAL">Estructural</SelectItem>
                  <SelectItem value="CLEANING">Limpieza</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Prioridad">
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Costo estimado">
              <Input type="number" value={form.cost} onChange={(e) => set("cost", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Proveedor">
              <Input value={form.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="Plomero Juan" />
            </FieldGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
