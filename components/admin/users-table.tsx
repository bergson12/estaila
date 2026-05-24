"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  Pause,
  Play,
  Plus,
  Minus,
  Crown,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  changePlan,
  adjustCredits,
  setSuspended,
  setRole,
} from "@/lib/actions/admin";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  credits: number;
  planActive: boolean;
  suspended: boolean;
  paypalSubId: string | null;
  createdAt: string;
  _count: { properties: number; contacts: number; aiGenerations: number };
};

const PLAN_COLOR: Record<string, string> = {
  FREE: "border-muted-foreground/30 text-muted-foreground",
  PRO: "border-primary/40 text-primary",
  TEAM: "border-violet-500/40 text-violet-600",
};

export function AdminUsersTable({
  users,
  initialSearch,
  initialPlan,
}: {
  users: UserRow[];
  initialSearch: string;
  initialPlan: "ALL" | "FREE" | "PRO" | "TEAM";
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [plan, setPlan] = useState<"ALL" | "FREE" | "PRO" | "TEAM">(initialPlan);
  const [pending, startTransition] = useTransition();

  function applyFilters(nextPlan = plan, nextSearch = search) {
    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextPlan !== "ALL") params.set("plan", nextPlan);
    router.push(`/admin/users${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function withToast<T>(promise: Promise<T>, success: string) {
    startTransition(async () => {
      try {
        await promise;
        toast.success(success);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
          className="relative flex-1 min-w-[240px]"
        >
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o nombre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </form>
        <div className="flex gap-1 rounded-md border bg-muted/30 p-0.5">
          {(["ALL", "FREE", "PRO", "TEAM"] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPlan(p);
                applyFilters(p, search);
              }}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                plan === p
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "ALL" ? "Todos" : p}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Usuario</th>
                <th className="px-3 py-2.5 font-semibold">Rol</th>
                <th className="px-3 py-2.5 font-semibold">Plan</th>
                <th className="px-3 py-2.5 text-right font-semibold">Créditos</th>
                <th className="px-3 py-2.5 text-right font-semibold">Props</th>
                <th className="px-3 py-2.5 text-right font-semibold">Gens</th>
                <th className="px-3 py-2.5 font-semibold">Estado</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {u.role === "ADMIN" ? (
                      <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                        <Crown className="mr-1 h-2.5 w-2.5" /> ADMIN
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">USER</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={PLAN_COLOR[u.plan] ?? ""}>
                      {u.plan}
                    </Badge>
                    {u.paypalSubId && (
                      <span
                        className="ml-1 text-[9px] text-muted-foreground"
                        title="Suscripción PayPal activa"
                      >
                        PP
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">
                    {u.credits}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {u._count.properties}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {u._count.aiGenerations}
                  </td>
                  <td className="px-3 py-3">
                    {u.suspended ? (
                      <Badge variant="outline" className="border-rose-500/40 text-rose-600">
                        Suspendido
                      </Badge>
                    ) : !u.planActive ? (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                        Inactivo
                      </Badge>
                    ) : (
                      <span className="text-xs text-emerald-600">●</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={pending}
                        >
                          Acciones
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
                          Cambiar plan
                        </DropdownMenuLabel>
                        {(["FREE", "PRO", "TEAM"] as const).map((p) => (
                          <DropdownMenuItem
                            key={p}
                            disabled={u.plan === p}
                            onClick={() =>
                              withToast(
                                changePlan(u.id, p),
                                `${u.name} → ${p}`
                              )
                            }
                          >
                            {p}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
                          Créditos
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            withToast(
                              adjustCredits(u.id, 50, "Admin grant"),
                              "+50 créditos"
                            )
                          }
                        >
                          <Plus className="mr-2 h-3.5 w-3.5" /> +50 créditos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            withToast(
                              adjustCredits(u.id, -10, "Admin debit"),
                              "-10 créditos"
                            )
                          }
                          disabled={u.credits < 10}
                        >
                          <Minus className="mr-2 h-3.5 w-3.5" /> -10 créditos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            withToast(
                              setSuspended(u.id, !u.suspended),
                              u.suspended ? "Reactivado" : "Suspendido"
                            )
                          }
                        >
                          {u.suspended ? (
                            <>
                              <Play className="mr-2 h-3.5 w-3.5" /> Reactivar
                            </>
                          ) : (
                            <>
                              <Pause className="mr-2 h-3.5 w-3.5" /> Suspender
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            withToast(
                              setRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN"),
                              u.role === "ADMIN" ? "→ USER" : "→ ADMIN"
                            )
                          }
                        >
                          {u.role === "ADMIN" ? (
                            <>
                              <UserIcon className="mr-2 h-3.5 w-3.5" /> Quitar admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Hacer admin
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
