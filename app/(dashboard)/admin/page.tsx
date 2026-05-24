import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  DollarSign,
  ExternalLink,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getMetrics,
  getRevenueAnalytics,
  getActivityFeed,
  getTopUsers,
  getSystemHealth,
} from "@/lib/actions/admin";
import { PlanDonut } from "@/components/admin/plan-donut";
import { Sparkline } from "@/components/admin/sparkline";
import { ActivityFeed } from "@/components/admin/activity-feed";

export default async function AdminDashboard() {
  const [m, rev, feed, top, health] = await Promise.all([
    getMetrics(),
    getRevenueAnalytics(),
    getActivityFeed(15),
    getTopUsers(),
    getSystemHealth(),
  ]);

  // Last 14 days for sparklines
  const last14Revenue = rev.daily.slice(-14).map((d) => ({ v: d.total }));
  const last14Signups = rev.signups.slice(-14).map((d) => ({ v: d.count }));
  const revPrev14 = rev.daily.slice(-28, -14).reduce((s, d) => s + d.total, 0);
  const revLast14 = rev.daily.slice(-14).reduce((s, d) => s + d.total, 0);
  const revDelta = revPrev14 > 0
    ? Math.round(((revLast14 - revPrev14) / revPrev14) * 100)
    : revLast14 > 0
      ? 100
      : 0;

  const signupsPrev14 = rev.signups.slice(-28, -14).reduce((s, d) => s + d.count, 0);
  const signupsLast14 = rev.signups.slice(-14).reduce((s, d) => s + d.count, 0);
  const signupDelta = signupsPrev14 > 0
    ? Math.round(((signupsLast14 - signupsPrev14) / signupsPrev14) * 100)
    : signupsLast14 > 0
      ? 100
      : 0;

  const planData = (["FREE", "PRO", "TEAM"] as const)
    .map((p) => ({ plan: p, count: m.plans[p] ?? 0 }))
    .filter((p) => p.count > 0);

  return (
    <div className="space-y-6">
      {/* Hero: MRR + KPIs */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {/* MRR — featured */}
        <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Monthly Recurring Revenue
                </span>
              </div>
              <p className="mt-2 font-mono text-4xl font-bold tabular-nums">
                ${rev.mrr.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ARR proyectado:{" "}
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  ${rev.arr.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Link
                href="/admin/revenue"
                className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver gráfico →
              </Link>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                {m.plans.PRO ?? 0} PRO · {m.plans.TEAM ?? 0} TEAM
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Sparkline data={last14Revenue} color="#f59e0b" />
          </div>
        </Card>

        {/* Revenue 14d delta */}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Revenue 14 días
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums">
            ${revLast14.toFixed(2)}
          </p>
          <p
            className={`mt-1 flex items-center gap-1 text-xs font-medium ${
              revDelta > 0
                ? "text-emerald-600"
                : revDelta < 0
                  ? "text-rose-600"
                  : "text-muted-foreground"
            }`}
          >
            {revDelta > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : revDelta < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {revDelta > 0 ? "+" : ""}
            {revDelta}% vs período anterior
          </p>
          <div className="mt-2">
            <Sparkline data={last14Revenue} color="#10b981" />
          </div>
        </Card>

        {/* Signups 14d delta */}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Signups 14 días
            </span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums">
            {signupsLast14}
          </p>
          <p
            className={`mt-1 flex items-center gap-1 text-xs font-medium ${
              signupDelta > 0
                ? "text-emerald-600"
                : signupDelta < 0
                  ? "text-rose-600"
                  : "text-muted-foreground"
            }`}
          >
            {signupDelta > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : signupDelta < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {signupDelta > 0 ? "+" : ""}
            {signupDelta}% vs período anterior
          </p>
          <div className="mt-2">
            <Sparkline data={last14Signups} color="#3b82f6" />
          </div>
        </Card>
      </div>

      {/* Second row: stats + donut + health */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Card className="p-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={Users} label="Usuarios" value={m.users.toLocaleString()} />
            <MiniStat icon={Sparkles} label="Generaciones IA" value={m.gens.toLocaleString()} />
            <MiniStat icon={Wallet} label="Créditos en circulación" value={m.totalCreditsOutstanding.toLocaleString()} />
            <MiniStat icon={Zap} label="Sitios publicados" value={m.sitesPublished.toLocaleString()} />
          </div>
        </Card>

        {/* Plan distribution */}
        <Card className="p-5">
          <h3 className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Distribución por plan
          </h3>
          <PlanDonut data={planData} />
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px]">
            {planData.map((p) => (
              <div key={p.plan} className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      p.plan === "PRO"
                        ? "#3b82f6"
                        : p.plan === "TEAM"
                          ? "#8b5cf6"
                          : "hsl(var(--muted-foreground))",
                  }}
                />
                <span className="font-mono text-muted-foreground">
                  {p.plan} {p.count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* System health */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estado del sistema
          </h3>
          <div className="space-y-1.5">
            <HealthRow label="Gemini AI" ok={health.geminiConfigured} />
            <HealthRow label="PayPal" ok={health.paypalConfigured} />
            <HealthRow label="Mapbox" ok={health.mapboxConfigured} />
            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Gens 24h</span>
              <span className="font-mono font-semibold tabular-nums">
                {health.totalGens24h}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Fallas 24h</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  health.failureRate24h > 10
                    ? "text-rose-600"
                    : health.failureRate24h > 0
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {health.failedGens24h} ({health.failureRate24h}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Signups 24h</span>
              <span className="font-mono font-semibold tabular-nums">
                {health.signups24h}
                {health.signupsDelta !== 0 && (
                  <span
                    className={`ml-1 text-[9px] ${health.signupsDelta > 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {health.signupsDelta > 0 ? "+" : ""}
                    {health.signupsDelta}
                  </span>
                )}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Third row: activity + top users */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Actividad reciente
            </h3>
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver auditoría
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
          <ActivityFeed entries={feed.map(e => ({
            id: e.id,
            kind: e.kind,
            at: e.at.toISOString(),
            title: e.title,
            sub: e.sub,
            severity: e.severity,
          }))} />
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Top usuarios (gens)
          </h3>
          {top.topByActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún sin actividad
            </p>
          ) : (
            <ul className="space-y-2">
              {top.topByActivity.map((t, i) => (
                <li key={t.user.id}>
                  <Link
                    href={`/admin/users/${t.user.id}`}
                    className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="w-4 text-center font-mono text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                      {t.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {t.user.name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {t.user.plan} · {t.user.credits} créditos
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {t.gens}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {top.topByRevenue.length > 0 && (
            <>
              <h3 className="mb-2 mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Top por revenue
              </h3>
              <ul className="space-y-1">
                {top.topByRevenue.slice(0, 5).map((t) => (
                  <li key={t.user.id}>
                    <Link
                      href={`/admin/users/${t.user.id}`}
                      className="flex items-center justify-between gap-2 rounded-md p-1.5 text-xs transition-colors hover:bg-muted/50"
                    >
                      <span className="truncate">{t.user.name}</span>
                      <span className="font-mono font-semibold tabular-nums text-emerald-600">
                        ${t.revenue.toFixed(0)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickActionLink
            href="/admin/users"
            title="Gestionar usuarios"
            sub={`${m.users} cuentas activas`}
            icon={Users}
          />
          <QuickActionLink
            href="/admin/revenue"
            title="Ver revenue"
            sub="Charts MRR/ARR"
            icon={TrendingUp}
          />
          <QuickActionLink
            href="/admin/settings"
            title="Configurar plataforma"
            sub="Flags + banner"
            icon={Zap}
          />
          <QuickActionLink
            href="/admin/generations"
            title="Log generaciones"
            sub={`${health.failureRate24h}% errores 24h`}
            icon={Sparkles}
          />
        </div>
      </Card>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card/30 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={1.75} />
        <span className="text-[9px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function HealthRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {ok ? (
        <span className="inline-flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="h-3 w-3" />
          OK
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-amber-600">
          <CircleAlert className="h-3 w-3" />
          Sin config
        </span>
      )}
    </div>
  );
}

function QuickActionLink({
  href,
  title,
  sub,
  icon: Icon,
}: {
  href: string;
  title: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border bg-card/30 p-3 transition-colors hover:border-primary/40 hover:bg-card"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </Link>
  );
}
