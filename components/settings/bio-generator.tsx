"use client";

import { Check, Copy, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateAgentBio } from "@/lib/actions/ai-text";
import { cn } from "@/lib/utils";

type Tone = "professional" | "friendly" | "luxury" | "caribbean";
type Length = "short" | "medium" | "long";

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: "professional", label: "Profesional", emoji: "💼" },
  { value: "friendly", label: "Amigable", emoji: "😊" },
  { value: "luxury", label: "Luxury", emoji: "💎" },
  { value: "caribbean", label: "Caribeño", emoji: "🌴" },
];

const LENGTHS: { value: Length; label: string; desc: string }[] = [
  { value: "short", label: "Corta", desc: "60-80 palabras" },
  { value: "medium", label: "Media", desc: "120-150 palabras" },
  { value: "long", label: "Larga", desc: "200-250 palabras" },
];

export function BioGenerator({
  onApply,
}: {
  onApply?: (bio: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-primary/30 bg-primary/5 hover:bg-primary/10"
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
        Generar bio con IA
      </Button>
      {open && <Modal onClose={() => setOpen(false)} onApply={onApply} />}
    </>
  );
}

function Modal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply?: (bio: string) => void;
}) {
  const [tone, setTone] = useState<Tone>("professional");
  const [length, setLength] = useState<Length>("medium");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setResult(null);
    try {
      const out = await generateAgentBio({ tone, length, extra: extra.trim() || undefined });
      setResult(out);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    toast.success("Bio copiada al portapapeles");
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold">Bio con IA</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tono
        </p>
        <div className="mb-3 grid grid-cols-4 gap-1.5">
          {TONES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md border p-2 text-[10px] font-medium transition-colors",
                tone === t.value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <span className="text-base leading-none">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Longitud
        </p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {LENGTHS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLength(l.value)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md border p-2 text-[10px] font-medium transition-colors",
                length === l.value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <span>{l.label}</span>
              <span className="text-[9px] opacity-70">{l.desc}</span>
            </button>
          ))}
        </div>

        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Detalles extra (opcional)
        </p>
        <Textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Ej: 8 años en mercado de Punta Cana, especializado en luxury beachfront, hablo español/inglés/portugués..."
          rows={3}
          maxLength={300}
          className="mb-4 text-xs"
        />

        <Button onClick={go} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          {loading ? "Generando..." : "Generar bio"}
        </Button>

        {result && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Resultado
            </p>
            <p className="text-sm leading-relaxed">{result}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {onApply && (
                <Button
                  onClick={() => {
                    onApply(result);
                    toast.success("Bio aplicada — guardalá para conservarla");
                    onClose();
                  }}
                  size="sm"
                >
                  <Check className="mr-1.5 h-3 w-3" />
                  Usar esta bio
                </Button>
              )}
              <Button onClick={copy} size="sm" variant="outline">
                <Copy className="mr-1.5 h-3 w-3" />
                Copiar
              </Button>
              <Button onClick={go} size="sm" variant="ghost">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Regenerar
              </Button>
            </div>
            {!onApply && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Copia esta bio y pégala donde la necesites.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
