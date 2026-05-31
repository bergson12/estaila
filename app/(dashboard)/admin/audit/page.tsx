import Link from "next/link";
import { listAuditLogs } from "@/lib/actions/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileClock } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n/server";

const ACTION_COLOR: Record<string, string> = {
  "user.changePlan": "bg-violet-500/15 text-violet-600",
  "user.adjustCredits": "bg-blue-500/15 text-blue-600",
  "user.setSuspended": "bg-rose-500/15 text-rose-600",
  "user.setRole": "bg-amber-500/15 text-amber-600",
  "user.refund": "bg-amber-500/15 text-amber-600",
  "user.resetCredits": "bg-emerald-500/15 text-emerald-600",
  "settings.update": "bg-blue-500/15 text-blue-600",
  "billing.refund": "bg-amber-500/15 text-amber-600",
  "billing.cancelSub": "bg-rose-500/15 text-rose-600",
};

export default async function AdminAuditPage() {
  const [logs, t, locale] = await Promise.all([
    listAuditLogs(100),
    getDict(),
    getLocale(),
  ]);

  return (
    <div>
      <PageHeader
        title={t.adminPanel.auditTitle}
        description={`${t.adminPanel.auditLast} ${logs.length} ${t.adminPanel.auditActionsLogged}`}
      />

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">{t.adminPanel.colDate}</th>
              <th className="px-3 py-2.5 font-semibold">{t.adminPanel.colAdmin}</th>
              <th className="px-3 py-2.5 font-semibold">{t.adminPanel.colAction}</th>
              <th className="px-3 py-2.5 font-semibold">{t.adminPanel.colTarget}</th>
              <th className="px-3 py-2.5 font-semibold">{t.adminPanel.colDetails}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString(locale === "en" ? "en-US" : "es", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-3 text-xs">
                  {l.actor ? (
                    <div>
                      <p className="font-medium">{l.actor.name}</p>
                      <p className="text-muted-foreground">{l.actor.email}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Badge className={`${ACTION_COLOR[l.action] ?? "bg-muted"} hover:bg-current/15`}>
                    {l.action}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-xs">
                  {l.target ? (
                    <Link
                      href={`/admin/users/${l.target.id}`}
                      className="hover:text-primary"
                    >
                      {l.target.name}
                    </Link>
                  ) : l.targetId ? (
                    <code className="text-[10px] text-muted-foreground">
                      {l.targetId.slice(0, 8)}…
                    </code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {l.metadata ? (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      {l.metadata.slice(0, 100)}
                      {l.metadata.length > 100 ? "…" : ""}
                    </code>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  <FileClock className="mx-auto mb-2 h-5 w-5 opacity-40" />
                  {t.adminPanel.auditEmpty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
