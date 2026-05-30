"use client";

/**
 * ReviewForm — formulario de reseña para cuentas tester.
 *
 * Opinión positiva / negativa / puntos de mejora + calificación 1-5 por cada
 * módulo + capturas anotadas (marcas + texto, vía ImageAnnotator). Las capturas
 * se aplanan a PNG y se suben a /api/upload antes de enviar.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ImagePlus,
  Lightbulb,
  Loader2,
  Send,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_MODULES } from "@/lib/modules";
import { submitTesterReview } from "@/lib/actions/tester-review";
import { ImageAnnotator } from "./image-annotator";

type ReviewImage = {
  imageUrl: string;
  moduleId: string | null;
  caption: string;
  annotations: string;
};

function Stars({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
          aria-label={`${n} estrellas`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

const textareaCls =
  "min-h-[88px] w-full resize-y rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20";
const inputCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export function ReviewForm({ defaultModule }: { defaultModule?: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [positive, setPositive] = useState("");
  const [negative, setNegative] = useState("");
  const [improvements, setImprovements] = useState("");
  const [overall, setOverall] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [annotatorSrc, setAnnotatorSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-pick same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen.");
      return;
    }
    setAnnotatorSrc(URL.createObjectURL(file));
  }

  async function onAnnotated(r: { dataUrl: string; annotations: string }) {
    const src = annotatorSrc;
    setAnnotatorSrc(null);
    if (src) URL.revokeObjectURL(src);
    setUploading(true);
    try {
      const blob = await (await fetch(r.dataUrl)).blob();
      const fd = new FormData();
      fd.append("file", blob, "captura-anotada.png");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo subir la imagen.");
      }
      const { url } = await res.json();
      setImages((arr) => [
        ...arr,
        { imageUrl: url, moduleId: defaultModule ?? null, caption: "", annotations: r.annotations },
      ]);
      toast.success("Captura agregada.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function updateImage(i: number, patch: Partial<ReviewImage>) {
    setImages((arr) => arr.map((im, idx) => (idx === i ? { ...im, ...patch } : im)));
  }

  async function submit() {
    const ratingList = Object.entries(ratings)
      .filter(([, v]) => v > 0)
      .map(([moduleId, rating]) => ({
        moduleId,
        rating,
        note: notes[moduleId]?.trim() || null,
      }));

    if (
      !positive.trim() &&
      !negative.trim() &&
      !improvements.trim() &&
      ratingList.length === 0 &&
      images.length === 0
    ) {
      toast.error("Agrega al menos una opinión, calificación o captura.");
      return;
    }

    setSubmitting(true);
    try {
      await submitTesterReview({
        positive: positive.trim() || null,
        negative: negative.trim() || null,
        improvements: improvements.trim() || null,
        overall: overall || null,
        ratings: ratingList,
        images: images.map((im) => ({
          imageUrl: im.imageUrl,
          moduleId: im.moduleId,
          caption: im.caption.trim() || null,
          annotations: im.annotations || null,
        })),
      });
      toast.success("¡Reseña enviada! Gracias por tu feedback.");
      setPositive("");
      setNegative("");
      setImprovements("");
      setOverall(0);
      setRatings({});
      setNotes({});
      setImages([]);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Opiniones */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <ThumbsUp className="h-4 w-4" /> Lo positivo
          </label>
          <textarea
            className={textareaCls}
            value={positive}
            onChange={(e) => setPositive(e.target.value)}
            placeholder="¿Qué te gustó o funcionó bien?"
            maxLength={4000}
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
            <ThumbsDown className="h-4 w-4" /> Lo negativo
          </label>
          <textarea
            className={textareaCls}
            value={negative}
            onChange={(e) => setNegative(e.target.value)}
            placeholder="¿Qué no te gustó o falló?"
            maxLength={4000}
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-600">
            <Lightbulb className="h-4 w-4" /> Puntos de mejora
          </label>
          <textarea
            className={textareaCls}
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="¿Qué mejorarías y cómo?"
            maxLength={4000}
          />
        </div>
      </div>

      {/* Calificación global */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Calificación global</p>
          <p className="text-xs text-muted-foreground">Tu impresión general del sistema</p>
        </div>
        <Stars value={overall} onChange={setOverall} size={28} />
      </div>

      {/* Calificación por módulo */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Calificación por módulo</p>
        <div className="divide-y divide-border">
          {APP_MODULES.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-[140px]">
                <span className="text-sm font-medium text-foreground">{m.label}</span>
                <span className="ml-2 text-[11px] uppercase tracking-wide text-muted-foreground/60">
                  {m.group}
                </span>
              </div>
              <div className="flex flex-1 items-center gap-3 sm:justify-end">
                <input
                  className={cn(inputCls, "max-w-[260px]")}
                  placeholder="Nota opcional…"
                  value={notes[m.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [m.id]: e.target.value }))}
                  maxLength={500}
                />
                <Stars
                  value={ratings[m.id] ?? 0}
                  onChange={(v) => setRatings((r) => ({ ...r, [m.id]: v }))}
                  size={18}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capturas anotadas */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Capturas para mejoras visuales</p>
            <p className="text-xs text-muted-foreground">
              Sube un screenshot y marca los errores con cajas, flechas y texto.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={pickFile} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-1.5 h-4 w-4" />
            )}
            Agregar captura
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileSelected}
          />
        </div>

        {images.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            Aún no agregaste capturas.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((im, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.imageUrl} alt={`Captura ${i + 1}`} className="aspect-video w-full object-cover" />
                <div className="space-y-2 p-3">
                  <select
                    className={inputCls}
                    value={im.moduleId ?? ""}
                    onChange={(e) => updateImage(i, { moduleId: e.target.value || null })}
                  >
                    <option value="">¿De qué módulo es?</option>
                    {APP_MODULES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputCls}
                    placeholder="Describe el problema…"
                    value={im.caption}
                    onChange={(e) => updateImage(i, { caption: e.target.value })}
                    maxLength={500}
                  />
                  <button
                    type="button"
                    onClick={() => setImages((arr) => arr.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={submit} disabled={submitting} size="lg">
          {submitting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-4 w-4" />
          )}
          Enviar reseña
        </Button>
      </div>

      {annotatorSrc && (
        <ImageAnnotator
          imageUrl={annotatorSrc}
          onCancel={() => {
            const s = annotatorSrc;
            setAnnotatorSrc(null);
            if (s) URL.revokeObjectURL(s);
          }}
          onConfirm={onAnnotated}
        />
      )}
    </div>
  );
}
