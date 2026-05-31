"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { Map, Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/mapbox";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  Clock,
  ExternalLink,
  Footprints,
  Home,
  MapPin,
  Pin,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import type { Dict, Locale } from "@/lib/i18n/dictionary";
import { POI_TYPE_META, formatDistance, poiLabel, type PoiTypeKey } from "./poi-icons";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export type POIData = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  lat: number;
  lng: number;
  distanceM: number | null;
  walkMinutes: number | null;
  carMinutes: number | null;
  pinned: boolean;
  color: string | null;
};

export type PropertyMapProps = {
  property: {
    id: string;
    title: string;
    lat: number | null;
    lng: number | null;
    location: string | null;
  };
  pois: POIData[];
  /** Edit mode enables click-to-place / click-to-add-POI affordances. */
  editMode?: boolean;
  /** Called when user clicks the map in editMode and is in "addPoi" state. */
  onMapClick?: (lng: number, lat: number) => void;
  /** Called when user clicks a POI marker. */
  onPoiClick?: (poi: POIData) => void;
  /** Compact = smaller height (for property card preview); full = detail page. */
  variant?: "compact" | "full";
  /** Optional className for the outer wrapper. */
  className?: string;
};

export function PropertyMap({
  property,
  pois,
  editMode = false,
  onMapClick,
  onPoiClick,
  variant = "full",
  className,
}: PropertyMapProps) {
  const { t, locale } = useT();
  const [selectedPoi, setSelectedPoi] = useState<POIData | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const hasCoords = property.lat != null && property.lng != null;
  const propLng = hasCoords ? Number(property.lng) : null;
  const propLat = hasCoords ? Number(property.lat) : null;

  // react-map-gl v8 expects `longitude` / `latitude` (NOT lng/lat) in viewState
  const initialViewState = hasCoords
    ? { longitude: propLng!, latitude: propLat!, zoom: 15 }
    : { longitude: 0, latitude: 20, zoom: 1.5 }; // neutral global view when no coords

  // When property coordinates change (e.g. user just set them), recenter the map.
  // initialViewState is only respected on first mount, so we use flyTo on update.
  useEffect(() => {
    if (hasCoords && mapRef.current && propLng != null && propLat != null) {
      mapRef.current.flyTo({
        center: [propLng, propLat],
        zoom: 15,
        duration: 500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propLng, propLat]);

  const handleMapClick = useCallback(
    (e: { lngLat: { lng: number; lat: number } }) => {
      if (editMode && onMapClick) {
        onMapClick(e.lngLat.lng, e.lngLat.lat);
      }
    },
    [editMode, onMapClick]
  );

  function focusPoi(p: POIData) {
    setSelectedPoi(p);
    onPoiClick?.(p);
    mapRef.current?.flyTo({
      center: [p.lng, p.lat],
      zoom: Math.max(mapRef.current.getZoom(), 16),
      duration: 700,
    });
  }

  function recenterOnProperty() {
    if (!hasCoords || propLng == null || propLat == null) return;
    mapRef.current?.flyTo({
      center: [propLng, propLat],
      zoom: 15,
      duration: 700,
    });
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center",
          className
        )}
      >
        <div>
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">{t.propDialogs.mapboxTokenMissing}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.propDialogs.mapboxTokenHintPre} <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> {t.propDialogs.mapboxTokenHintPost}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border",
        variant === "compact" ? "h-[280px]" : "h-[520px] md:h-[600px]",
        className
      )}
    >
      <Map
        ref={(r) => {
          mapRef.current = r;
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        cursor={editMode ? "crosshair" : "grab"}
      >
        <NavigationControl position="top-right" />

        {/* Property marker */}
        {hasCoords && (
          <Marker
            longitude={Number(property.lng)}
            latitude={Number(property.lat)}
            anchor="bottom"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                recenterOnProperty();
              }}
              className="group relative flex flex-col items-center"
              aria-label={property.title}
            >
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/30 transition-transform group-hover:scale-110">
                <Home className="h-5 w-5" strokeWidth={2} />
                <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-primary/30" />
              </span>
              <span className="absolute -bottom-1.5 h-3 w-3 rotate-45 bg-primary" />
            </button>
          </Marker>
        )}

        {/* POI markers */}
        {pois.map((p) => {
          const meta = POI_TYPE_META[p.type as PoiTypeKey] ?? POI_TYPE_META.OTHER;
          const Icon = meta.icon;
          const color = p.color || meta.color;
          return (
            <Marker
              key={p.id}
              longitude={p.lng}
              latitude={p.lat}
              anchor="bottom"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  focusPoi(p);
                }}
                aria-label={p.name}
                className={cn(
                  "group flex flex-col items-center transition-transform hover:scale-110",
                  p.pinned && "scale-105"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white",
                    p.pinned && "ring-4 ring-amber-300"
                  )}
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span
                  className="-mt-1 h-3 w-3 rotate-45"
                  style={{ backgroundColor: color }}
                />
                {p.pinned && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-900 shadow ring-2 ring-white">
                    <Pin className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            </Marker>
          );
        })}

        {/* Selected POI popup */}
        {selectedPoi && (
          <Popup
            longitude={selectedPoi.lng}
            latitude={selectedPoi.lat}
            anchor="top"
            onClose={() => setSelectedPoi(null)}
            closeButton
            closeOnClick={false}
            maxWidth="320px"
            offset={28}
          >
            <PoiPopupContent poi={selectedPoi} t={t} locale={locale} />
          </Popup>
        )}
      </Map>

      {/* Floating "no coords" CTA overlay */}
      {!hasCoords && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-border bg-card p-5 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">{t.propDialogs.noLocation}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {editMode
                ? t.propDialogs.clickMapToSetLocation
                : t.propDialogs.noCoordsYet}
            </p>
          </div>
        </div>
      )}

      {/* Recenter button */}
      {hasCoords && (
        <button
          type="button"
          onClick={recenterOnProperty}
          className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-medium shadow-lg ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Building2 className="h-3.5 w-3.5 text-primary" />
          {t.propDialogs.centerProperty}
        </button>
      )}
    </div>
  );
}

