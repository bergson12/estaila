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
import { CATEGORIES, OPERATIONS, PROPERTY_STATUSES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
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
  const { t, locale } = useT();
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
      toast.error(t.propForm.toastPasteFirst);
      return;
    }
    if (!looksLikeGoogleMapsUrl(url)) {
      setExtractingCoords("fail");
      toast.error(t.propForm.toastNotMapsLink);
      return;
    }
    // 1) Fast path: direct parse (long URLs)
    const local = parseGoogleMapsUrl(url);
    if (local) {
      form.setValue("lat", local.lat, { shouldDirty: true });
      form.setValue("lng", local.lng, { shouldDirty: true });
      setExtractingCoords("ok");
      toast.success(
        `${t.propForm.toastCoordsExtracted} ${local.lat.toFixed(5)}, ${local.lng.toFixed(5)}`
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
          `${t.propForm.toastCoordsExtracted} ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        );
      } else {
        setExtractingCoords("fail");
        toast.error(t.propForm.toastCoordsFail);
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
        toast.success(t.propForm.toastUpdated);
        router.push(`/propiedades/${initial.id}`);
        router.refresh();
      } else {
        const result = await createProperty(payload);
        // Save additional photos as Photo records
        for (const url of photos) {
          await addPhotoToProperty(result.id, url, url === photos[0]);
        }
        toast.success(t.propForm.toastCreated);
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
        toast.success(t.propForm.toastDeleted);
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
            <h2 className="mb-4 text-sm font-semibold">{t.propForm.mainInfo}</h2>

            <div className="space-y-4">
              <Field label={t.propForm.titleLabel} error={errors.title?.message}>
                <Input
                  {...form.register("title")}
                  placeholder={t.propForm.titlePlaceholder}
                />
              </Field>

              <Field label={t.propForm.descriptionLabel}>
                <Textarea
                  {...form.register("description")}
                  rows={4}
                  placeholder={t.propForm.descriptionPlaceholder}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label={t.propForm.categoryLabel} error={errors.category?.message}>
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
                              {labelFor(CATEGORIES, c.value, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label={t.propForm.operationLabel} error={errors.operation?.message}>
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
                              {labelFor(OPERATIONS, c.value, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label={t.propForm.statusLabel}>
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
                              {labelFor(PROPERTY_STATUSES, c.value, locale)}
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
            <h2 className="mb-4 text-sm font-semibold">{t.propForm.features}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label={t.propForm.bedrooms}>
                <Input
                  type="number"
                  min={0}
                  {...form.register("bedrooms")}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label={t.propForm.bathrooms}>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  {...form.register("bathrooms")}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label={t.propForm.parking}>
                <Input
                  type="number"
                  min={0}
                  {...form.register("parking")}
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label={t.propForm.metersSquared}>
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
            <h2 className="mb-4 text-sm font-semibold">{t.propForm.price}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t.propForm.priceUSD}>
                <Input
                  type="number"
                  min={0}
                  {...form.register("priceUSD")}
                  placeholder="0"
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label={t.propForm.priceDOP}>
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
            <h2 className="mb-4 text-sm font-semibold">{t.propForm.location}</h2>
            <div className="space-y-4">
              <Field label={t.propForm.sectorCity}>
                <Input
                  {...form.register("location")}
                  placeholder={t.propForm.sectorCityPlaceholder}
                />
              </Field>
              <Field label={t.propForm.fullAddress}>
                <Input
                  {...form.register("address")}
                  placeholder={t.propForm.fullAddressPlaceholder}
                />
              </Field>
              <Field label={t.propForm.mapsUrlLabel} error={errors.mapsUrl?.message}>
                <div className="flex gap-2">
                  <Input
                    {...form.register("mapsUrl")}
                    placeholder={t.propForm.mapsUrlPlaceholder}
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
                  failText={t.propForm.coordsFailHint}
                  coordsLabel={t.propForm.coordsLabel}
                  idleText={t.propForm.coordsIdleHint}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* SIDE */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">{t.propForm.photos}</h2>
            <ImageUploader value={photos} onChange={setPhotos} maxFiles={12} />
            <p className="mt-3 text-xs text-muted-foreground">
              {t.propForm.photosHint}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold">{t.propForm.owner}</h2>
            <Controller
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <Select
                  onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
                  value={field.value || "__none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.propForm.noOwner} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">{t.propForm.noOwner}</SelectItem>
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
              {t.propForm.ownerHint}
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
                {t.propForm.premiumBadge}
              </span>
            </div>
            <p className="text-xs font-semibold">{t.propForm.customLanding}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {t.propForm.customLandingHint}
            </p>
          </a>

          <div className="space-y-2">
            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEdit ? t.propForm.saveChanges : t.propForm.createProperty}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.back()}
            >
              {t.propForm.cancel}
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.propForm.deleteProperty}
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
            <DialogTitle>{t.propForm.deleteDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.propForm.deleteDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              {t.propForm.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t.propForm.deleteConfirm}
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
  failText,
  coordsLabel,
  idleText,
}: {
  status: "idle" | "loading" | "ok" | "fail";
  lat: number | undefined;
  lng: number | undefined;
  failText: string;
  coordsLabel: string;
  idleText: string;
}) {
  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  if (status === "fail") {
    return (
      <p className="text-[11px] text-destructive">
        {failText}
      </p>
    );
  }
  if (hasCoords) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-success">
        <CheckCircle2 className="h-3 w-3" />
        {coordsLabel}{" "}
        <span className="font-mono tabular-nums">
          {lat!.toFixed(5)}, {lng!.toFixed(5)}
        </span>
      </p>
    );
  }
  return (
    <p className="text-[11px] text-muted-foreground">
      {idleText}
    </p>
  );
}
