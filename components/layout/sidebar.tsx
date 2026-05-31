"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "motion/react";
import { useSidebarCollapsed } from "@/lib/stores/sidebar-collapsed";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { NAV_GROUPS, ADMIN_NAV } from "./nav-config";
import { useT } from "@/lib/i18n/provider";
import { navLabel } from "@/lib/i18n/dictionary";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutClean } from "@/lib/auth-client";
import { toast } from "sonner";
import { LayoutModeToggle } from "./layout-mode-toggle";

type SidebarUser = {
  name: string;
  email: string;
  image?: string | null;
  plan: string;
  credits: number;
  role?: string;
};

type OrgBrandingProp = {
  orgId: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
} | null;

function isActive(pathname: string, href: string) {
  if (href === "/inicio") return pathname === "/inicio";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  user,
  branding,
  layoutMode = "sidebar",
}: {
  user: SidebarUser;
  branding?: OrgBrandingProp;
  layoutMode?: "sidebar" | "topbar";
}) {
  const pathname = usePathname();
  const { t } = useT();
  const collapsed = useSidebarCollapsed((s) => s.collapsed);
  const setCollapsed = useSidebarCollapsed((s) => s.setCollapsed);
  const adminMode = pathname.startsWith("/admin");
  // Branding only applies in CRM mode (not admin)
  const orgBrand = !adminMode && branding ? branding : null;

  // Sync CSS variable so the main content padding tracks the sidebar width
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--sidebar-w",
        collapsed ? "72px" : "240px"
      );
    }
  }, [collapsed]);

  async function handleLogout() {
    toast.success(t.chrome.loggedOut);
    // signOutClean limpia sessionStorage + recarga dura → sin fuga de estado
    // (Studio pipeline, etc.) al siguiente usuario en la misma pestaña.
    await signOutClean();
  }

  const width = collapsed ? 72 : 240;

  return (
    <motion.aside
      initial={false}
      animate={{ width }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r text-sidebar-foreground md:flex",
        adminMode
          ? "border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-sidebar"
          : "border-border bg-sidebar"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b px-4",
          adminMode ? "border-amber-500/30" : "border-border",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href={adminMode ? "/admin" : "/"}
          className="flex items-center gap-2.5 overflow-hidden"
          onClick={(e) => {
            if (collapsed) {
              e.preventDefault();
              setCollapsed(false);
            }
          }}
          title={collapsed ? "Expandir menú" : undefined}
        >
          {orgBrand && orgBrand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgBrand.logoUrl}
              alt={orgBrand.name}
              className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-border"
            />
          ) : adminMode ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm shadow-amber-500/20">
              <Shield className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
          ) : orgBrand ? (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
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
              className="h-8 w-8 shrink-0 object-contain"
            />
          )}
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">
                {adminMode
                  ? "Admin"
                  : orgBrand
                    ? orgBrand.name
                    : (
                        <>
                          estaila<span className="text-primary">.</span>
                        </>
                      )}
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {adminMode
                  ? t.chrome.controlPanel
                  : orgBrand
                    ? t.chrome.teamCRM
                    : t.chrome.crmStudio}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {adminMode ? (
          <>
            {/* Back to CRM */}
            <Link
              href="/inicio"
              className={cn(
                "group mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/15",
                collapsed && "justify-center px-0"
              )}
              title={t.chrome.backToCRM}
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span>{t.chrome.backToCRM}</span>}
            </Link>
            {ADMIN_NAV.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={<item.icon className="h-4 w-4" strokeWidth={1.75} />}
                label={navLabel(t, item.href, item.label)}
                active={
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : isActive(pathname, item.href)
                }
                collapsed={collapsed}
              />
            ))}
          </>
        ) : (
          <>
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.key} className={cn(gi > 0 && "mt-4")}>
                {!collapsed && (
                  <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {t.groups[group.key] ?? group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isStudio = item.href === "/studio";
                    return (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={<item.icon className="h-4 w-4" strokeWidth={1.75} />}
                        label={navLabel(t, item.href, item.label)}
                        active={isActive(pathname, item.href)}
                        collapsed={collapsed}
                        featured={isStudio}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {user.role === "ADMIN" && (
              <div className="mt-4">
                {!collapsed && (
                  <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {t.groups.sistema}
                  </p>
                )}
                <NavItem
                  href="/admin"
                  icon={<Shield className="h-4 w-4" strokeWidth={1.75} />}
                  label={t.chrome.adminPanel}
                  active={false}
                  collapsed={collapsed}
                  admin
                />
              </div>
            )}
          </>
        )}
      </nav>

      {/* Credits + user */}
      <div className="border-t border-border p-3">
        {!collapsed && (
          <Link
            href="/pricing"
            className="mb-3 block rounded-lg border border-border bg-card/50 p-3 transition-colors hover:border-primary/40 hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                {t.chrome.creditsAI}
              </div>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {user.plan}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tabular-nums">
                {user.credits}
              </span>
              <span className="text-xs text-muted-foreground">{t.chrome.remaining}</span>
            </div>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8 ring-1 ring-border">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="bg-muted text-xs font-semibold">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="w-56 border-border bg-card"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              {user.role === "ADMIN" && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600">
                  <Shield className="h-2.5 w-2.5" />
                  ADMIN
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <LayoutModeToggle currentMode={layoutMode} />
            <DropdownMenuSeparator />
            {user.role === "ADMIN" && (
              <>
                {pathname.startsWith("/admin") ? (
                  <DropdownMenuItem asChild>
                    <Link href="/inicio">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t.chrome.switchToCRM}
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin"
                      className="text-amber-600 focus:text-amber-600"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {t.chrome.adminPanel}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                {t.chrome.settingsItem}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                {t.chrome.planCredits}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t.chrome.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
  collapsed,
  featured,
  admin,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  featured?: boolean;
  admin?: boolean;
}) {
  const content = (
    <Link
      href={href}
      prefetch
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? admin
            ? "bg-amber-500/10 text-amber-600"
            : "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
          active && admin && "text-amber-600",
          active && !admin && "text-primary",
          !active && "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {featured && (
            <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
              IA
            </span>
          )}
          {admin && (
            <span className="ml-auto rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600">
              Admin
            </span>
          )}
        </>
      )}
    </Link>
  );
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

export const SIDEBAR_WIDTH_PX = 240;
export const SIDEBAR_COLLAPSED_PX = 72;
