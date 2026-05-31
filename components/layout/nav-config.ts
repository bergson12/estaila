/**
 * Fuente única de la navegación del CRM (sidebar desktop + drawer móvil).
 * Mantener AQUÍ cualquier cambio de menú para que escritorio y móvil nunca
 * se desincronicen.
 */
import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  FileClock,
  FileText,
  Globe,
  Images,
  KanbanSquare,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Receipt,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItemDef = { label: string; href: string; icon: LucideIcon };
export type NavGroup = { label: string; items: readonly NavItemDef[] };

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard", href: "/inicio", icon: LayoutDashboard },
      { label: "Propiedades", href: "/propiedades", icon: Building2 },
      { label: "Agenda", href: "/agenda", icon: Calendar },
      { label: "Contactos", href: "/contactos", icon: Users },
      { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { label: "Asistente IA", href: "/asistente", icon: Bot },
      { label: "Studio IA", href: "/studio", icon: Sparkles },
      { label: "Marketing", href: "/marketing", icon: Megaphone },
      { label: "Documentos", href: "/documentos", icon: FileText },
    ],
  },
  {
    label: "Negocio",
    items: [
      { label: "Finanzas", href: "/finanzas", icon: Wallet },
      { label: "Análisis", href: "/analisis", icon: BarChart3 },
      { label: "Mi Sitio", href: "/sitio", icon: Globe },
      { label: "Mi Empresa", href: "/empresa", icon: Briefcase },
    ],
  },
];

export const ADMIN_NAV: readonly NavItemDef[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Usuarios", href: "/admin/users", icon: Users },
  { label: "Revenue", href: "/admin/revenue", icon: TrendingUp },
  { label: "Billing", href: "/admin/billing", icon: Receipt },
  { label: "Tickets", href: "/admin/soporte", icon: LifeBuoy },
  { label: "Generaciones IA", href: "/admin/generations", icon: Activity },
  { label: "Reseñas", href: "/admin/reviews", icon: Star },
  { label: "Fotos muestra", href: "/admin/muestras", icon: Images },
  { label: "Auditoría", href: "/admin/audit", icon: FileClock },
  { label: "Configuración", href: "/admin/settings", icon: Settings },
];
