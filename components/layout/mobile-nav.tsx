"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  FileClock,
  Globe,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import { signOutClean } from "@/lib/auth-client";
import { toast } from "sonner";

const NAV = [
  { label: "Dashboard", href: "/inicio", icon: LayoutDashboard },
  { label: "Propiedades", href: "/propiedades", icon: Building2 },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Contactos", href: "/contactos", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "Finanzas", href: "/finanzas", icon: Wallet },
  { label: "Mi Sitio", href: "/sitio", icon: Globe },
  { label: "Mi Empresa", href: "/empresa", icon: Briefcase },
  { label: "Asistente IA", href: "/asistente", icon: Bot },
  { label: "Studio IA", href: "/studio", icon: Sparkles },
] as const;

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Usuarios", href: "/admin/users", icon: Users },
  { label: "Revenue", href: "/admin/revenue", icon: TrendingUp },
  { label: "Billing", href: "/admin/billing", icon: Receipt },
  { label: "Generaciones IA", href: "/admin/generations", icon: Activity },
  { label: "Auditoría", href: "/admin/audit", icon: FileClock },
  { label: "Configuración", href: "/admin/settings", icon: Settings },
] as const;

type MobileNavUser = {
  name: string;
  email: string;
  image?: string | null;
  plan?: string;
  credits?: number;
  role?: string;
};

type OrgBrand = {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
} | null;

export function MobileNav({
  user,
  branding,
}: {
  user: MobileNavUser;
  branding?: OrgBrand;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const adminMode = pathname.startsWith("/admin");
  const items = adminMode ? ADMIN_NAV : NAV;
  const orgBrand = !adminMode ? branding : null;

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function handleLogout() {
    setOpen(false);
    toast.success("Sesión cerrada");
    // signOutClean limpia sessionStorage + recarga dura → sin fuga de estado
    // (Studio pipeline, etc.) al siguiente usuario en la misma pestaña.
    await signOutClean();
  }

  function isActive(href: string) {
    if (href === "/" || href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[280px] flex-col gap-0 p-0 sm:w-[300px]"
      >
        <SheetHeader className="border-b border-border p-4">
          <div className="flex items-center gap-2.5">
            {orgBrand?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgBrand.logoUrl}
                alt={orgBrand.name}
                className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-border"
              />
            ) : (
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-sm",
                  adminMode
                    ? "bg-gradient-to-br from-amber-500 to-amber-600"
                    : !orgBrand && "bg-gradient-to-br from-primary to-primary/60"
                )}
                style={
                  orgBrand && !adminMode
                    ? {
                        background: `linear-gradient(135deg, ${orgBrand.primaryColor}, ${orgBrand.secondaryColor})`,
                      }
                    : undefined
                }
              >
                {adminMode ? (
                  <Shield className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                )}
              </div>
            )}
            <div className="flex flex-col text-left">
              <SheetTitle className="text-sm font-semibold tracking-tight">
                {orgBrand?.name ?? (adminMode ? "Admin Panel" : "estaila")}
              </SheetTitle>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {adminMode ? "Modo administrador" : "CRM"}
              </span>
            </div>
          </div>
        </SheetHeader>

        {adminMode && (
          <button
            type="button"
            onClick={() => go("/")}
            className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-[11px] font-medium text-amber-600 transition-colors hover:bg-amber-500/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Volver al CRM
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {items.map((it) => {
              const Icon = it.icon;
              const active = isActive(it.href);
              return (
                <li key={it.href}>
                  <button
                    type="button"
                    onClick={() => go(it.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/85 hover:bg-card/60 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{it.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Admin shortcut */}
          {!adminMode && user.role === "ADMIN" && (
            <button
              type="button"
              onClick={() => go("/admin")}
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/10"
            >
              <Shield className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">Panel Admin</span>
            </button>
          )}
        </nav>

        {/* User card */}
        <div className="border-t border-border bg-card/30 p-3">
          {!adminMode && user.plan && (
            <button
              type="button"
              onClick={() => go("/pricing")}
              className="mb-2 flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:bg-card/80"
            >
              <span className="flex items-center gap-1.5">
                <CreditCard
                  className="h-3.5 w-3.5 text-primary"
                  strokeWidth={1.75}
                />
                <span className="font-mono font-semibold tabular-nums">
                  {user.credits ?? 0}
                </span>
                <span className="text-muted-foreground">créditos IA</span>
              </span>
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {user.plan ?? "FREE"}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9 ring-1 ring-border">
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback className="bg-muted text-[11px] font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
