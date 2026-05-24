"use client";

import {
  Loader2,
  MapPin,
  Pin,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPOI,
  extractCoordsFromMapsUrl,
  updatePOI,
} from "@/lib/actions/poi";
import {
  looksLikeGoogleMapsUrl,
  parseGoogleMapsUrl,
} from "@/lib/maps-url-parser";
import { POI_TYPE_META, type PoiTypeKey } from "./poi-icons";
import { cn } from "@/lib/utils";
import type { POIData } from "./property-map";

type Mode =
  | { kind: "create"; propertyId: string; defaultLat?: number; defaultLng?: number }
  | { kind: "edit"; poi: POIData };

export function POIDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  mode: Mode;
}) {
  const isEdit = mode.kind === "edit";
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(isEdit ? mode.poi.name : "");
  const [type, setType] = useState<PoiTypeKey>(
    isEdit ? ((mode.poi.type as PoiTypeKey) ?? "OTHER") : "RESTAURANT"
  );
  const [description, setDescription] = useState(
    isEdit ? mode.poi.description ?? "" : ""
  );
  const [url, setUrl] = useState(isEdit ? mode.poi.url ?? "" : "");
  const [imageUrl, setImageUrl] = useState(isEdit ? mode.poi.imageUrl ?? "" : "");
  const [lat, setLat] = useState<string>(
    isEdit
      ? String(mode.poi.lat)
      : mode.kind === "create" && mode.defaultLat != null
        ? String(mode.defaultLat)
        : ""
  );
  const [lng, setLng] = useState<string>(
    isEdit
      ? String(mode.poi.lng)
      : mode.kind === "create" && mode.defaultLng != null
        ? String(mode.defaultLng)
        : ""
  );
  const [walkMinutes, setWalkMinutes] = useState<string>(
    isEdit ? (mode.poi.walkMinutes?.toString() ?? "") : ""
  );
  const [carMinutes, setCarMinutes] = useState<string>(
    isEdit ? (mode.poi.carMinutes?.toString() ?? "") : ""
  );
  const [pinned, setPinned] = useState<boolean>(isEdit ? mode.poi.pinned : false);
  const [color, setColor] = useState<string>(
    isEdit ? (mode.poi.color ?? "") : ""
  );
  const [mapsUrl, setMapsUrl] = useState<string>("");
  const [extractStatus, setExtractStatus] = useState<
    "idle" | "loading" | "ok" | "fail"
  >("idle");

  async function handleMapsUrlExtract(raw: string) {
    setMapsUrl(raw);
    if (!raw.trim()) {
      setExtractStatus("idle");
      return;
    }
    if (!looksLikeGoogleMapsUrl(raw)) {
      setExtractStatus("fail");
      return;
    }
    // 1) Try client-side direct parse first (fast for long URLs)
    const local = parseGoogleMapsUrl(raw);
    if (local) {
      setLat(String(local.lat));
      setLng(String(local.lng));
      setExtractStatus("ok");
      toast.success("Coordenadas extraídas del link");
      return;
    }
    // 2) Short link → server action follows redirect
    setExtractStatus("loading");
    try {
      const coords = await extractCoordsFromMapsUrl(raw);
      if (coords) {
        setLat(String(coords.lat));
        setLng(String(coords.lng));
        setExtractStatus("ok");
        toast.success("Coordenadas extraídas del link");
      } else {
        setExtractStatus("fail");
        toast.error("No pude extraer coordenadas de ese link");
      }
    } catch (e) {
      setExtractStatus("fail");
      toast.error((e as Error).message);
    }
  }

  // Reset state on open when mode changes
  useEffect(() => {
    if (!open) return;
    if (mode.kind === "create") {
      setName("");
      setType("RESTAURANT");
      setDescription("");
      setUrl("");
      setImageUrl("");
      setLat(mode.defaultLat != null ? String(mode.defaultLat) : "");
      setLng(mode.defaultLng != null ? String(mode.defaultLng) : "");
      setWalkMinutes("");
      setCarMinutes("");
      setPinned(false);
      setColor("");
      setMapsUrl("");
      setExtractStatus("idle");
    } else {
      setName(mode.poi.name);
      setType((mode.poi.type as PoiTypeKey) ?? "OTHER");
      setDescription(mode.poi.description ?? "");
      setUrl(mode.poi.url ?? "");
      setImageUrl(mode.poi.imageUrl ?? "");
      setLat(String(mode.poi.lat));
      setLng(String(mode.poi.lng));
      setWalkMinutes(mode.poi.walkMinutes?.toString() ?? "");
      setCarMinutes(mode.poi.carMinutes?.toString() ?? "");
      setPinned(mode.poi.pinned);
      setColor(mode.poi.color ?? "");
      setMapsUrl("");
      setExtractStatus("idle");
    }
  }, [open, mode]);

  function submit() {
    if (!name.trim()) {
      toast.error("Ponle un nombre al lugar.");
      return;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isFinite(latNum) || !isFinite(lngNum)) {
      toast.error("Coordenadas inválidas.");
      return;
    }
    const payload = {
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      lat: latNum,
      lng: lngNum,
      walkMinutes: walkMinutes ? parseInt(walkMinutes, 10) : undefined,
      carMinutes: carMinutes ? parseInt(carMinutes, 10) : undefined,
      pinned,
      color: color || undefined,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updatePOI(mode.poi.id, payload);
          toast.success("Lugar actualizado");
        } else {
          await createPOI(mode.propertyId, payload);
          toast.success("Lugar agregado");
        }
        onOpenChange(false);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const meta = POI_TYPE_META[type];
  const Icon = meta.icon;
  const previewColor = color || meta.color;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {isEdit ? "Editar lugar" : "Agregar lugar cercano"}
          </DialogTitle>
          <DialogDescription>
            Pin con icono y datos. Aparece en el mapa de la propiedad.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="my-2 flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: previewColor }}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {name || "Nuevo lugar"}
            </p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {meta.label}
            </p>
          </div>
          {pinned && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              <Pin className="h-3 w-3" />
              Destacado
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre *" className="sm:col-span-2">
            <Input
              placeholder="Ej. Bvlgari Hotel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              autoFocus
            />
          </Field>

          <Field label="Tipo">
            <Select value={type} onValueChange={(v) => setType(v as PoiTypeKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(POI_TYPE_META) as PoiTypeKey[]).map((k) => {
                  const m = POI_TYPE_META[k];
                  const I = m.icon;
                  return (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">
                        <I className="h-3.5 w-3.5" style={{ color: m.color }} />
                        {m.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Color (opcional)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color || meta.color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent"
              />
              <Input
                placeholder={meta.color}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                maxLength={7}
              />
            </div>
          </Field>

          <Field label="Link Google Maps (autorelleno)" className="sm:col-span-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pega aquí el link de Google Maps..."
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  onPaste={(e) => {
                    const txt = e.clipboardData.getData("text");
                    if (txt && looksLikeGoogleMapsUrl(txt)) {
                      e.preventDefault();
                      handleMapsUrlExtract(txt);
                    }
                  }}
                  onBlur={() =>
                    mapsUrl.trim() && handleMapsUrlExtract(mapsUrl)
                  }
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleMapsUrlExtract(mapsUrl)}
                disabled={extractStatus === "loading" || !mapsUrl.trim()}
              >
                {extractStatus === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : extractStatus === "ok" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  "Extraer"
                )}
              </Button>
            </div>
            {extractStatus === "fail" && (
              <p className="text-[11px] text-destructive">
                Link no reconocido. Acepta google.com/maps, goo.gl/maps,
                maps.app.goo.gl
              </p>
            )}
            {extractStatus === "ok" && (
              <p className="text-[11px] text-success">
                ✓ Coordenadas detectadas. Puedes ajustar abajo si quieres.
              </p>
            )}
          </Field>

          <Field label="Latitud *">
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="18.4861"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </Field>

          <Field label="Longitud *">
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="-69.9312"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </Field>

          <Field label="A pie (min)">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="8"
              value={walkMinutes}
              onChange={(e) => setWalkMinutes(e.target.value)}
            />
          </Field>

          <Field label="En auto (min)">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="3"
              value={carMinutes}
              onChange={(e) => setCarMinutes(e.target.value)}
            />
          </Field>

          <Field label="URL (opcional)" className="sm:col-span-2">
            <Input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>

          <Field label="Imagen (URL, opcional)" className="sm:col-span-2">
            <Input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </Field>

          <Field label="Descripción (opcional)" className="sm:col-span-2">
            <Textarea
              placeholder="Hotel 5 estrellas con beach club…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={800}
              rows={3}
            />
          </Field>

          <div className="sm:col-span-2">
            <label
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card/40 p-3 transition-colors",
                pinned && "border-amber-500/40 bg-amber-500/[0.06]"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    pinned
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Pin className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-medium">Destacado</p>
                  <p className="text-[11px] text-muted-foreground">
                    Aparece más grande en el mapa y en el resumen
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-amber-500"
              />
            </label>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Agregar lugar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
