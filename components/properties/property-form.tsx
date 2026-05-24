"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, MapPin, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  looksLikeGoogleMapsUrl,
  parseGoogleMapsUrl,
} from "@/lib/maps-url-parser";
import { extractCoordsFromMapsUrl } from "@/lib/actions/poi";
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
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/shared/image-uploader";
import {
  LuxuryFieldsEditor,
  parseLuxuryFromProperty,
  type LuxuryFieldsValue,
} from "./luxury-fields-editor";
import { PropertySchema, type PropertyInput } from "@/lib/validations";
import { CATEGORIES, OPERATIONS, PROPERTY_STATUSES } from "@/lib/constants";
import {
  createProperty,
  updateProperty,
  deleteProperty,
  addPhotoToProperty,
} from "@/lib/actions/property";

type Initial = Partial<PropertyInput> & {
  id?: string;
  featuredPhoto?: string | null;
  initialPhotos?: string[];
  // Luxury fields persisted on Property (raw values from DB)
  premiumLanding?: boolean | null;
  customTagline?: string | null;
  videoUrl?: string | null;
  walkthroughUrl?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  amenities?: string;
  finishes?: string;
  nearbyPois?: string;
  floorPlans?: string;
};

export function PropertyForm({
  initial,
  ownerOptions,
  userPlan,
}: {
  initial?: Initial;
  ownerOptions: { value: string; label: string }[];
  userPlan?: string;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [photos, setPhotos] = useState<string[]>(
    initial?.initialPhotos ?? (initial?.featuredPhoto ? [initial.featuredPhoto] : [])
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startTransition] = useTransition();

  const [luxury, setLuxury] = useState<LuxuryFieldsValue>(() =>
    parseLuxuryFromProperty(initial ?? {})
  );
  const [extractingCoords, setExtractingCoords] = useState<
    "idle" | "loading" | "ok" | "fail"
  >("idle");

  const form = useForm<PropertyInput>({
    resolver: zodResolver(PropertySchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      category: initial?.category ?? "CASA",
      operation: initial?.operation ?? "EN_VENTA",
      status: initial?.status ?? "NUEVO",
      priceUSD: initial?.priceUSD,
      priceDOP: initial?.priceDOP,
      bedrooms: initial?.bedrooms,
      bathrooms: initial?.bathrooms,
      parking: initial?.parking,
      metersSquared: initial?.metersSquared,
      location: initial?.location ?? "",
      address: initial?.address ?? "",
      mapsUrl: initial?.mapsUrl ?? "",
      ownerId: initial?.ownerId ?? "",
      featuredPhoto: initial?.featuredPhoto ?? "",
      lat:
        initial?.lat != null && initial.lat !== ""
          ? Number(initial.lat)
          : undefined,
      lng:
        initial?.lng != null && initial.lng !== ""
          ? Number(initial.lng)
          : undefined,
    },
  });

  // ----------------------------------------------------------
  // Auto-extract lat/lng from a pasted Google Maps URL
  // ----------------------------------------------------------
  async function handleExtractCoords(raw?: string) {
    const url = (raw ?? form.getValues("mapsUrl") ?? "").trim();
    if (!url) {
      toast.error("Pega un link de Google Maps primero");
      return;
    }
    if (!looksLikeGoogleMapsUrl(url)) {
      setExtractingCoords("fail");
      toast.error("No parece un link de Google Maps");
      return;
    }
    // 1) Fast path: direct parse (long URLs)
    const local = parseGoogleMapsUrl(url);
    if (local) {
      form.setValue("lat", local.lat, { shouldDirty: true });
      form.setValue("lng", local.lng, { shouldDirty: true });
      setExtractingCoords("ok");
      toast.success(
        `Coordenadas extraídas: ${local.lat.toFixed(5)}, ${local.lng.toFixed(5)}`
      );
      return;
    }
    // 2) Short link: server-side redirect resolution
    setExtractingCoords("loading");
    try {
      const coords = await extractCoordsFromMapsUrl(url);
      if (coords) {
        form.setValue("lat", coords.lat, { shouldDirty: true });
        form.setValue("lng", coords.lng, { shouldDirty: true });
        setExtractingCoords("ok");
        toast.success(
          `Coordenadas extraídas: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        );
      } else {
        setExtractingCoords("fail");
        toast.error("No pude extraer coordenadas de ese link");
      }
    } catch (e) {
      setExtractingCoords("fail");
      toast.error((e as Error).message);
    }
  }

  async function onSubmit(values: PropertyInput) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        featuredPhoto: photos[0] ?? "",
        // Merge luxury fields
        premiumLanding: luxury.premiumLanding,
        customTagline: luxury.customTagline || undefined,
        videoUrl: luxury.videoUrl || undefined,
        walkthroughUrl: luxury.walkthroughUrl || undefined,
        lat: luxury.lat ? Number(luxury.lat) : undefined,
        lng: luxury.lng ? Number(luxury.lng) : undefined,
        amenities: JSON.stringify(luxury.amenities),
        finishes: JSON.stringify(luxury.finishes.filter((f) => f.trim())),
        nearbyPois: JSON.stringify(luxury.nearbyPois),
        floorPlans: JSON.stringify(luxury.floorPlans),
      };
      if (isEdit && initial?.id) {
        await updateProperty(initial.id, payload);
        // Add any new photos
        for (const url of photos) {
          if (!initial.initialPhotos?.includes(url)) {
            await addPhotoToProperty(initial.id, url, url === photos[0]);
          }
        }
        toast.success("Propiedad actualizada");
        router.push(`/propiedades/${initial.id}`);
        router.refresh();
      } else {
        const result = await createProperty(payload);
        // Save additional photos as Photo records
        for (const url of photos) {
          await addPhotoToProperty(result.id, url, url === photos[0]);
        }
        toast.success("Propiedad creada");
        router.push(`/propiedades/${result.id}`);
        router.refresh();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    startTransition(async () => {
      try {
        await deleteProperty(initial.id!);
        toast.success("Propiedad eliminada");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Información principal</h2>

            <div className="space-y-4">
              <Field label="Título *" error={errors.title?.message}>
                <Input
                  {...form.register("title")}
                  placeholder="Ej: Casa moderna en Los Rosales"
                />
              </Field>

              <Field label="Descripción">
                <Textarea
                  {...form.register("description")}
                  rows={4}
                  placeholder="Detalles, amenidades, características destacables..."
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Categoría *" error={errors.category?.message}>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Operación *" error={errors.operation?.message}>
                  <Controller
                    control={form.control}
                    name="operation"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Estado">
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_STATUSES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Características</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Habitaciones">
                <Input
                  type="number"
                  min={0}
                  {...form.register("bedrooms")}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label="Baños">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  {...form.register("bathrooms")}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label="Parqueos">
                <Input
                  type="number"
                  min={0}
                  {...form.register("parking")}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label="Metros² ">
                <Input
                  type="number"
                  min={0}
                  {...form.register("metersSquared")}
                  className="font-mono tabular-nums"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Precio</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Precio USD">
                <Input
                  type="number"
                  min={0}
                  {...form.register("priceUSD")}
                  placeholder="0"
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label="Precio DOP (opcional)">
                <Input
                  type="number"
                  min={0}
                  {...form.register("priceDOP")}
                  placeholder="0"
                  className="font-mono tabular-nums"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Ubicación</h2>
            <div className="space-y-4">
              <Field label="Sector / Ciudad">
                <Input
                  {...form.register("location")}
                  placeholder="Ej: Sector, Ciudad"
                />
              </Field>
              <Field label="Dirección completa">
                <Input
                  {...form.register("address")}
                  placeholder="Calle, número, sector, ciudad"
                />
              </Field>
              <Field label="Google Maps URL" error={errors.mapsUrl?.message}>
                <div className="flex gap-2">
                  <Input
                    {...form.register("mapsUrl")}
                    placeholder="https://maps.google.com/... o maps.app.goo.gl/..."
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && looksLikeGoogleMapsUrl(v) && extractingCoords === "idle") {
                        void handleExtractCoords(v);
                      }
                    }}
                    onPaste={(e) => {
                      const v = e.clipboardData.getData("text").trim();
                      if (v && looksLikeGoogleMapsUrl(v)) {
                        // Let the field update first
                        setTimeout(() => void handleExtractCoords(v), 50);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExtractCoords()}
                    disabled={extractingCoords === "loading"}
                  >
                    {extractingCoords === "loading" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : extractingCoords === "ok" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                {/* Hidden form fields — populated by extraction */}
                <input type="hidden" {...form.register("lat", { valueAsNumber: true })} />
                <input type="hidden" {...form.register("lng", { valueAsNumber: true })} />
                <CoordStatus
                  status={extractingCoords}
                  lat={form.watch("lat") as number | undefined}
                  lng={form.watch("lng") as number | undefined}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* SIDE */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Fotos</h2>
            <ImageUploader value={photos} onChange={setPhotos} maxFiles={12} />
            <p className="mt-3 text-xs text-muted-foreground">
              La primera foto se usa como portada.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">Propietario</h2>
            <Controller
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <Select
                  onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
                  value={field.value || "__none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin propietario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Sin propietario</SelectItem>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Sólo contactos tipo Propietario.
            </p>
          </Card>

          {/* Hint to luxury editor below */}
          <a
            href="#landing-personalizada"
            className="block rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 transition-all hover:border-primary/50 hover:shadow-md"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("landing-personalizada")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                Premium ↓
              </span>
            </div>
            <p className="text-xs font-semibold">Landing personalizada</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Más abajo: amenidades, acabados, planos, mapa Mapbox, video tour.
              Configura todo lo que potencia la landing pública.
            </p>
          </a>

          <div className="space-y-2">
            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEdit ? "Guardar cambios" : "Crear propiedad"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar propiedad
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* === Luxury Landing Editor (full-width below) === */}
      <div id="landing-personalizada" className="scroll-mt-20">
        <LuxuryFieldsEditor
          value={luxury}
          onChange={setLuxury}
          userPlan={userPlan}
        />
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar propiedad?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se borrarán también las fotos
              asociadas y los registros relacionados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function CoordStatus({
  status,
  lat,
  lng,
}: {
  status: "idle" | "loading" | "ok" | "fail";
  lat: number | undefined;
  lng: number | undefined;
}) {
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  if (status === "fail") {
    return (
      <p className="text-[11px] text-destructive">
        No reconocido. Acepta google.com/maps, goo.gl/maps, maps.app.goo.gl
      </p>
    );
  }
  if (hasCoords) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-success">
        <CheckCircle2 className="h-3 w-3" />
        Coordenadas{" "}
        <span className="font-mono tabular-nums">
          {lat!.toFixed(5)}, {lng!.toFixed(5)}
        </span>
      </p>
    );
  }
  return (
    <p className="text-[11px] text-muted-foreground">
      Pega un link de Google Maps y detectaremos lat/lng automáticamente.
    </p>
  );
}
