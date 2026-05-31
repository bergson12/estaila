import Link from "next/link";
import { Bed, Bath, Car, Maximize2, MapPin, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { labelFor, CATEGORIES, OPERATIONS, PROPERTY_STATUSES } from "@/lib/constants";

type PropertyCardData = {
  id: string;
  title: string;
  featuredPhoto?: string | null;
  priceUSD?: number | string | null;
  priceDOP?: number | string | null;
  category: string;
  operation: string;
  status?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | string | null;
  parking?: number | null;
  metersSquared?: number | null;
  location?: string | null;
};

// Solid badges over photos — strong contrast on any background
const OP_BADGE: Record<string, string> = {
  EN_VENTA: "bg-emerald-500 text-white ring-emerald-600/30 shadow-md shadow-emerald-500/30",
  EN_ALQUILER: "bg-amber-500 text-white ring-amber-600/30 shadow-md shadow-amber-500/30",
  VENDIDA: "bg-stone-900 text-white ring-white/20 shadow-md shadow-black/30",
  ALQUILADA: "bg-rose-500 text-white ring-rose-600/30 shadow-md shadow-rose-500/30",
  CONSIGNACION: "bg-violet-500 text-white ring-violet-600/30 shadow-md shadow-violet-500/30",
};

export function PropertyCard({
  property: p,
  index,
  locale,
}: {
  property: PropertyCardData;
  index?: number;
  locale?: "es" | "en";
}) {
  return (
    <Link
      href={`/propiedades/${p.id}`}
      style={
        index !== undefined
          ? { animationDelay: `${Math.min(index, 12) * 40}ms` }
          : undefined
      }
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {p.featuredPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.featuredPhoto}
            alt={p.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-card">
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Subtle top gradient so badges always read */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent"
          aria-hidden
        />

        {/* Operation badge (solid color, strong contrast) */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${OP_BADGE[p.operation] ?? OP_BADGE.CONSIGNACION}`}
          >
            {labelFor(OPERATIONS, p.operation, locale)}
          </span>
          {p.status && p.status !== "NUEVO" && (
            <span className="inline-flex items-center rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white ring-1 ring-white/15 backdrop-blur-md">
              {labelFor(PROPERTY_STATUSES, p.status, locale)}
            </span>
          )}
        </div>

        {/* Category badge — dark glass for readability over any photo */}
        <span className="absolute right-3 top-3 inline-flex items-center rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
          {labelFor(CATEGORIES, p.category, locale)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {p.title}
          </h3>
        </div>

        <p className="font-mono text-xl font-bold tabular-nums text-foreground">
          {formatCurrency(Number(p.priceUSD ?? 0))}
        </p>

        {p.location && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {p.location}
          </p>
        )}

        {/* Metrics row */}
        <div className="mt-auto flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          {p.bedrooms != null && (
            <Metric icon={<Bed className="h-3.5 w-3.5" />} value={p.bedrooms} />
          )}
          {p.bathrooms != null && (
            <Metric
              icon={<Bath className="h-3.5 w-3.5" />}
              value={p.bathrooms.toString()}
            />
          )}
          {p.parking != null && (
            <Metric icon={<Car className="h-3.5 w-3.5" />} value={p.parking} />
          )}
          {p.metersSquared != null && (
            <Metric
              icon={<Maximize2 className="h-3.5 w-3.5" />}
              value={`${formatNumber(p.metersSquared)}m²`}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

function Metric({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: number | string;
}) {
  return (
    <span className="flex items-center gap-1 font-mono tabular-nums">
      {icon}
      {value}
    </span>
  );
}
