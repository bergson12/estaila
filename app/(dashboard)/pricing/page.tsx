import {
  AlertTriangle,
  Check,
  Crown,
  Settings2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { isPayPalConfigured } from "@/lib/paypal";
import { isLemonConfigured } from "@/lib/lemonsqueezy";
import { CREDIT_PACKS } from "@/lib/billing-config";
import {
  startSubscriptionAction,
  buyCreditPackAction,
  cancelSubscriptionAction,
} from "@/lib/actions/billing";
import {
  startLemonSubscriptionAction,
  buyLemonPackAction,
  cancelLemonSubscriptionAction,
  openLemonPortalAction,
} from "@/lib/actions/billing-lemon";
import { PricingCycleClient } from "./cycle-client";

type PlanKey = "FREE" | "PRO" | "TEAM" | "AGENCY";

// Display names align with landing: PRO key → "Solo", TEAM key → "Pro", AGENCY key → "Agency" (custom)
const PLANS = [
  {
    key: "FREE" as const,
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    credits: 5,
    icon: Sparkles,
    description: "Para probar el CRM y Studio IA sin compromiso",
    features: [
      "CRM básico",
      "5 créditos IA / mes",
      "Hasta 10 propiedades",
      "1 plantilla de portal",
      "Marca de agua",
    ],
  },
  {
    key: "PRO" as const,
    name: "Solo",
    priceMonthly: 15,
    priceYearly: 144, // ~20% off (12/mo annual equivalent)
    credits: 60,
    icon: Zap,
    description: "Agente independiente que cierra ventas cada mes",
    features: [
      "CRM completo",
      "60 créditos IA / mes",
      "Propiedades ilimitadas",
      "4 plantillas básicas",
      "Sin marca de agua",
      "Soporte chat",
    ],
  },
  {
    key: "TEAM" as const,
    name: "Pro",
    priceMonthly: 39,
    priceYearly: 374, // ~20% off
    credits: 200,
    icon: Crown,
    description: "Pro features con branding y dominio propio",
    features: [
      "Todo en Solo",
      "200 créditos IA / mes",
      "6 plantillas premium",
      "Dominio propio",
      "Branding completo",
      "Marketing IA + posts",
      "Soporte prioritario",
    ],
    featured: true,
  },
  {
    key: "AGENCY" as const,
    name: "Agency",
    priceMonthly: 199,
    priceYearly: 1908, // ~20% off
    credits: 99999,
    icon: Users,
    description: "Equipos y agencias con white-label + API",
    isCustom: false,
    features: [
      "Todo en Pro",
      "Créditos IA ilimitados",
      "Multi-usuario (5+)",
      "White-label completo",
      "API + Webhooks",
      "Onboarding 1:1",
      "Account manager",
    ],
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
      credits: true,
      planActive: true,
      paypalSubId: true,
      lsSubId: true,
      billingProvider: true,
    },
  });
  const sp = await searchParams;
  const cycle: "monthly" | "yearly" =
    sp.cycle === "yearly" ? "yearly" : "monthly";
  const currentPlan = (dbUser?.plan ?? "FREE") as PlanKey;
  const lsReady = isLemonConfigured();
  const ppReady = isPayPalConfigured();
  const noProvider = !lsReady && !ppReady;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Planes y créditos"
        description="Elige el plan que se adapta a tu volumen. Cancela cuando quieras."
      />

      {/* Current plan banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-muted-foreground">Plan actual:</span>{" "}
          <span className="font-semibold">{currentPlan}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Créditos:</span>{" "}
          <span className="font-mono font-semibold tabular-nums">
            {dbUser?.credits ?? 0}
          </span>
          {dbUser?.billingProvider === "LEMONSQUEEZY" && dbUser?.lsSubId && (
            <Badge variant="outline" className="ml-1 text-[10px]">
              Lemon Squeezy
            </Badge>
          )}
          {dbUser?.billingProvider === "PAYPAL" && dbUser?.paypalSubId && (
            <Badge variant="outline" className="ml-1 text-[10px]">
              PayPal
            </Badge>
          )}
          {dbUser?.planActive === false && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600">
              Pendiente
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dbUser?.lsSubId && (
            <>
              <form action={openLemonPortalAction}>
                <Button type="submit" variant="ghost" size="sm" className="text-xs">
                  <Settings2 className="mr-1 h-3 w-3" />
                  Administrar
                </Button>
              </form>
              <form action={cancelLemonSubscriptionAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-rose-600"
                >
                  Cancelar
                </Button>
              </form>
            </>
          )}
          {dbUser?.paypalSubId && !dbUser?.lsSubId && (
            <form action={cancelSubscriptionAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-rose-600"
              >
                Cancelar suscripción
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Cycle toggle (LS-only) */}
      {lsReady && (
        <div className="mb-8 flex items-center justify-center">
          <PricingCycleClient cycle={cycle} />
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const isCurrent = p.key === currentPlan;
          const isFree = p.key === "FREE";
          const price =
            cycle === "yearly" && lsReady ? p.priceYearly : p.priceMonthly;
          const priceLabel =
            cycle === "yearly" && lsReady ? "/año" : "/mes";

          const isCustom = "isCustom" in p && p.isCustom === true;
          return (
            <Card
              key={p.key}
              className={`relative p-7 ${
                p.featured ? "border-primary/50 shadow-lg shadow-primary/10" : ""
              } ${isCurrent ? "ring-2 ring-primary/40" : ""}`}
            >
              {p.featured && !isCurrent && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary">
                  Más popular
                </Badge>
              )}
              {isCurrent && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white hover:bg-emerald-600">
                  Plan actual
                </Badge>
              )}
              <div className="mb-1 flex items-center gap-2">
                <p.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {p.name}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                {isCustom ? (
                  <span className="font-mono text-3xl font-bold tracking-tight">
                    Custom
                  </span>
                ) : (
                  <>
                    <span className="font-mono text-4xl font-bold tabular-nums">
                      US${price}
                    </span>
                    <span className="text-sm text-muted-foreground">{priceLabel}</span>
                  </>
                )}
              </div>
              {cycle === "yearly" && !isFree && !isCustom && lsReady && (
                <p className="mt-1 text-[11px] text-emerald-600">
                  Ahorras US${p.priceMonthly * 12 - p.priceYearly}/año
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {p.description}
              </p>

              {isCurrent ? (
                <Button className="mt-5 w-full" variant="outline" disabled>
                  Tu plan actual
                </Button>
              ) : isFree ? (
                <Button className="mt-5 w-full" variant="outline" disabled>
                  Gratis
                </Button>
              ) : isCustom ? (
                <Button asChild className="mt-5 w-full" variant="outline">
                  <a href="mailto:ventas@estaila.com?subject=Plan%20Agency">
                    Hablar con ventas
                  </a>
                </Button>
              ) : (
                <div className="mt-5 space-y-2">
                  {/* Primary: Lemon Squeezy */}
                  {lsReady && (
                    <form action={startLemonSubscriptionAction}>
                      <input type="hidden" name="plan" value={p.key} />
                      <input type="hidden" name="cycle" value={cycle} />
                      <Button
                        type="submit"
                        className="w-full"
                        variant={p.featured ? "default" : "outline"}
                      >
                        Suscribirme a {p.name}
                      </Button>
                    </form>
                  )}
                  {/* Fallback: PayPal */}
                  {ppReady && (
                    <form action={startSubscriptionAction}>
                      <input type="hidden" name="plan" value={p.key} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        Pagar con PayPal
                      </Button>
                    </form>
                  )}
                  {!lsReady && !ppReady && (
                    <Button variant="outline" className="w-full" disabled>
                      Pagos no configurados
                    </Button>
                  )}
                </div>
              )}

              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Credit packs */}
      <div className="mt-12">
        <h2 className="mb-1 text-lg font-semibold">
          ¿Necesitas más créditos puntuales?
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Compra packs one-time sin cambiar de plan. Se suman a tus créditos.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className="flex items-center justify-between p-5 transition-colors hover:border-primary/40"
            >
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {pack.credits}
                </p>
                <p className="text-xs text-muted-foreground">créditos</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-semibold tabular-nums">
                  US${pack.priceUSD}
                </p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  {lsReady && (
                    <form action={buyLemonPackAction}>
                      <input type="hidden" name="packId" value={pack.id} />
                      <Button
                        type="submit"
                        variant="default"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        Comprar
                      </Button>
                    </form>
                  )}
                  {ppReady && !lsReady && (
                    <form action={buyCreditPackAction}>
                      <input type="hidden" name="packId" value={pack.id} />
                      <Button
                        type="submit"
                        variant="default"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        Comprar
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {noProvider && (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="text-muted-foreground">
            <p className="font-medium text-foreground">
              Ningún proveedor de pago configurado
            </p>
            <p className="mt-1">
              Configura{" "}
              <code className="rounded bg-muted px-1 text-[11px]">
                LEMONSQUEEZY_*
              </code>{" "}
              o{" "}
              <code className="rounded bg-muted px-1 text-[11px]">PAYPAL_*</code>{" "}
              en{" "}
              <code className="rounded bg-muted px-1 text-[11px]">.env</code>{" "}
              para activar pagos.
            </p>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {lsReady
          ? "Procesado por Lemon Squeezy (Merchant of Record) · Cancela cuando quieras"
          : "Procesado por PayPal · Cancela en cualquier momento"}
      </p>
    </div>
  );
}
