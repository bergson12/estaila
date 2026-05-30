/**
 * Lista canónica de módulos de la app — fuente única para:
 *   - calificación por módulo en las reseñas de tester
 *   - detección del módulo actual desde la ruta (botón "Reseñar")
 *   - etiquetas en el panel admin de reseñas
 *
 * Mantener en sync con `NAV_GROUPS` de `components/layout/sidebar.tsx`.
 */

export type AppModule = {
  id: string;
  label: string;
  route: string;
  group: "Principal" | "Herramientas" | "Negocio";
};

export const APP_MODULES: readonly AppModule[] = [
  { id: "dashboard", label: "Dashboard", route: "/inicio", group: "Principal" },
  { id: "propiedades", label: "Propiedades", route: "/propiedades", group: "Principal" },
  { id: "agenda", label: "Agenda", route: "/agenda", group: "Principal" },
  { id: "contactos", label: "Contactos", route: "/contactos", group: "Principal" },
  { id: "pipeline", label: "Pipeline", route: "/pipeline", group: "Principal" },
  { id: "asistente", label: "Asistente IA", route: "/asistente", group: "Herramientas" },
  { id: "studio", label: "Studio IA", route: "/studio", group: "Herramientas" },
  { id: "marketing", label: "Marketing", route: "/marketing", group: "Herramientas" },
  { id: "documentos", label: "Documentos", route: "/documentos", group: "Herramientas" },
  { id: "finanzas", label: "Finanzas", route: "/finanzas", group: "Negocio" },
  { id: "analisis", label: "Análisis", route: "/analisis", group: "Negocio" },
  { id: "sitio", label: "Mi Sitio", route: "/sitio", group: "Negocio" },
  { id: "empresa", label: "Mi Empresa", route: "/empresa", group: "Negocio" },
] as const;

export const MODULE_LABEL: Record<string, string> = Object.fromEntries(
  APP_MODULES.map((m) => [m.id, m.label])
);

export const MODULE_IDS: readonly string[] = APP_MODULES.map((m) => m.id);

/** Créditos IA iniciales de una cuenta tester (margen medio para acotar costo Gemini/DeepSeek/OpenAI). */
export const TESTER_CREDIT_CAP = 150;

/** Mejor coincidencia de módulo a partir de una ruta (`/studio/123` → "studio"). */
export function moduleFromPath(path: string): string | null {
  // Orden por ruta más larga primero para que el prefijo más específico gane.
  const sorted = [...APP_MODULES].sort((a, b) => b.route.length - a.route.length);
  const hit = sorted.find((m) => path === m.route || path.startsWith(m.route + "/"));
  return hit?.id ?? null;
}