// ============================================================
// POI POPUP CONTENT
// ============================================================

function PoiPopupContent({
  poi,
  t,
  locale,
}: {
  poi: POIData;
  t: Dict;
  locale: Locale;
}) {
  const meta = POI_TYPE_META[poi.type as PoiTypeKey] ?? POI_TYPE_META.OTHER;
  const Icon = meta.icon;
  const color = poi.color || meta.color;

  return (
    <div className="font-sans">
      {poi.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poi.imageUrl}
          alt=""
          className="mb-2 h-24 w-full rounded-md object-cover"
        />
      )}
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{poi.name}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            {poiLabel(poi.type, locale)}
          </p>
        </div>
      </div>

      {/* Distance + times row */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip icon={MapPin} label={formatDistance(poi.distanceM)} />
        {poi.walkMinutes != null && (
          <Chip
            icon={Footprints}
            label={`${poi.walkMinutes} min`}
            tone="muted"
          />
        )}
        {poi.carMinutes != null && (
          <Chip icon={Car} label={`${poi.carMinutes} min`} tone="muted" />
        )}
      </div>

      {poi.description && (
        <p className="mt-3 text-xs leading-relaxed text-foreground/85">
          {poi.description}
        </p>
      )}

      {poi.url && (
        <a
          href={poi.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t.propDialogs.seeMore}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function Chip({
  icon: I,
  label,
  tone = "primary",
}: {
  icon: typeof Clock;
  label: string;
  tone?: "primary" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        tone === "primary"
          ? "bg-primary/10 text-primary"
          : "bg-secondary text-foreground"
      )}
    >
      <I className="h-3 w-3" strokeWidth={2} />
      {label}
    </span>
  );
}
