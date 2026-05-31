import {
  ArrowRight,
  Building2,
  Calendar,
  Wallet,
  TrendingUp,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/shared/number-ticker";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getDict, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [t, locale] = await Promise.all([getDict(), getLocale()]);

  const [
    onboardingStatus,
    propsCount,
    activeProps,
    todayAppts,
    pendingPipeline,
    monthIncome,
    monthExpense,
    recentProps,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { onboardedAt: true },
    }),
    prisma.property.count({ where: { userId: user.id } }),
    prisma.property.count({
      where: { userId: user.id, operation: { in: ["EN_VENTA", "EN_ALQUILER"] } },
    }),
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDIENTE", "EN_CURSO"] },
      },
      orderBy: { startAt: "asc" },
      take: 4,
      include: { property: { select: { title: true } } },
    }),
    prisma.pipelineCard.aggregate({
      where: {
        userId: user.id,
        stage: { in: ["NUEVO", "CONTACTADO", "VISITA", "NEGOCIACION"] },
      },
      _sum: { value: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        userId: user.id,
        category: "INGRESO",
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: user.id,
        category: "GASTO",
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    prisma.property.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        priceUSD: true,
        operation: true,
        category: true,
        featuredPhoto: true,
        location: true,
      },
    }),
  ]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t.home.greetingMorning;
    if (h < 19) return t.home.greetingAfternoon;
    return t.home.greetingEvening;
  })();
  const firstName = user.name.split(" ")[0];
  const balance =
    Number(monthIncome._sum.amount ?? 0) - Number(monthExpense._sum.amount ?? 0);
  const needsOnboarding = !onboardingStatus?.onboardedAt;

  return (
    <div className="mx-auto max-w-7xl">
      {needsOnboarding && (
        <Link
          href="/onboarding"
          className="group mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 transition-colors hover:border-primary/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t.home.setupTitle}</p>
              <p className="text-xs text-muted-foreground">
                {t.home.setupSteps}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5">
            {t.home.continue}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </Link>
      )}

      {/* ============================================================ */}
      {/* HERO CARD-SHELL — Arto+ inspired editorial premium             */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 md:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {new Date().toLocaleDateString(
                  locale === "en" ? "en-US" : "es-ES",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }
                )}
              </p>
              <h1 className="mt-2 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.025em] sm:text-5xl md:text-6xl">
                {greeting},{" "}
                <span
                  className="italic text-primary"
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontWeight: 500,
                  }}
                >
                  {firstName}
                </span>
                <span className="ml-2 inline-block align-middle text-3xl sm:text-4xl">
                  👋
                </span>
              </h1>
              <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground sm:text-base">
                {t.home.heroPrefix}{" "}
                <strong className="text-foreground">{todayAppts.length}</strong>{" "}
                {todayAppts.length === 1 ? t.home.apptSingular : t.home.apptPlural}{" "}
                {t.home.heroAnd}{" "}
                <strong className="text-foreground">
                  {pendingPipeline._count}
                </strong>{" "}
                {pendingPipeline._count === 1
                  ? t.home.dealSingular
                  : t.home.dealPlural}
                . {t.home.heroSuffix}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/studio"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-card/60 active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                {t.nav["/studio"]}
              </Link>
              <Link
                href="/propiedades/nueva"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-ink-foreground transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {t.home.newProperty}
              </Link>
            </div>
          </div>

          {/* Hero KPI strip — Arto+ style large numeric */}
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            <HeroKpi
              label={t.home.kpiProperties}
              numeric={propsCount}
              sub={`${activeProps} ${t.home.activeWord}`}
              icon={<Building2 className="h-3.5 w-3.5" />}
            />
            <HeroKpi
              label={t.home.kpiAppointments}
              numeric={todayAppts.length}
              sub={t.home.pendingInProgress}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
            <HeroKpi
              label={t.home.kpiPipeline}
              numeric={pendingPipeline._count}
              sub={`${t.home.potential} ${formatCurrency(
                Number(pendingPipeline._sum.value ?? 0)
              )}`}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              accent="primary"
            />
            <HeroKpi
              label={t.home.monthBalance}
              value={formatCurrency(balance)}
              sub={`+${formatCurrency(
                Number(monthIncome._sum.amount ?? 0)
              )} / −${formatCurrency(Number(monthExpense._sum.amount ?? 0))}`}
              icon={<Wallet className="h-3.5 w-3.5" />}
              accent={balance >= 0 ? "success" : "destructive"}
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECONDARY PANELS                                              */}
      {/* ============================================================ */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Agenda */}
        <Card className="rounded-2xl border-border lg:col-span-2 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{t.home.agenda}</h2>
              <p className="text-xs text-muted-foreground">{t.home.upcomingAppointments}</p>
            </div>
            <Link
              href="/agenda"
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
            >
              {t.home.seeAll}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{t.home.noAppts}</p>
              <p className="max-w-[28ch] text-xs text-muted-foreground">
                {t.home.noApptsHint}
              </p>
              <Link
                href="/agenda"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3 w-3" />
                {t.home.newAppt}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {todayAppts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-background"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(a.startAt)}
                      {a.property?.title && ` · ${a.property.title}`}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      a.status === "EN_CURSO"
                        ? "rounded-full bg-warning/15 text-warning"
                        : "rounded-full"
                    }
                  >
                    {a.status === "EN_CURSO" ? t.home.inProgress : t.home.pending}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent properties */}
        <Card className="rounded-2xl border-border p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{t.home.recent}</h2>
              <p className="text-xs text-muted-foreground">{t.home.recentProperties}</p>
            </div>
            <Link
              href="/propiedades"
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
            >
              {t.home.seeAll}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentProps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{t.home.noProps}</p>
              <p className="max-w-[24ch] text-xs text-muted-foreground">
                {t.home.noPropsHint}
              </p>
              <Link
                href="/propiedades/nueva"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3 w-3" />
                {t.home.create}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentProps.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/propiedades/${p.id}`}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-secondary"
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
                      <p className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(Number(p.priceUSD ?? 0))}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// HERO KPI — Arto+ inspired large numeric with dividers
// ============================================================

function HeroKpi({
  label,
  value,
  numeric,
  sub,
  icon,
  accent,
}: {
  label: string;
  value?: string;
  numeric?: number;
  sub?: string;
  icon: React.ReactNode;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const accentText =
    accent === "primary"
      ? "text-primary"
      : accent === "success"
        ? "text-success"
        : accent === "destructive"
          ? "text-destructive"
          : "";
  return (
    <div className="relative bg-card p-5 transition-colors hover:bg-card/60">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <p
        className={`mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight md:text-4xl ${accentText}`}
      >
        {numeric !== undefined ? <NumberTicker value={numeric} /> : value}
      </p>
      {sub && (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
