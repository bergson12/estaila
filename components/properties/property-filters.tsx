"use client";

import {
  Search,
  X,
  LayoutGrid,
  Home,
  Building2,
  TreePine,
  Trees,
  Store,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES, OPERATIONS, PROPERTY_STATUSES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  CASA: Home,
  APARTAMENTO: Building2,
  SOLAR: TreePine,
  TERRENO: Trees,
  LOCAL_COMERCIAL: Store,
};

type Counts = {
  total: number;
  byCategory: Record<string, number>;
  byOperation: Record<string, number>;
};

export function PropertyFilters({ counts }: { counts: Counts }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { t, locale } = useT();
  const [, startTransition] = useTransition();

  const q = sp.get("q") ?? "";
  const cat = sp.get("cat") ?? "";
  const op = sp.get("op") ?? "";
  const status = sp.get("status") ?? "";

  const [search, setSearch] = useState(q);

  // Debounced search update
  useEffect(() => {
    const t = setTimeout(() => {
      if (search === q) return;
      const params = new URLSearchParams(sp);
      if (search) params.set("q", search);
      else params.delete("q");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp);
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const hasFilters = useMemo(
    () => !!(q || cat || op || status),
    [q, cat, op, status]
  );

  function clearAll() {
    setSearch("");
    startTransition(() => router.push(pathname));
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.properties.searchPlaceholder}
          className="pl-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => setSearch("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterPill
          active={!cat}
          onClick={() => setParam("cat", "")}
          icon={LayoutGrid}
          label={t.properties.all}
          count={counts.total}
        />
        {CATEGORIES.map((c) => {
          const n = counts.byCategory[c.value] ?? 0;
          if (n === 0 && cat !== c.value) return null;
          const Icon = CATEGORY_ICONS[c.value];
          return (
            <FilterPill
              key={c.value}
              active={cat === c.value}
              onClick={() => setParam("cat", c.value === cat ? "" : c.value)}
              icon={Icon}
              label={labelFor(CATEGORIES, c.value, locale)}
              count={n}
            />
          );
        })}
      </div>

      {/* Operation + Status row */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <FilterDropdown
          label={t.properties.operation}
          value={op}
          options={[
            { value: "", label: t.properties.all },
            ...OPERATIONS.map((o) => ({
              value: o.value,
              label: `${labelFor(OPERATIONS, o.value, locale)} (${counts.byOperation[o.value] ?? 0})`,
            })),
          ]}
          onChange={(v) => setParam("op", v)}
        />
        <FilterDropdown
          label={t.properties.status}
          value={status}
          options={[
            { value: "", label: t.properties.allMasc },
            ...PROPERTY_STATUSES.map((s) => ({
              value: s.value,
              label: labelFor(PROPERTY_STATUSES, s.value, locale),
            })),
          ]}
          onChange={(v) => setParam("status", v)}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={clearAll}
          >
            {t.properties.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary/40 bg-primary/15 text-primary shadow-sm shadow-primary/10"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5 transition-transform group-hover:scale-110",
            active ? "text-primary" : ""
          )}
          strokeWidth={1.75}
        />
      )}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] tabular-nums",
            active
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-card px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
