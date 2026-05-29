"use client";

/**
 * MobileTabBar — barra inferior estilo app nativa (solo móvil, md:hidden).
 *
 * 5 destinos: Inicio · Propiedades · Studio IA (centro, destacado) ·
 * Contactos · Más (abre un sheet con el resto del menú).
 *
 * Da a estaila el feel de app cuando se instala como PWA en el teléfono.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Globe,
  Home,
  KanbanSquare,
  LifeBuoy,
  Megaphone,
  Menu,
  Settings,
  Shield,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Item = { label: string; href: string; icon: LucideIcon };

const MORE_ITEMS: Item[] = [
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Asistente IA", href: "/asistente", icon: Bot },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "Finanzas", href: "/finanzas", icon: Wallet },
  { label: "Análisis", href: "/analisis", icon: BarChart3 },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Mi Sitio", href: "/sitio", icon: Globe },
  { label: "Mi Empresa", href: "/empresa", icon: Briefcase },
  { label: "Soporte", href: "/soporte", icon: LifeBuoy },
  { label: "Ajustes", href: "/settings", icon: Settings },
];

function active(pathname: string, href: string) {
  if (href === "/inicio") return pathname === "/inicio";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileTabBar({ role }: { role?: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const items: Item[] =
    role === "ADMIN"
      ? [{ label: "Admin", href: "/admin", icon: Shield }, ...MORE_ITEMS]
      : MORE_ITEMS;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
          <Tab href="/inicio" label="Inicio" icon={Home} activePath={pathname} />
          <Tab
            href="/propiedades"
            label="Propiedades"
            icon={Building2}
            activePath={pathname}
          />
          {/* Centro destacado: Studio IA */}
          <Link
            href="/studio"
            className="relative -mt-5 flex w-[20%] flex-col items-center"
          >
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95",
                active(pathname, "/studio") && "ring-primary/20"
              )}
            >
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </span>
            <span
              className={cn(
                "mt-0.5 text-[10px] font-medium",
                active(pathname, "/studio")
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              Studio
            </span>
          </Link>
          <Tab
            href="/contactos"
            label="Contactos"
            icon={Users}
            activePath={pathname}
          />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex w-[20%] flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
            Más
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-border pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">Menú</SheetTitle>
          </SheetHeader>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {items.map((it) => {
              const isAct = active(pathname, it.href);
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                    isAct
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  <span className="text-[10px] font-medium leading-tight">
                    {it.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Tab({
  href,
  label,
  icon: Icon,
  activePath,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  activePath: string;
}) {
  const isAct = active(activePath, href);
  return (
    <Link
      href={href}
      className="relative flex w-[20%] flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
    >
      {isAct && (
        <motion.span
          layoutId="mobile-tab-active"
          className="absolute -top-px h-0.5 w-8 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon
        className={cn(
          "h-5 w-5 transition-colors",
          isAct ? "text-primary" : "text-muted-foreground"
        )}
        strokeWidth={1.75}
      />
      <span className={isAct ? "text-primary" : "text-muted-foreground"}>
        {label}
      </span>
    </Link>
  );
}
