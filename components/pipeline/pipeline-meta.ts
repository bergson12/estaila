import {
  CheckCircle2,
  Handshake,
  MessageCircle,
  MapPin,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type StageKey =
  | "NUEVO"
  | "CONTACTADO"
  | "VISITA"
  | "NEGOCIACION"
  | "CERRADO"
  | "PERDIDO";

export type StageMeta = {
  key: StageKey;
  label: string;
  icon: LucideIcon;
  /** Accent bar gradient (Tailwind `from-X to-Y`) on column top */
  accent: string;
  /** Soft tint background for column body */
  tint: string;
  /** Pill color for stage label chip */
  chip: string;
  /** Solid color hex (used for inline styles / progress) */
  hex: string;
};

export const STAGE_META: Record<StageKey, StageMeta> = {
  NUEVO: {
    key: "NUEVO",
    label: "Nuevo",
    icon: Sparkles,
    accent: "from-slate-400 to-slate-500",
    tint: "bg-slate-500/[0.04]",
    chip: "bg-slate-500/15 text-slate-500 ring-slate-500/30",
    hex: "#64748b",
  },
  CONTACTADO: {
    key: "CONTACTADO",
    label: "Contactado",
    icon: MessageCircle,
    accent: "from-sky-400 to-blue-500",
    tint: "bg-sky-500/[0.04]",
    chip: "bg-sky-500/15 text-sky-500 ring-sky-500/30",
    hex: "#0ea5e9",
  },
  VISITA: {
    key: "VISITA",
    label: "Visita",
    icon: MapPin,
    accent: "from-amber-400 to-orange-500",
    tint: "bg-amber-500/[0.04]",
    chip: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
    hex: "#f59e0b",
  },
  NEGOCIACION: {
    key: "NEGOCIACION",
    label: "Negociación",
    icon: Handshake,
    accent: "from-violet-400 to-purple-500",
    tint: "bg-violet-500/[0.04]",
    chip: "bg-violet-500/15 text-violet-400 ring-violet-500/30",
    hex: "#8b5cf6",
  },
  CERRADO: {
    key: "CERRADO",
    label: "Cerrado",
    icon: CheckCircle2,
    accent: "from-emerald-400 to-green-500",
    tint: "bg-emerald-500/[0.04]",
    chip: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
    hex: "#10b981",
  },
  PERDIDO: {
    key: "PERDIDO",
    label: "Perdido",
    icon: XCircle,
    accent: "from-rose-400 to-red-500",
    tint: "bg-rose-500/[0.03]",
    chip: "bg-rose-500/15 text-rose-500 ring-rose-500/30",
    hex: "#f43f5e",
  },
};

export const STAGE_ORDER: StageKey[] = [
  "NUEVO",
  "CONTACTADO",
  "VISITA",
  "NEGOCIACION",
  "CERRADO",
  "PERDIDO",
];

/** Active stages (excludes terminal states) */
export const ACTIVE_STAGES: StageKey[] = [
  "NUEVO",
  "CONTACTADO",
  "VISITA",
  "NEGOCIACION",
];

export function metaFor(stage: string): StageMeta {
  return STAGE_META[stage as StageKey] ?? STAGE_META.NUEVO;
}
