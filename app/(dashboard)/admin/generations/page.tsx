import { listRecentGenerations } from "@/lib/actions/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-600",
  PROCESSING: "bg-blue-500/15 text-blue-600",
  PENDING: "bg-muted text-muted-foreground",
  FAILED: "bg-rose-500/15 text-rose-600",
};

export default async function AdminGenerationsPage() {
  const gens = await listRecentGenerations(60);
  const failed = gens.filter((g) => g.status === "FAILED").length;
  const completed = gens.filter((g) => g.status === "COMPLETED").length;

  return (
    <div>
      <PageHeader
        title="Generaciones IA recientes"
        description={`${gens.length} mostradas · ${completed} ok · ${failed} fallidas`}
      />

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Fecha</th>
              <th className="px-3 py-2.5 font-semibold">Usuario</th>
              <th className="px-3 py-2.5 font-semibold">Tool</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 text-right font-semibold">Costo</th>
              <th className="px-3 py-2.5 font-semibold">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {gens.map((g) => (
              <tr key={g.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(g.createdAt).toLocaleString("es", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-3">
                  <p className="text-xs text-muted-foreground">{g.user.email}</p>
                </td>
                <td className="px-3 py-3">
                  <Badge variant="outline" className="text-[10px]">
                    {g.tool}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <Badge className={`${STATUS_COLOR[g.status] ?? "bg-muted"} hover:bg-current/15`}>
                    {g.status}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-xs">
                  {g.creditsUsed}c
                </td>
                <td className="px-3 py-3 text-xs text-rose-600">
                  {g.errorMsg ? (
                    <span title={g.errorMsg} className="line-clamp-1">
                      {g.errorMsg}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
