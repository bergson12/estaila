"use client";

import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Eye,
  Loader2,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  analyzePhoto,
  type PhotoAnalysis,
} from "@/lib/actions/analyze-image";
import { useStudio } from "./studio-context";

// Map server tool key → studio route
const TOOL_ROUTE: Record<string, string> = {
  STAGING: "/studio/staging",
  DECLUTTER: "/studio/declutter",
  ENHANCE: "/studio/enhance",
  STYLE_CHANGE: "/studio/style",
  SKY: "/studio/sky",
  TWILIGHT: "/studio/twilight",
  POOL: "/studio/pool",
  LAWN: "/studio/lawn",
};

const TOOL_LABEL: Record<string, string> = {
  STAGING: "Virtual Staging",
  DECLUTTER: "Eliminar Objetos",
  ENHANCE: "Mejorar Calidad",
  STYLE_CHANGE: "Cambiar Estilo",
  SKY: "Cielo Despejado",
  TWILIGHT: "Atardecer",
  POOL: "Piscina",
  LAWN: "Césped",
};

export function PhotoAnalysis({ imageUrl }: { imageUrl: string | null }) {
  const studio = useStudio();
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState<string | null>(null);

  // Reset when image changes — but do NOT auto-run the analysis (saves Gemini tokens
  // until the user explicitly asks).
  useEffect(() => {
    if (!imageUrl || imageUrl !== lastAnalyzedUrl) {
      setAnalysis(null);
    }
  }, [imageUrl, lastAnalyzedUrl]);

  async function runAnalysis() {
    if (!imageUrl || loading) return;
    setLoading(true);
    setCollapsed(false);
    try {
      const r = await analyzePhoto(imageUrl);
      setAnalysis(r);
      setLastAnalyzedUrl(imageUrl);
      // Push to context so the sidebar can auto-apply matching options
      if (r.available) {
        studio.setSuggestion({
          roomType: r.roomType,
          suggestedTool: r.suggestedTool,
          suggestedStyle: r.suggestedStyle,
          buyerTarget: r.buyerTarget,
          appliedAt: Date.now(),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (!imageUrl) return null;

  // Initial state — show CTA card prompting the user to analyze (no API call yet).
  if (!analysis && !loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Brain className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">
              ¿Analizar foto con IA?
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Detecta habitación, estilo y recomienda la mejor herramienta. Gratis.
            </p>
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Analizar
          </button>
        </div>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {(loading || analysis) && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
            {loading ? (
              <div className="flex items-center gap-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Analizando foto con IA...</p>
                  <p className="text-xs text-muted-foreground">
                    Detectando habitación, estilo, y oportunidades de mejora
                  </p>
                </div>
              </div>
            ) : analysis ? (
              <AnalysisContent
                analysis={analysis}
                collapsed={collapsed}
                onToggle={() => setCollapsed((c) => !c)}
                imageUrl={imageUrl ?? ""}
              />
            ) : null}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AnalysisContent({
  analysis,
  collapsed,
  onToggle,
  imageUrl,
}: {
  analysis: PhotoAnalysis;
  collapsed: boolean;
  onToggle: () => void;
  imageUrl: string;
}) {
  if (!analysis.available) {
    const isQuota = analysis.error === "QUOTA_EXHAUSTED";
    const isAuth = analysis.error === "AUTH";
    const hasError = !!analysis.error;
    return (
      <div className="flex items-start gap-3 text-sm">
        {hasError ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <Brain className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-muted-foreground">
            {isQuota
              ? "Análisis IA en pausa"
              : isAuth
                ? "Análisis IA deshabilitado"
                : hasError
                  ? "No se pudo analizar la foto"
                  : "Análisis IA no configurado"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isQuota ? (
              <>
                Créditos del Modelo Pro agotados. Recarga en{" "}
                <a
                  href="https://ai.studio/projects"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                >
                  ai.studio/projects
                </a>{" "}
                o genera una nueva key en proyecto sin billing (free tier).
              </>
            ) : isAuth ? (
              <>
                La conexión con el Modelo Pro falló. Verifica en{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                >
                  aistudio.google.com/apikey
                </a>
                .
              </>
            ) : hasError ? (
              <>{analysis.oneLineDescription}</>
            ) : (
              <>
                Define <code className="rounded bg-muted px-1 text-[10px]">GEMINI_API_KEY</code> en{" "}
                <code className="rounded bg-muted px-1 text-[10px]">.env</code> para activar análisis automático de fotos.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Brain className="h-3.5 w-3.5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              Análisis con Modelo Pro
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                Visión
              </span>
            </p>
            <p className="mt-0.5 text-xs italic text-muted-foreground line-clamp-2">
              {analysis.oneLineDescription}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 rounded px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {collapsed ? "Detalles" : "Ocultar"}
        </button>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5">
        <Chip icon={Eye} label={analysis.roomType} />
        {analysis.isEmpty && (
          <Chip
            icon={CheckCircle2}
            label="Vacío · ideal staging"
            color="emerald"
          />
        )}
        {analysis.currentStyle && (
          <Chip label={`Estilo: ${analysis.currentStyle}`} />
        )}
        <Chip
          icon={Star}
          label={`Calidad: ${analysis.qualityScore}/10`}
          color={
            analysis.qualityScore >= 8
              ? "emerald"
              : analysis.qualityScore >= 5
                ? "amber"
                : "rose"
          }
        />
        {analysis.buyerTarget && (
          <Chip icon={Target} label={analysis.buyerTarget} />
        )}
      </div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden space-y-3 border-t border-primary/15 pt-3"
        >
          {/* Issues */}
          {analysis.qualityIssues.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="-mt-0.5 mr-1 inline h-3 w-3 text-amber-500" />
                Issues detectados
              </p>
              <ul className="space-y-0.5">
                {analysis.qualityIssues.map((iss) => (
                  <li
                    key={iss}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                    {iss}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestion — clickable */}
          <SuggestionCTA analysis={analysis} imageUrl={imageUrl} />
        </motion.div>
      )}
    </div>
  );
}

function SuggestionCTA({
  analysis,
  imageUrl,
}: {
  analysis: PhotoAnalysis;
  imageUrl: string;
}) {
  const router = useRouter();
  const route = TOOL_ROUTE[analysis.suggestedTool] ?? "/studio";
  const toolLabel =
    TOOL_LABEL[analysis.suggestedTool] ?? analysis.suggestedTool;

  function apply() {
    // Pass photo + style as query params; the studio context picks them up
    const params = new URLSearchParams({ photoUrl: imageUrl });
    if (analysis.suggestedStyle) params.set("style", analysis.suggestedStyle);
    if (analysis.buyerTarget) params.set("buyer", analysis.buyerTarget);
    router.push(`${route}?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={apply}
      className="group flex w-full items-start justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/10"
    >
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" />
          Recomendación de la IA
        </p>
        <p className="text-xs leading-relaxed">
          Aplica{" "}
          <span className="font-semibold text-primary">{toolLabel}</span>
          {analysis.suggestedStyle && (
            <>
              {" "}con estilo{" "}
              <span className="font-semibold text-primary">
                {analysis.suggestedStyle}
              </span>
            </>
          )}{" "}
          para maximizar el atractivo de esta foto.
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Tap para abrir {toolLabel.toLowerCase()} con esta foto cargada
        </p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Chip({
  icon: Icon,
  label,
  color,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  color?: "emerald" | "amber" | "rose";
}) {
  const colorClass = {
    emerald: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  }[color ?? "emerald"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        color
          ? colorClass
          : "border-border bg-card text-foreground"
      )}
    >
      {Icon && <Icon className="h-2.5 w-2.5" strokeWidth={1.75} />}
      {label}
    </span>
  );
}
