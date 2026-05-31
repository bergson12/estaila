import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  Mail,
  Sparkles,
  Users as UsersIcon,
  Megaphone,
  Image as ImageIcon,
  Globe,
  Crown,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserDetail } from "@/lib/actions/admin";
import { UserDetailActions } from "@/components/admin/user-detail-actions";
import { PageHeader } from "@/components/shared/page-header";
import { getDict, getLocale } from "@/lib/i18n/server";
import { CATEGORIES, OPERATIONS, labelFor } from "@/lib/constants";

const TYPE_COLOR: Record<string, string> = {
  SUB_ACTIVATED: "bg-emerald-500/15 text-emerald-600",
  SUB_RENEWED: "bg-emerald-500/15 text-emerald-600",
  SUB_CANCELLED: "bg-rose-500/15 text-rose-600",
  PACK_PURCHASED: "bg-violet-500/15 text-violet-600",
  REFUND: "bg-amber-500/15 text-amber-600",
  ADMIN_GRANT: "bg-blue-500/15 text-blue-600",
  SUB_PENDING: "bg-muted text-muted-foreground",
  PACK_PENDING: "bg-muted text-muted-foreground",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, t, locale] = await Promise.all([
    getUserDetail(id),
    getDict(),
    getLocale(),
  ]);
  if (!data) notFound();
  const { user, billingEvents, recentGens, recentProps, site } = data;
  const dateLocale = locale === "en" ? "en-US" : "es";

  const counts = user._count;

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        {t.adminPanel.backToUsers}
      </Link>

      <PageHeader
        title={user.name}
        description={user.email}
      />

      {/* Identity strip */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">
          {user.plan}
        </Badge>
        {user.role === "ADMIN" && (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
            <Crown className="mr-1 h-2.5 w-2.5" /> ADMIN
          </Badge>
        )}
        {user.suspended && (
          <Badge variant="outline" className="border-rose-500/40 text-rose-600">
            {t.adminPanel.suspended}
          </Badge>
        )}
        {!user.planActive && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-600">
            {t.adminPanel.planInactive}
          </Badge>
        )}
        {user.paypalSubId && (
          <Badge variant="outline" className="text-xs">
            PayPal · {user.paypalSubId.slice(-8)}
          </Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {t.adminPanel.registered} {new Date(user.createdAt).toLocaleDateString(dateLocale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Action row */}
      <UserDetailActions user={{
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role,
        suspended: user.suspended,
        credits: user.credits,
      }} />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Stat icon={CreditCard} label={t.adminPanel.statCredits} value={user.credits.toString()} highlight />
        <Stat icon={Building2} label={t.adminPanel.statProperties} value={counts.properties.toString()} />
        <Stat icon={UsersIcon} label={t.adminPanel.statContacts} value={counts.contacts.toString()} />
        <Stat icon={Sparkles} label={t.adminPanel.statGenerations} value={counts.aiGenerations.toString()} />
        <Stat icon={ImageIcon} label={t.adminPanel.statPhotos} value={counts.photos.toString()} />
        <Stat icon={Calendar} label={t.adminPanel.statAppointments} value={counts.appointments.toString()} />
        <Stat icon={Megaphone} label={t.adminPanel.statPosts} value={counts.marketingPosts.toString()} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Billing column */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            {t.adminPanel.billingMovements} ({billingEvents.length})
          </h3>
          {billingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.adminPanel.noBillingYet}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {billingEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30">
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString(dateLocale, {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge className={`${TYPE_COLOR[e.type] ?? "bg-muted"} hover:bg-current/15`}>
                          {e.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                        {Number(e.amount) > 0 ? (
                          <span className="text-emerald-600">+${Number(e.amount).toFixed(2)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-xs text-muted-foreground">
                        {e.credits !== 0 ? `${e.credits > 0 ? "+" : ""}${e.credits}c` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Profile + site column */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {t.adminPanel.profile}
            </h3>
            <Field label="ID" value={<code className="text-[10px]">{user.id}</code>} />
            <Field label="Email" value={user.email} />
            <Field label={t.adminPanel.renewsOn} value={user.planRenewsAt ? new Date(user.planRenewsAt).toLocaleDateString(dateLocale) : "—"} />
            <Field label={t.adminPanel.lastUpdate} value={new Date(user.updatedAt).toLocaleString(dateLocale, { dateStyle: "medium", timeStyle: "short" })} />
          </Card>

          {site && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                {t.adminPanel.publicSite}
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">URL</span>
                  <Link
                    href={`/p/${site.slug}`}
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    /p/{site.slug}
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.adminPanel.template}</span>
                  <span className="font-medium">{site.template}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.adminPanel.statusWord}</span>
                  {site.published ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
                      {t.adminPanel.published}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{t.adminPanel.draft}</Badge>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Recent generations + properties */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {t.adminPanel.latestAiGenerations}
          </h3>
          {recentGens.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.adminPanel.noGensYet}</p>
          ) : (
            <ul className="space-y-1.5">
              {recentGens.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-card/30 p-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {g.tool}
                    </Badge>
                    {g.status === "FAILED" && g.errorMsg && (
                      <span className="flex items-center gap-1 text-rose-600 truncate" title={g.errorMsg}>
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {g.errorMsg}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <span className="font-mono">{g.creditsUsed}c</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(g.createdAt).toLocaleDateString(dateLocale, {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {t.adminPanel.latestProperties}
          </h3>
          {recentProps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.adminPanel.noPropsYet}</p>
          ) : (
            <ul className="space-y-1.5">
              {recentProps.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-card/30 p-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {labelFor(CATEGORIES, p.category, locale)} · {labelFor(OPERATIONS, p.operation, locale)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono tabular-nums">
                    {p.priceUSD ? `$${Number(p.priceUSD).toLocaleString()}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-3 ${highlight ? "border-primary/30 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={1.75} />
        <span className="text-[9px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1.5 font-mono text-xl font-bold tabular-nums">{value}</p>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
