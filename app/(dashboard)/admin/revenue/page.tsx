import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, UserPlus } from "lucide-react";
import { getRevenueAnalytics, getMetrics } from "@/lib/actions/admin";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { getDict } from "@/lib/i18n/server";

export default async function AdminRevenuePage() {
  const [data, m, t] = await Promise.all([
    getRevenueAnalytics(),
    getMetrics(),
    getDict(),
  ]);
  const totalRevenue90 = data.daily.reduce((sum, d) => sum + d.total, 0);
  const avgDaily = totalRevenue90 / 90;
  const totalSignups90 = data.signups.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <PageHeader
        title={t.adminPanel.revenueTitle}
        description={t.adminPanel.revenueDescription}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label={t.adminPanel.kpiCurrentMrr}
          value={`$${data.mrr.toLocaleString()}`}
          sub={`${m.plans.PRO ?? 0} Pro + ${m.plans.TEAM ?? 0} Team`}
        />
        <KpiCard
          icon={TrendingUp}
          label={t.adminPanel.kpiProjectedArr}
          value={`$${data.arr.toLocaleString()}`}
          sub="MRR × 12"
        />
        <KpiCard
          icon={Calendar}
          label={t.adminPanel.kpiRevenue90d}
          value={`$${totalRevenue90.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          sub={`${t.adminPanel.kpiDailyAvg} $${avgDaily.toFixed(2)}`}
        />
        <KpiCard
          icon={UserPlus}
          label={t.adminPanel.kpiSignups90d}
          value={totalSignups90.toLocaleString()}
          sub={`${t.adminPanel.kpiAvgWord} ${(totalSignups90 / 90).toFixed(1)}${t.adminPanel.kpiPerDay}`}
        />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {t.adminPanel.dailyRevenue90d}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.adminPanel.dailyRevenueSub}
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <Legend color="#10b981" label={t.adminPanel.legendSubscriptions} />
            <Legend color="#8b5cf6" label={t.adminPanel.legendCreditPacks} />
          </div>
        </div>
        <RevenueChart
          data={data.daily}
          labels={{
            day: t.adminPanel.chartDay,
            subscriptions: t.adminPanel.legendSubscriptions,
            packs: t.adminPanel.chartPacks,
          }}
        />
      </Card>

      <Card className="mt-4 p-5">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" />
            {t.adminPanel.signupsPerDay}
          </h3>
        </div>
        <SignupChart data={data.signups} signupsWord={t.adminPanel.signupsWord} />
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

function SignupChart({
  data,
  signupsWord,
}: {
  data: { day: string; count: number }[];
  signupsWord: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-32 items-end gap-px">
      {data.map((d) => {
        const h = (d.count / max) * 100;
        return (
          <div
            key={d.day}
            className="group relative flex-1 transition-colors"
            title={`${d.day}: ${d.count} ${signupsWord}`}
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
