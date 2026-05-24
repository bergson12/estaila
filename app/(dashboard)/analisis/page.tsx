import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Eye,
  MessageCircle,
  MousePointerClick,
  Send,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/shared/number-ticker";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NOW = new Date();
const MONTH_START = new Date(NOW.getFullYear(), NOW.getMonth(), 1);
const PREV_MONTH_START = new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1);
const PREV_MONTH_END = new Date(NOW.getFullYear(), NOW.getMonth(), 0, 23, 59, 59);

export default async function AnalisisPage() {
  const user = await requireUser();
  const uid = user.id;

  const [
    propsTotal,
    propsActive,
    propsPublic,
    sharesMonth,
    sharesPrev,
    leadsMonth,
    leadsPrev,
    leadsByStatus,
    viewsAgg,
    incomeMonth,
    expenseMonth,
    incomePrev,
    expensePrev,
    topProperties,
    sharesByChannel,
    recentLeads,
  ] = await Promise.all([
    prisma.property.count({ where: { userId: uid } }),
    prisma.property.count({
      where: { userId: uid, operation: { in: ["EN_VENTA", "EN_ALQUILER"] } },
    }),
    prisma.property.count({ where: { userId: uid, publicEnabled: true } }),
    prisma.propertyShare.count({
      where: { userId: uid, createdAt: { gte: MONTH_START } },
    }),
    prisma.propertyShare.count({
      where: {
        userId: uid,
        createdAt: { gte: PREV_MONTH_START, lte: PREV_MONTH_END },
      },
    }),
    prisma.lead.count({
      where: { agentId: uid, createdAt: { gte: MONTH_START } },
    }),
    prisma.lead.count({
      where: {
        agentId: uid,
        createdAt: { gte: PREV_MONTH_START, lte: PREV_MONTH_END },
      },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { agentId: uid },
      _count: true,
    }),
    prisma.property.aggregate({
      where: { userId: uid },
      _sum: { publicViews: true, shareCount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: uid,
        category: "INGRESO",
        date: { gte: MONTH_START },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: uid, category: "GASTO", date: { gte: MONTH_START } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: uid,
        category: "INGRESO",
        date: { gte: PREV_MONTH_START, lte: PREV_MONTH_END },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: uid,
        category: "GASTO",
        date: { gte: PREV_MONTH_START, lte: PREV_MONTH_END },
      },
      _sum: { amount: true },
    }),
    prisma.property.findMany({
      where: { userId: uid },
      orderBy: [{ publicViews: "desc" }, { shareCount: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        priceUSD: true,
        publicViews: true,
        shareCount: true,
        featuredPhoto: true,
        _count: { select: { leads: true, shares: true } },
      },
    }),
    prisma.propertyShare.groupBy({
      by: ["channel"],
      where: { userId: uid },
      _count: true,
      _sum: { clicks: true },
    }),
    prisma.lead.findMany({
      where: { agentId: uid },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        property: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const totalClicksAgg = await prisma.propertyShare.aggregate({
    where: { userId: uid },
    _sum: { clicks: true },
  });

  const totalShares = sharesByChannel.reduce((acc, c) => acc + c._count, 0);
  const totalClicks = totalClicksAgg._sum.clicks ?? 0;
  const totalViews = viewsAgg._sum.publicViews ?? 0;
  const totalLeads = leadsByStatus.reduce((acc, s) => acc + s._count, 0);
  const convertedLeads =
    leadsByStatus.find((s) => s.status === "CONVERTIDO")?._count ?? 0;

  const balance =
    Number(incomeMonth._sum.amount ?? 0) -
    Number(expenseMonth._sum.amount ?? 0);
  const balancePrev =
    Number(incomePrev._sum.amount ?? 0) -
    Number(expensePrev._sum.amount ?? 0);

  function pctChange(curr: number, prev: number): number | null {
    if (prev === 0) return curr > 0 ? 100 : null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const leadsChange = pctChange(leadsMonth, leadsPrev);
  const sharesChange = pctChange(sharesMonth, sharesPrev);
  const balanceChange = pctChange(balance, balancePrev);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Análisis"
        description="Funnel completo de tu CRM: del share al cierre."
      />

      {/* KPI ROW */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Propiedades activas"
          value={propsActive}
          sub={`${propsPublic} con landing pública`}
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Leads este mes"
          value={leadsMonth}
          sub={`${totalLeads} acumulado · ${convertedLeads} convertidos`}
          icon={<Users className="h-4 w-4" />}
          accent="primary"
          delta={leadsChange}
        />
        <KpiCard
          label="Shares este mes"
          value={sharesMonth}
          sub={`${totalClicks} clicks totales`}
          icon={<Send className="h-4 w-4" />}
          delta={sharesChange}
        />
        <KpiCard
          label="Balance del mes"
          stringValue={formatCurrency(balance)}
          sub={`Anterior ${formatCurrency(balancePrev)}`}
          icon={<Wallet className="h-4 w-4" />}
          accent={balance >= 0 ? "success" : "destructive"}
          delta={balanceChange}
        />
      </div>

      {/* FUNNEL */}
      <Card className="mt-6 rounded-2xl border-border p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Funnel de conversión
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              De compartir a cerrar
            </h2>
          </div>
        </div>
        <FunnelBar
          steps={[
            {
              label: "Shares",
              value: totalShares,
              icon: <Send className="h-3.5 w-3.5" />,
            },
            {
              label: "Clicks",
              value: totalClicks,
              icon: <MousePointerClick className="h-3.5 w-3.5" />,
            },
            {
              label: "Vistas",
              value: totalViews,
              icon: <Eye className="h-3.5 w-3.5" />,
            },
            {
              label: "Leads",
              value: totalLeads,
              icon: <MessageCircle className="h-3.5 w-3.5" />,
            },
            {
              label: "Convertidos",
              value: convertedLeads,
              icon: <TrendingUp className="h-3.5 w-3.5" />,
            },
          ]}
        />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* TOP PROPERTIES */}
        <Card className="rounded-2xl border-border p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Top performing
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight">
                Propiedades con más tracción
              </h2>
            </div>
            <Link
              href="/propiedades"
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
            >
              Ver todas
            </Link>
          </div>
          {topProperties.length === 0 ? (
            <EmptyMini text="Sin propiedades aún. Crea la primera." />
          ) : (
            <ul className="space-y-2">
              {topProperties.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/propiedades/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-background"
                  >
                    {p.featuredPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.featuredPhoto}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {p.location ?? "—"} ·{" "}
                        {formatCurrency(Number(p.priceUSD ?? 0))}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-4 text-right">
                      <Stat label="vistas" value={p.publicViews} />
                      <Stat label="shares" value={p._count.shares} />
                      <Stat label="leads" value={p._count.leads} accent="primary" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* CHANNEL BREAKDOWN */}
        <Card className="rounded-2xl border-border p-6">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Canales
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              Shares por canal
            </h2>
          </div>
          {sharesByChannel.length === 0 ? (
            <EmptyMini text="Aún no has compartido propiedades." />
          ) : (
            <ul className="space-y-2.5">
              {[...sharesByChannel]
                .sort((a, b) => b._count - a._count)
                .map((c) => {
                  const pct =
                    totalShares > 0
                      ? Math.round((c._count / totalShares) * 100)
                      : 0;
                  return (
                    <li key={c.channel}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">
                          {channelLabel(c.channel)}
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {c._count} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        {/* RECENT LEADS */}
        <Card className="rounded-2xl border-border p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Pipeline
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight">
                Leads recientes
              </h2>
            </div>
            <Link
              href="/pipeline"
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
            >
              Ir a pipeline
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyMini text="Cuando alguien llene el formulario de una landing aparece aquí." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Nombre</th>
                    <th className="px-3 py-2 text-left font-medium">Contacto</th>
                    <th className="px-3 py-2 text-left font-medium">Propiedad</th>
                    <th className="px-3 py-2 text-left font-medium">Estado</th>
                    <th className="px-3 py-2 text-right font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-border last:border-0 hover:bg-card/40"
                    >
                      <td className="px-3 py-2.5 font-medium">{l.name}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {l.whatsapp ?? l.email ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {l.property?.slug ? (
                          <Link
                            href={`/propiedad/${l.property.slug}`}
                            target="_blank"
                            className="truncate text-primary hover:underline"
                          >
                            {l.property.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full border-border text-[10px]",
                            l.status === "CONVERTIDO" &&
                              "border-success/40 bg-success/15 text-success",
                            l.status === "NUEVO" &&
                              "border-primary/30 bg-primary/10 text-primary"
                          )}
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {new Date(l.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ===========================================================================

function channelLabel(c: string) {
  return (
    {
      WHATSAPP: "WhatsApp",
      EMAIL: "Email",
      FACEBOOK: "Facebook",
      INSTAGRAM: "Instagram",
      LINKEDIN: "LinkedIn",
      COPY_LINK: "Link directo",
      QR: "QR",
    }[c] ?? c
  );
}

function KpiCard({
  label,
  value,
  stringValue,
  sub,
  icon,
  accent,
  delta,
}: {
  label: string;
  value?: number;
  stringValue?: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: "primary" | "success" | "destructive";
  delta?: number | null;
}) {
  const accentText =
    accent === "primary"
      ? "text-primary"
      : accent === "success"
        ? "text-success"
        : accent === "destructive"
          ? "text-destructive"
          : "";
  const deltaPositive = delta != null && delta > 0;
  const deltaNegative = delta != null && delta < 0;

  return (
    <Card className="rounded-2xl border-border p-5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight",
          accentText
        )}
      >
        {stringValue ?? (value != null ? <NumberTicker value={value} /> : "—")}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
        {sub && <span className="truncate text-muted-foreground">{sub}</span>}
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono font-semibold tabular-nums",
              deltaPositive && "bg-emerald-500/15 text-emerald-600",
              deltaNegative && "bg-destructive/15 text-destructive",
              !deltaPositive &&
                !deltaNegative &&
                "bg-secondary text-muted-foreground"
            )}
          >
            {deltaPositive ? (
              <ArrowUpRight className="h-2.5 w-2.5" />
            ) : deltaNegative ? (
              <ArrowDownRight className="h-2.5 w-2.5" />
            ) : null}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </Card>
  );
}

function FunnelBar({
  steps,
}: {
  steps: { label: string; value: number; icon: React.ReactNode }[];
}) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        const dropPct =
          i > 0 && steps[i - 1].value > 0
            ? Math.round((s.value / steps[i - 1].value) * 100)
            : null;
        return (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-background/40 p-3"
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {s.icon}
                {s.label}
              </span>
              {dropPct != null && (
                <span className="font-mono tabular-nums text-muted-foreground/70">
                  {dropPct}%
                </span>
              )}
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
              <NumberTicker value={s.value} />
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "primary";
}) {
  return (
    <div className="text-right">
      <p
        className={cn(
          "font-mono text-sm font-semibold tabular-nums",
          accent === "primary" && "text-primary"
        )}
      >
        {value}
      </p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="max-w-[36ch] text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
