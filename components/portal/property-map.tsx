"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useMemo, useState } from "react";
import { Map, Marker, NavigationControl } from "react-map-gl/maplibre";
import { motion } from "motion/react";

/**
 * PropertyMap — interactive map for property landing.
 *
 * By default uses MapLibre with a free clean tile style (no token needed).
 * To use Mapbox instead: set NEXT_PUBLIC_MAPBOX_TOKEN in .env and swap import to
 * `react-map-gl/mapbox`. The Map prop `mapStyle` accepts Mapbox styles too.
 */

const FREE_LIGHT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const FREE_DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function PropertyMap({
  lat,
  lng,
  accent = "#B8956A",
  dark = false,
  zoom = 14,
  height = "100%",
  showControls = true,
}: {
  lat: number;
  lng: number;
  accent?: string;
  dark?: boolean;
  zoom?: number;
  height?: string;
  showControls?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  const mapStyle = useMemo(
    () =>
      // Allow override via env (e.g. user provides Mapbox style URL)
      process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
      (dark ? FREE_DARK_STYLE : FREE_LIGHT_STYLE),
    [dark]
  );

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--lux-bg-alt,var(--muted))] text-xs text-[var(--lux-fg-muted,var(--muted-foreground))]">
        Mapa no disponible
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Map
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom,
        }}
        mapStyle={mapStyle}
        style={{ width: "100%", height }}
        attributionControl={false}
        onError={(e) => setError(e.error.message)}
      >
        {showControls && (
          <NavigationControl position="bottom-right" showCompass={false} />
        )}
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.3,
            }}
            className="flex flex-col items-center"
          >
            {/* Pulsing halo */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              className="absolute -bottom-1 h-8 w-8 rounded-full"
              style={{ backgroundColor: accent, opacity: 0.4 }}
            />
            {/* Pin */}
            <div className="relative">
              <svg
                width="28"
                height="36"
                viewBox="0 0 28 36"
                fill="none"
                className="drop-shadow-lg"
              >
                <path
                  d="M14 0C6.27 0 0 6.27 0 14C0 24 14 36 14 36C14 36 28 24 28 14C28 6.27 21.73 0 14 0Z"
                  fill={accent}
                />
                <circle cx="14" cy="14" r="5" fill="white" />
              </svg>
            </div>
          </motion.div>
        </Marker>
      </Map>
    </div>
  );
}
