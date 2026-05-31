"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deletePOI,
  setPropertyCoordinates,
  togglePinPOI,
} from "@/lib/actions/poi";
import { POI_TYPE_META, formatDistance, poiLabel, type PoiTypeKey } from "./poi-icons";
import { POIDialog } from "./poi-dialog";
import { PropertyMap, type POIData } from "./property-map";
import { SuggestNearbyDialog } from "./suggest-dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import type { Dict, Locale } from "@/lib/i18n/dictionary";

export type MapTabProps = {
  property: {
    id: string;
    title: string;
    location: string | null;
    lat: number | null;
    lng: number | null;
  };
  pois: POIData[];
};

type DialogState =
  | { open: false }
  | { open: true; mode: "create"; defaultLat?: number; defaultLng?: number }
  | { open: true; mode: "edit"; poi: POIData };

export function MapTab({ property, pois }: MapTabProps) {
  const router = useRouter();
  const { t, locale } = useT();
  const [pending, startTransition] = useTransition();
  const [editPropMode, setEditPropMode] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [suggestOpen, setSuggestOpen] = useState(false);
  const hasCoords = property.lat != null && property.lng != null;

  const pinnedPois = pois.filter((p) => p.pinned);
  const otherPois = pois.filter((p) => !p.pinned);

  function handleMapClick(lng: number, lat: number) {
    if (editPropMode) {
      startTransition(async () => {
        try {
          await setPropertyCoordinates(property.id, lat, lng);
          toast.success(t.propDialogs.propLocationUpdated);
          setEditPropMode(false);
          router.refresh();
        } catch (e) {
          toast.error((e as Error).message);
        }
      });
      return;
    }
    // Otherwise: open create POI dialog pre-filled with these coords
    setDialog({ open: true, mode: "create", defaultLat: lat, defaultLng: lng });
  }

  function handleDelete(id: string) {
    if (!confirm(t.propDialogs.deletePlaceConfirm)) return;
    startTransition(async () => {
      try {
        await deletePOI(id);
        toast.success(t.propDialogs.placeDeleted);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleTogglePin(id: string) {
    startTransition(async () => {
      try {
        await togglePinPOI(id);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      {/* MAP */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {t.propDialogs.mapAndNearby}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.propDialogs.mapHint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={editPropMode ? "default" : "outline"}
              onClick={() => setEditPropMode((v) => !v)}
              disabled={pending}
              className="h-9 rounded-full"
            >
              {pending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Target className="mr-1.5 h-3.5 w-3.5" />
              )}
              {editPropMode ? t.propDialogs.clickToLocate : t.propDialogs.setLocation}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSuggestOpen(true)}
              disabled={!hasCoords || pending}
              title={
                !hasCoords
                  ? t.propDialogs.setLocationFirst
                  : t.propDialogs.autoDetectTitle
              }
              className="h-9 rounded-full"
            >
              <Wand2 className="mr-1.5 h-3.5 w-3.5 text-primary" />
              {t.propDialogs.autoDetect}
              <Sparkles className="ml-1 h-3 w-3 text-primary/70" />
            </Button>
            <Button
              size="sm"
              onClick={() => setDialog({ open: true, mode: "create" })}
              className="h-9 rounded-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t.propDialogs.addPlace}
            </Button>
          </div>
        </div>

        {editPropMode && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-3 py-2 text-xs text-foreground">
            <Target className="h-3.5 w-3.5 text-primary" />
            {t.propDialogs.clickMapToSetLocation}
            <button
              type="button"
              onClick={() => setEditPropMode(false)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              {t.propDialogs.cancel}
            </button>
          </div>
        )}

        <PropertyMap
          property={property}
          pois={pois}
          editMode={editPropMode || (!editPropMode && pois.length >= 0)}
          onMapClick={(lng, lat) => handleMapClick(lng, lat)}
          variant="full"
        />

        {pinnedPois.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Pin className="h-3 w-3" />
              {t.propDialogs.featured}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {pinnedPois.map((p) => (
                <FeaturedChip key={p.id} poi={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* LIST */}
      <Card className="rounded-2xl border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t.propDialogs.placesCount} ({pois.length})</h3>
            <p className="text-xs text-muted-foreground">
              {t.propDialogs.placesSubtitle}
            </p>
          </div>
        </div>

        {pois.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t.propDialogs.noPlacesYet}</p>
            <p className="max-w-[26ch] text-xs text-muted-foreground">
              {t.propDialogs.noPlacesHint}
            </p>
            <Button
              size="sm"
              onClick={() => setDialog({ open: true, mode: "create" })}
              className="mt-2 rounded-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t.propDialogs.firstPlace}
            </Button>
          </div>
        ) : (
          <ul className="-mr-1 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {pois.map((p) => (
              <PoiListItem
                key={p.id}
                poi={p}
                onEdit={() => setDialog({ open: true, mode: "edit", poi: p })}
                onDelete={() => handleDelete(p.id)}
                onTogglePin={() => handleTogglePin(p.id)}
                pending={pending}
                t={t}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </Card>

      {/* Dialog */}
      {dialog.open && dialog.mode === "create" && (
        <POIDialog
          open
          onOpenChange={(b) => !b && setDialog({ open: false })}
          mode={{
            kind: "create",
            propertyId: property.id,
            defaultLat: dialog.defaultLat,
            defaultLng: dialog.defaultLng,
          }}
        />
      )}
      {dialog.open && dialog.mode === "edit" && (
        <POIDialog
          open
          onOpenChange={(b) => !b && setDialog({ open: false })}
          mode={{ kind: "edit", poi: dialog.poi }}
        />
      )}

      <SuggestNearbyDialog
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        propertyId={property.id}
        propertyHasCoords={hasCoords}
      />
    </div>
  );
}

// ============================================================
// POI LIST ITEM
// ============================================================

function PoiListItem({
  poi,
  onEdit,
  onDelete,
  onTogglePin,
  pending,
  t,
  locale,
}: {
  poi: POIData;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  pending: boolean;
  t: Dict;
  locale: Locale;
}) {
  const meta = POI_TYPE_META[poi.type as PoiTypeKey] ?? POI_TYPE_META.OTHER;
  const Icon = meta.icon;
  const color = poi.color || meta.color;

  return (
    <li
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-background",
        poi.pinned && "border-amber-500/30 bg-amber-500/[0.04]"
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{poi.name}</p>
          {poi.pinned && (
            <Badge className="rounded-full bg-amber-500/15 px-1.5 py-0 text-[9px] text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
              <Pin className="mr-0.5 h-2.5 w-2.5" />
              {t.propDialogs.top}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{poiLabel(poi.type, locale)}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
            <MapPin className="h-2.5 w-2.5" />
            {formatDistance(poi.distanceM)}
          </span>
          {poi.walkMinutes != null && (
            <span className="font-mono text-[10px] text-muted-foreground">
              · {poi.walkMinutes} min
            </span>
          )}
        </div>
        {poi.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/85">
            {poi.description}
          </p>
        )}
        {poi.url && (
          <a
            href={poi.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            {t.propDialogs.seeMore}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onTogglePin}
          disabled={pending}
          aria-label={poi.pinned ? t.propDialogs.unpin : t.propDialogs.pin}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary",
            poi.pinned ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
          )}
        >
          {poi.pinned ? (
            <PinOff className="h-3.5 w-3.5" />
          ) : (
            <Pin className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={pending}
          aria-label={t.propDialogs.edit}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          aria-label={t.propDialogs.delete}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

// ============================================================
// FEATURED CHIP (summary row of pinned POIs)
// ============================================================

function FeaturedChip({ poi }: { poi: POIData }) {
  const meta = POI_TYPE_META[poi.type as PoiTypeKey] ?? POI_TYPE_META.OTHER;
  const Icon = meta.icon;
  const color = poi.color || meta.color;

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/40 p-2.5">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{poi.name}</p>
        <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {formatDistance(poi.distanceM)}
        </p>
      </div>
    </div>
  );
}
