"use client";

/**
 * FAB "Reseñar" — visible solo para cuentas tester (montado condicionalmente
 * en el layout). Lleva a /resenas y precarga el módulo actual según la ruta,
 * para que el tester pueda dejar feedback mientras prueba cada sección.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { moduleFromPath } from "@/lib/modules";

export function TesterFab() {
  const pathname = usePathname();
  // No mostrar dentro del propio formulario ni en el panel admin.
  if (pathname.startsWith("/resenas") || pathname.startsWith("/admin")) return null;

  const m = moduleFromPath(pathname);
  const href = m ? `/resenas?m=${m}` : "/resenas";

  return (
    <Link
      href={href}
      className="fixed bottom-24 right-5 z-50 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      title="Dejar una reseña de este módulo"
    >
      <FlaskConical className="h-4 w-4" />
      Reseñar
    </Link>
  );
}
