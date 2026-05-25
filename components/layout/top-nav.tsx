"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ArrowLeft,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  CreditCard,
  FileClock,
  Globe,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Receipt,
  Search,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";
import { LayoutModeToggle } from "./layout-mode-toggle";
import { authClient } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";
import { toast } from "sonner";

type NavUser = {
  name: string;
  email: string;
  image?: string | null;
  plan: string;
  credits: number;
  role?: string;
};

type OrgBrand = {
  orgId: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
} | null;

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/inicio", icon: LayoutDashboard },
  { label: "Propiedades", href: "/propiedades", icon: Building2 },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Contactos", href: "/contactos", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "Finanzas", href: "/finanzas", icon: Wallet },
];

const ADMIN_NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Usuarios", href: "/admin/users", icon: Users },
  { label: "Revenue", href: "/admin/revenue", icon: TrendingUp },
  { label: "Billing", href: "/admin/billing", icon: Receipt },
  { label: "Generaciones", href: "/admin/generations", icon: Activity },
  { label: "Auditoría", href: "/admin/audit", icon: FileClock },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/inicio") return pathname === "/inicio";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function TopNav({
  user,
  branding,
  layoutMode = "topbar",
}: {
  user: NavUser;
  branding?: OrgBrand;
  layoutMode?: "sidebar" | "topbar";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const adminMode = pathname.startsWith("/admin");
  const orgBrand = !adminMode && branding ? branding : null;
  const items = adminMode ? ADMIN_NAV : NAV;

  // ⌘K command palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    await authClient.signOut();
    toast.success("Sesión cerrada");
    router.push("/welcome");
    router.refresh();
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 border-b backdrop-blur-xl",
          adminMode
            ? "border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-background/90"
            : "border-border bg-background/85"
        )}
      >
        {/* Row 1 — brand + global actions */}
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand */}
          <Link
            href={adminMode ? "/admin" : "/"}
            className="group flex shrink-0 items-center gap-2.5"
          >
            {orgBrand?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgBrand.logoUrl}
                alt={orgBrand.name}
                className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-border"
              />
            ) : adminMode ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm shadow-amber-500/20 transition-transform group-hover:scale-105">
                <Shield className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
            ) : orgBrand ? (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${orgBrand.primaryColor}, ${orgBrand.secondaryColor})`,
                }}
              >
                <Building2 className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logos/iso-estaila.png"
                alt="Estaila"
                className="h-8 w-8 shrink-0 object-contain transition-transform group-hover:scale-105"
              />
            )}
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">
                {adminMode
                  ? "Admin"
                  : orgBrand
                    ? orgBrand.name
                    : "estaila"}
                {!adminMode && !orgBrand && (
                  <span className="text-primary">.</span>
                )}
              </span>
              <span className="mt-0.5 hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
                {adminMode
                  ? "Control panel"
                  : orgBrand
                    ? "Equipo"
                    : "CRM + Studio IA"}
              </span>
            </div>
          </Link>

          {/* Search */}
          <button
            onClick={() => setOpen(true)}
            className="group hidden h-10 flex-1 max-w-md items-center gap-2.5 rounded-full border border-border bg-card/50 px-4 text-left text-sm text-muted-foreground transition-all hover:border-border hover:bg-card md:flex"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">Buscar propiedad, contacto, página...</span>
            <kbd className="rounded-md border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              aria-label="Buscar"
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link
              href="/pricing"
              className="hidden h-10 items-center gap-1.5 rounded-full border border-border bg-card/50 px-3.5 text-sm transition-all hover:border-primary/40 hover:bg-card sm:inline-flex"
            >
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono font-semibold tabular-nums">
                {user.credits}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                créditos
              </span>
            </Link>

            <ThemeToggle />

            <button
              aria-label="Notificaciones"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>

            <UserMenu
              user={user}
              onLogout={handleLogout}
              adminMode={adminMode}
              layoutMode={layoutMode}
            />
          </div>
        </div>

        {/* Row 2 — main nav */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="hide-scrollbar relative -mb-px flex items-center gap-1 overflow-x-auto">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "group relative inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      active ? "text-primary" : ""
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="topnav-underline"
                      className={cn(
                        "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
                        adminMode ? "bg-amber-500" : "bg-primary"
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {!adminMode && (
              <>
                <span className="mx-1 h-4 w-px bg-border" />
                <Link
                  href="/studio"
                  prefetch
                  className={cn(
                    "group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isActive(pathname, "/studio")
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                  Studio
                  <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                    IA
                  </span>
                </Link>
                <Link
                  href="/sitio"
                  prefetch
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm transition-colors",
                    isActive(pathname, "/sitio")
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="font-medium">Mi Sitio</span>
                </Link>
                <Link
                  href="/empresa"
                  prefetch
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm transition-colors",
                    isActive(pathname, "/empresa")
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span className="font-medium">Empresa</span>
                </Link>

                {user.role === "ADMIN" && (
                  <>
                    <span className="mx-1 h-4 w-px bg-border" />
                    <Link
                      href="/admin"
                      prefetch
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 transition-colors hover:bg-amber-500/10"
                    >
                      <Shield className="h-3 w-3" strokeWidth={2} />
                      Admin
                    </Link>
                  </>
                )}
              </>
            )}

            {adminMode && (
              <>
                <span className="mx-1 h-4 w-px bg-amber-500/30" />
                <Link
                  href="/inicio"
                  prefetch
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/15"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Volver al CRM
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

// ============================================================
// USER MENU — avatar dropdown
// ============================================================

function UserMenu({
  user,
  onLogout,
  adminMode,
  layoutMode,
}: {
  user: NavUser;
  onLogout: () => void;
  adminMode: boolean;
  layoutMode: "sidebar" | "topbar";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Tu cuenta"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card/40 p-0.5 pr-2 transition-colors hover:bg-card"
        >
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        className="w-64 rounded-2xl border-border bg-card p-1.5"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 px-1 py-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
              {user.role === "ADMIN" && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600">
                  <Shield className="h-2.5 w-2.5" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LayoutModeToggle currentMode={layoutMode} />
        <DropdownMenuSeparator />
        {user.role === "ADMIN" && (
          <>
            {adminMode ? (
              <DropdownMenuItem asChild>
                <Link href="/inicio">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Cambiar a CRM
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link
                  href="/admin"
                  className="text-amber-600 focus:text-amber-600"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Panel admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pricing">
            <CreditCard className="mr-2 h-4 w-4" />
            Plan y créditos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
