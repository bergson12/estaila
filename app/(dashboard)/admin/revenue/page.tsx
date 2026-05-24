import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, UserPlus } from "lucide-react";
import { getRevenueAnalytics, getMetrics } from "@/lib/actions/admin";
import { RevenueChart } from "@/components/admin/revenue-chart";

export default async function AdminRevenuePage() {
  const [data, m] = await Promise.all([getRevenueAnalytics(), getMetrics()]);
  const totalRevenue90 = data.daily.reduce((sum, d) => sum + d.total, 0);
  const avgDaily = totalRevenue90 / 90;
  const totalSignups90 = data.signups.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <PageHeader
        title="Revenue & cohortes"
        description="Vista financiera de los últimos 90 días"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label="MRR actual"
          value={`$${data.mrr.toLocaleString()}`}
          sub={`${m.plans.PRO ?? 0} Pro + ${m.plans.TEAM ?? 0} Team`}
        />
        <KpiCard
          icon={TrendingUp}
          label="ARR proyectado"
          value={`$${data.arr.toLocaleString()}`}
          sub="MRR × 12"
        />
        <KpiCard
          icon={Calendar}
          label="Revenue 90 días"
          value={`$${totalRevenue90.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          sub={`Promedio diario $${avgDaily.toFixed(2)}`}
        />
        <KpiCard
          icon={UserPlus}
          label="Signups 90 días"
          value={totalSignups90.toLocaleString()}
          sub={`Promedio ${(totalSignups90 / 90).toFixed(1)}/día`}
        />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Revenue diario (90 días)
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Suscripciones recurrentes + paquetes de créditos one-time
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <Legend color="#10b981" label="Suscripciones" />
            <Legend color="#8b5cf6" label="Packs de créditos" />
          </div>
        </div>
        <RevenueChart data={data.daily} />
      </Card>

      <Card className="mt-4 p-5">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" />
            Signups por día
          </h3>
        </div>
        <SignupChart data={data.signups} />
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function SignupChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-32 items-end gap-px">
      {data.map((d) => {
        const h = (d.count / max) * 100;
        return (
          <div
            key={d.day}
            className="group relative flex-1 transition-colors"
            title={`${d.day}: ${d.count} signups`}
          >
            <div
              className="w-full rounded-sm bg-primary/60 transition-all hover:bg-primary"
              style={{ height: `${h}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
