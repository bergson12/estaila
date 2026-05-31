"use client";

import {
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Phone,
  Sparkles,
  Wand2,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { bulkCreatePOIs, suggestNearbyPlaces } from "@/lib/actions/poi";
import type { PoiType } from "@/lib/places/poi-types";
import { POI_TYPE_META, formatDistance, poiLabel, type PoiTypeKey } from "./poi-icons";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import type { Dict, Locale } from "@/lib/i18n/dictionary";

type Suggestion = {
  externalId: string;
  name: string;
  type: PoiType;
  lat: number;
  lng: number;
  distanceM: number;
  website: string | null;
  phone: string | null;
  alreadyAdded: boolean;
};

const RADIUS_OPTIONS = [
  { label: "750 m", value: 750 },
  { label: "1.5 km", value: 1500 },
  { label: "3 km", value: 3000 },
];

export function SuggestNearbyDialog({
  open,
  onOpenChange,
  propertyId,
  propertyHasCoords,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  propertyId: string;
  propertyHasCoords: boolean;
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [radius, setRadius] = useState(1500);
  const [saving, startSave] = useTransition();
  const [touched, setTouched] = useState(false);

  // Fetch when dialog opens
  useEffect(() => {
    if (!open) {
      setTouched(false);
      return;
    }
    if (!propertyHasCoords) return;
    void load(radius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function load(r: number) {
    setLoading(true);
    setSuggestions([]);
    setSelected(new Set());
    try {
      const data = (await suggestNearbyPlaces(propertyId, {
        radius: r,
      })) as Suggestion[];
      setSuggestions(data);
      // Pre-select close + named ones that aren't already added
      const preselect = new Set<string>();
      for (const s of data) {
        if (!s.alreadyAdded && s.distanceM <= 800) {
          preselect.add(s.externalId);
        }
      }
      setSelected(preselect);
      setTouched(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(type: PoiType, fully: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of suggestions) {
        if (s.type === type && !s.alreadyAdded) {
          if (fully) next.add(s.externalId);
          else next.delete(s.externalId);
        }
      }
      return next;
    });
  }

  const grouped = useMemo(() => {
    const map = new Map<PoiType, Suggestion[]>();
    for (const s of suggestions) {
      const arr = map.get(s.type) ?? [];
      arr.push(s);
      map.set(s.type, arr);
    }
    return map;
  }, [suggestions]);

  function selectAll() {
    setSelected(
      new Set(suggestions.filter((s) => !s.alreadyAdded).map((s) => s.externalId))
    );
  }
  function selectNone() {
    setSelected(new Set());
  }

  function save() {
    const items = suggestions
      .filter((s) => selected.has(s.externalId))
      .map((s) => ({
        name: s.name,
        type: s.type,
        lat: s.lat,
        lng: s.lng,
        url: s.website ?? undefined,
      }));
    if (items.length === 0) {
      toast.error(t.propDialogs.selectAtLeastOne);
      return;
    }
    startSave(async () => {
      try {
        const res = await bulkCreatePOIs(propertyId, items);
        toast.success(
          `${res.created} ${res.created === 1 ? t.propDialogs.placeAddedToMap : t.propDialogs.placesAddedToMap}`
        );
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Wand2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              {t.propDialogs.detectNearby}
            </DialogTitle>
            <DialogDescription>
              {t.propDialogs.detectNearbyDesc}
            </DialogDescription>
          </DialogHeader>

          {!propertyHasCoords ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">{t.propDialogs.needLocateProperty}</p>
              <p className="max-w-[40ch] text-xs text-muted-foreground">
                {t.propDialogs.needLocateHint}
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-2 rounded-full"
              >
                {t.propDialogs.gotIt}
              </Button>
            </div>
          ) : (
            <>
              {/* Radius + actions toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{t.propDialogs.radius}</span>
                  <div className="inline-flex overflow-hidden rounded-full border border-border bg-card">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => {
                          setRadius(r.value);
                          void load(r.value);
                        }}
                        disabled={loading || saving}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium transition-colors",
                          r.value === radius
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={loading || suggestions.length === 0}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    {t.propDialogs.all}
                  </button>
                  <span className="text-muted-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={selectNone}
                    disabled={loading || selected.size === 0}
                    className="text-muted-foreground hover:underline disabled:opacity-50"
                  >
                    {t.propDialogs.none}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                  <LoadingSkeleton label={t.propDialogs.queryingOSM} />
                ) : !touched ? null : suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                      <XIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">{t.propDialogs.noResults}</p>
                    <p className="max-w-[36ch] text-xs text-muted-foreground">
                      {t.propDialogs.noResultsHint}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-5">
                    {Array.from(grouped.entries()).map(([type, items]) => {
                      const meta =
                        POI_TYPE_META[type as PoiTypeKey] ?? POI_TYPE_META.OTHER;
                      const Icon = meta.icon;
                      const selectableCount = items.filter(
                        (i) => !i.alreadyAdded
                      ).length;
                      const selectedInCat = items.filter((i) =>
                        selected.has(i.externalId)
                      ).length;
                      const allSelected =
                        selectableCount > 0 && selectedInCat === selectableCount;
                      return (
                        <li key={type}>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                                style={{ backgroundColor: meta.color }}
                              >
                                <Icon className="h-3 w-3" strokeWidth={2} />
                              </span>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {poiLabel(type, locale)} · {items.length}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                toggleCategory(type, !allSelected)
                              }
                              disabled={selectableCount === 0}
                              className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40"
                            >
                              {allSelected ? t.propDialogs.removeCategory : t.propDialogs.all}
                            </button>
                          </div>
                          <ul className="space-y-1.5">
                            {items.map((s) => (
                              <SuggestionRow
                                key={s.externalId}
                                suggestion={s}
                                checked={selected.has(s.externalId)}
                                onToggle={() => toggle(s.externalId)}
                                t={t}
                              />
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <DialogFooter className="border-t border-border bg-card/40 px-6 py-3">
                <div className="mr-auto text-xs text-muted-foreground">
                  {selected.size > 0
                    ? `${selected.size} ${selected.size === 1 ? t.propDialogs.selectedSingular : t.propDialogs.selectedPlural}`
                    : t.propDialogs.selectPlacesToAdd}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  {t.propDialogs.cancel}
                </Button>
                <Button onClick={save} disabled={saving || selected.size === 0}>
                  {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  {t.propDialogs.add} {selected.size > 0 ? `(${selected.size})` : ""}
                </Button>
              </DialogFooter>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// SUGGESTION ROW
// ============================================================

function SuggestionRow({
  suggestion: s,
  checked,
  onToggle,
  t,
}: {
  suggestion: Suggestion;
  checked: boolean;
  onToggle: () => void;
  t: Dict;
}) {
  const meta = POI_TYPE_META[s.type as PoiTypeKey] ?? POI_TYPE_META.OTHER;
  const Icon = meta.icon;
  const disabled = s.alreadyAdded;
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors",
          checked && "border-primary/40 bg-primary/[0.05]",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={disabled ? undefined : onToggle}
          disabled={disabled}
          aria-label={`${t.propDialogs.selectVerb} ${s.name}`}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        />
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: meta.color }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{s.name}</p>
            {disabled && (
              <Badge className="rounded-full bg-emerald-500/15 px-1.5 py-0 text-[9px] text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                {t.propDialogs.alreadyAdded}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 font-mono text-primary tabular-nums">
              {formatDistance(s.distanceM)}
            </span>
            {s.phone && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Phone className="h-2.5 w-2.5" />
                {s.phone}
              </span>
            )}
            {s.website && (
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                {t.propDialogs.web}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>
      </label>
    </li>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 p-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">
          {label}
        </p>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
          {[0, 1].map((j) => (
            <div
              key={j}
              className="flex gap-3 rounded-xl border border-border bg-background/40 p-3"
            >
              <div className="h-4 w-4 animate-pulse rounded bg-secondary" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
