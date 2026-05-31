"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

type OrgPlanCtx = {
  id: string;
  plan: string;
  maxSeats: number;
  planActive: boolean;
};

const PLAN_CARDS = [
  {
    key: "TEAM",
    name: "Team",
    price: 39,
    seats: 5,
    featured: false,
    featureKeys: [
      "featTeamSeats",
      "featTeamCredits",
      "featTeamBranding",
      "featTeamOneTeam",
    ],
  },
  {
    key: "BUSINESS",
    name: "Business",
    price: 39,
    seats: 10,
    featured: true,
    featureKeys: [
      "featBizSeats",
      "featBizCredits",
      "featBizSubteams",
      "featBizDomain",
      "featBizFullBranding",
      "featBizPrioritySupport",
    ],
  },
  {
    key: "AGENCY",
    name: "Agency",
    price: 79,
    seats: 15,
    featured: false,
    featureKeys: [
      "featAgencySeats",
      "featAgencyCredits",
      "featAgencyUnlimitedTeams",
      "featAgencyDomain",
      "featAgencyWhiteLabel",
      "featAgencyTemplates",
      "featAgencyAccountManager",
    ],
  },
] as const;

export function BillingTab({
  org,
  acceptedCount,
}: {
  org: OrgPlanCtx;
  acceptedCount: number;
}) {
  const { t } = useT();
  return (
    <div>
      {/* Current plan summary */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t.empresa.currentPlan}
            </p>
            <p className="mt-1 text-2xl font-semibold">{org.plan}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {acceptedCount} / {org.maxSeats} {t.empresa.seatsInUse}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {org.planActive ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t.empresa.statusActive}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                {t.empresa.statusInactive}
              </Badge>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">
                {t.empresa.changePlan}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Plan comparison */}
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t.empresa.plansForOrgs}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLAN_CARDS.map((p) => {
          const isCurrent = p.key === org.plan;
          return (
            <Card
              key={p.key}
              className={cn(
                "relative flex flex-col p-6",
                p.featured && !isCurrent && "border-primary/40 shadow-lg shadow-primary/10",
                isCurrent && "ring-2 ring-primary/50"
              )}
            >
              {p.featured && !isCurrent && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground hover:bg-primary">
                  <Sparkles className="mr-1 h-2.5 w-2.5" />
                  {t.empresa.recommended}
                </Badge>
              )}
              {isCurrent && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white hover:bg-emerald-600">
                  {t.empresa.currentPlanBadge}
                </Badge>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {p.name}
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                {p.price !== null ? (
                  <>
                    <span className="font-mono text-4xl font-bold tabular-nums">
                      ${p.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{t.empresa.perMonth}</span>
                  </>
                ) : (
                  <span className="font-mono text-3xl font-semibold">Custom</span>
                )}
              </div>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {p.seats} {t.empresa.seats}
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {p.featureKeys.map((fk) => (
                  <li key={fk} className="flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="text-muted-foreground">{t.empresa[fk]}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-5"
                variant={p.featured && !isCurrent ? "default" : "outline"}
                disabled={isCurrent}
              >
                <Link href="/pricing">
                  {isCurrent ? t.empresa.currentPlanBadge : `${t.empresa.changeTo} ${p.name}`}
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
