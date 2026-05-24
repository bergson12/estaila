"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Users,
  KanbanSquare,
  Megaphone,
  Wallet,
  Sparkles,
  LayoutDashboard,
  Plus,
  CreditCard,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

const NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Propiedades", href: "/propiedades", icon: Building2 },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Contactos", href: "/contactos", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "Finanzas", href: "/finanzas", icon: Wallet },
];

const STUDIO = [
  { label: "Virtual Staging", href: "/studio/staging" },
  { label: "Eliminar Objetos", href: "/studio/declutter" },
  { label: "Mejorar Calidad", href: "/studio/enhance" },
];

const QUICK_ACTIONS = [
  { label: "Nueva propiedad", href: "/propiedades/nueva", icon: Plus },
  { label: "Nuevo contacto", href: "/contactos?new=1", icon: Plus },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar propiedades, contactos, herramientas..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Acciones rápidas">
          {QUICK_ACTIONS.map((a) => (
            <CommandItem key={a.href} onSelect={() => go(a.href)}>
              <a.icon className="mr-2 h-4 w-4" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Módulos">
          {NAV.map((n) => (
            <CommandItem key={n.href} onSelect={() => go(n.href)}>
              <n.icon className="mr-2 h-4 w-4" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Studio IA">
          {STUDIO.map((s) => (
            <CommandItem key={s.href} onSelect={() => go(s.href)}>
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              {s.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Cuenta">
          <CommandItem onSelect={() => go("/pricing")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Plan y créditos
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
