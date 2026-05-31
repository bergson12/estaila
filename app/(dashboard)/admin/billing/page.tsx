import { listBillingEvents } from "@/lib/actions/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n/server";

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

export default async function AdminBillingPage() {
  const [events, t, locale] = await Promise.all([
    listBillingEvents(80),
    getDict(),
    getLocale(),
  ]);
  const total = events.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title={t.adminPanel.billingTitle}
        description={`${t.adminPanel.billingLast} ${events.length} ${t.adminPanel.billingEvents} · ${t.adminPanel.billingTotalShown}: US$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      />

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">{t.adminPanel.colDate}</th>
              <th className="px-3 py-2.5 font-semibold">{t.adminPanel.colUser}</th>
              <th className="px-3 py-2.5 font-semibold">{t.adminPanel.colType}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{t.adminPanel.colAmount}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{t.adminPanel.colCredits}</th>
              <th className="px-3 py-2.5 font-semibold">{t.adminPanel.colReference}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString(locale === "en" ? "en-US" : "es", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm">{e.user.name}</p>
                  <p className="text-xs text-muted-foreground">{e.user.email}</p>
                </td>
                <td className="px-3 py-3">
                  <Badge className={`${TYPE_COLOR[e.type] ?? "bg-muted"} hover:bg-current/15`}>
                    {e.type}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {Number(e.amount) > 0 ? (
                    <span className="text-emerald-600">
                      +${Number(e.amount).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  {e.credits > 0 ? `+${e.credits}` : e.credits < 0 ? e.credits : "—"}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                  {e.reference?.slice(-12) ?? "—"}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <CircleDollarSign className="mx-auto mb-2 h-5 w-5 opacity-40" />
                  {t.adminPanel.billingEmpty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
