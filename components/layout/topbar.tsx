"use client";

import {
  Search,
  ChevronRight,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { useSidebarCollapsed } from "@/lib/stores/sidebar-collapsed";
import { cn } from "@/lib/utils";

type TopbarUser = {
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

const SEGMENTS: Record<string, string> = {
  "": "Dashboard",
  propiedades: "Propiedades",
  agenda: "Agenda",
  contactos: "Contactos",
  pipeline: "Pipeline",
  marketing: "Marketing",
  finanzas: "Finanzas",
  studio: "Studio IA",
  sitio: "Mi Sitio",
  nueva: "Nueva",
  pricing: "Plan y créditos",
  settings: "Configuración",
  staging: "Virtual Staging",
  declutter: "Eliminar Objetos",
  enhance: "Mejorar Calidad",
  style: "Cambiar Estilo",
  sky: "Cielo Despejado",
  twilight: "Atardecer",
  pool: "Piscina",
  lawn: "Césped",
};

/** Detecta segmentos que son IDs (cuid/uuid/hash) para no mostrarlos crudos. */
function isIdLike(slug: string): boolean {
  return (
    /^c[a-z0-9]{20,}$/i.test(slug) || // cuid
    /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(slug) || // uuid
    (slug.length >= 16 && /^[a-z0-9]+$/i.test(slug) && /\d/.test(slug)) // hash genérico
  );
}

function humanize(slug: string) {
  if (SEGMENTS[slug] !== undefined) return SEGMENTS[slug];
  if (isIdLike(slug)) return "Detalle";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function Topbar({
  user,
  branding,
}: {
  user?: TopbarUser;
  branding?: OrgBrand;
} = {}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

  const parts = pathname.split("/").filter(Boolean);
  // Para el título móvil: usa el último segmento con significado (salta IDs),
  // para que /contactos/<id> muestre "Contactos" y no el cuid crudo.
  const mobileTitleSlug =
    [...parts].reverse().find((p) => !isIdLike(p)) ?? parts[parts.length - 1];

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
        {/* Mobile drawer trigger + Breadcrumb */}
        <nav className="flex min-w-0 items-center gap-1.5 text-sm">
          {user && <MobileNav user={user} branding={branding} />}
          <CollapseToggle />
          <Link
            href="/inicio"
            className="flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
          {/* Breadcrumb only on sm+ to save mobile space */}
          <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
            {parts.map((p, i) => {
              const href = "/" + parts.slice(0, i + 1).join("/");
              const isLast = i === parts.length - 1;
              return (
                <span key={href} className="flex min-w-0 items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {isLast ? (
                    <span className="truncate font-medium">{humanize(p)}</span>
                  ) : (
                    <Link
                      href={href}
                      className="truncate text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {humanize(p)}
                    </Link>
                  )}
                </span>
              );
            })}
          </div>
          {/* On mobile show only the page title (skips raw IDs) */}
          {parts.length > 0 && (
            <span className="ml-1 flex min-w-0 items-center gap-1 text-sm font-medium sm:hidden">
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              <span className="truncate">{humanize(mobileTitleSlug)}</span>
            </span>
          )}
        </nav>

        {/* Search + actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="hidden h-9 w-72 items-center gap-2.5 rounded-lg border border-border bg-card/50 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground md:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">Buscar...</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </header>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * Small, subtle pill to fold/unfold the side nav. Sits between MobileNav and
 * the Home breadcrumb — branded but understated.
 */
function CollapseToggle() {
  const collapsed = useSidebarCollapsed((s) => s.collapsed);
  const toggle = useSidebarCollapsed((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expandir menú" : "Plegar menú"}
      title={collapsed ? "Expandir menú" : "Plegar menú"}
      className={cn(
        "hidden md:flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground transition-all duration-200",
        "hover:bg-primary/10 hover:text-primary",
        "active:scale-95"
      )}
    >
      {collapsed ? (
        <PanelLeftOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
      ) : (
        <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
    </button>
  );
}
