"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Building2,
  Crown,
  Globe,
  Palette,
  Receipt,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { BrandingForm } from "./branding-form";
import { MembersTable } from "./members-table";
import { BillingTab } from "./billing-tab";
import { TeamsTab } from "./teams-tab";
import { DomainSection } from "./domain-section";

type OrgData = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontPair: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  plan: string;
  maxSeats: number;
  planActive: boolean;
  customDomain: string | null;
  domainVerifyToken: string | null;
  domainVerifiedAt: string | null;
  whiteLabel: boolean;
};

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string | null;
  members: {
    memberId: string;
    role: string;
    member: {
      id: string;
      userId: string | null;
      invitedEmail: string | null;
      role: string;
      acceptedAt: string | null;
      user: { id: string; name: string; email: string; image: string | null } | null;
    };
  }[];
};

type MemberRow = {
  id: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  acceptedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null } | null;
};

type Tab = "branding" | "members" | "teams" | "domain" | "billing";

export function OrgClient({
  org,
  members,
  teams = [],
  myRole,
}: {
  org: OrgData;
  members: MemberRow[];
  teams?: TeamRow[];
  myRole: string;
}) {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("branding");
  const acceptedCount = members.filter((m) => m.acceptedAt).length;
  const canEdit = myRole === "OWNER" || myRole === "ADMIN";

  const TABS: { key: Tab; label: string; icon: typeof Palette; count?: number }[] = [
    { key: "branding", label: t.empresa.tabBranding, icon: Palette },
    { key: "members", label: t.empresa.tabMembers, icon: Users, count: members.length },
    { key: "teams", label: t.empresa.tabTeams, icon: UsersRound, count: teams.length },
    { key: "domain", label: t.empresa.tabDomain, icon: Globe },
    { key: "billing", label: t.empresa.tabBilling, icon: Receipt },
  ];

  return (
    <div>
      {/* Header strip */}
      <Card className="mb-6 flex flex-wrap items-center gap-4 overflow-hidden p-5">
        {org.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.logoUrl}
            alt={org.name}
            className="h-12 w-12 rounded-lg object-cover ring-1 ring-border"
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${org.primaryColor ?? "#3b82f6"}, ${org.secondaryColor ?? org.primaryColor ?? "#8b5cf6"})`,
            }}
          >
            <Building2 className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{org.name}</h1>
            {myRole === "OWNER" && (
              <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                <Crown className="mr-1 h-2.5 w-2.5" /> Owner
              </Badge>
            )}
            {myRole === "ADMIN" && (
              <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/15">
                Admin
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {org.slug} · {org.plan} · {acceptedCount} / {org.maxSeats} {t.empresa.seats}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {org.customDomain && (
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
              <Globe className="h-3 w-3" />
              {org.customDomain}
            </span>
          )}
          {!org.planActive && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600">
              {t.empresa.planInactive}
            </Badge>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "group relative inline-flex items-center gap-1.5 px-4 pb-3 pt-2 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  active ? "text-primary" : ""
                )}
              />
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono tabular-nums transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.count}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="empresa-tab-pin"
                  className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              {!active && (
                <span className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-primary/0 transition-colors group-hover:bg-primary/20" />
              )}
            </button>
          );
        })}
      </div>

      {tab === "branding" && (
        <BrandingForm initial={org} canEdit={canEdit} />
      )}
      {tab === "members" && (
        <MembersTable
          orgId={org.id}
          maxSeats={org.maxSeats}
          plan={org.plan}
          members={members}
          canEdit={canEdit}
        />
      )}
      {tab === "teams" && (
        <TeamsTab
          orgId={org.id}
          plan={org.plan}
          teams={teams}
          members={members}
          canEdit={canEdit}
        />
      )}
      {tab === "domain" && (
        <DomainSection
          orgId={org.id}
          plan={org.plan}
          customDomain={org.customDomain}
          domainVerifyToken={org.domainVerifyToken}
          domainVerifiedAt={org.domainVerifiedAt}
          canEdit={canEdit}
        />
      )}
      {tab === "billing" && <BillingTab org={org} acceptedCount={acceptedCount} />}
    </div>
  );
}
