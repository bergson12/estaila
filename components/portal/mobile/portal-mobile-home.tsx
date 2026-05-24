"use client";

/**
 * Mobile-first portal home — inspired by modern real estate browser apps.
 *
 * Layout:
 *  - Sticky search header (location · bell · search input + filter)
 *  - Horizontal category chips
 *  - Featured "Suggested Listing" big card
 *  - 2-col grid of smaller property cards
 *  - Floating bottom nav (5 tabs)
 *
 * Uses CRM design tokens (Inter, primary blue, bg-card, border, rounded-xl).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Bell,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Car,
  Filter,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Star,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PortalData } from "../types";

const CATEGORIES = [
  { key: "ALL", label: "Todas", icon: Home },
  { key: "CASA", label: "Casa", icon: Home },
  { key: "APARTAMENTO", label: "Apto", icon: Building2 },
  { key: "VILLA", label: "Villa", icon: Home },
  { key: "PENTHOUSE", label: "Penthouse", icon: Building2 },
  { key: "LOCAL", label: "Local", icon: Building2 },
  { key: "SOLAR", label: "Solar", icon: MapPin },
] as const;

export function PortalMobileHome({ site, agent, properties }: PortalData) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const active = properties.filter(
    (p) => p.status !== "VENDIDA" && p.status !== "ALQUILADA"
  );

  const filtered = useMemo(() => {
    let arr = active;
    if (category !== "ALL") arr = arr.filter((p) => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [active, category, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  function toggleFav(id: string) {
    setFavorites((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="relative min-h-screen bg-background pb-24">
      {/* === STICKY SEARCH HEADER === */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 pb-3 pt-4">
          {/* Location + bell */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Ubicación
                </p>
                <p className="text-sm font-semibold leading-tight">
                  {site.title ?? agent.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-card/80"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
          </div>

          {/* Search + filter */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar propiedad..."
                className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"
              aria-label="Filtros"
            >
              <Filter className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Category chips — horizontal scroll */}
          <div className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 pb-1">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                      active
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* === CONTENT === */}
      <main className="mx-auto max-w-md px-4 py-5">
        {/* Featured (Suggested Listing) */}
        {featured && (
          <section className="mb-6">
            <SectionHeader title="Recomendación destacada" />
            <FeaturedCard
              property={featured}
              slug={site.slug}
              favorite={favorites.has(featured.id)}
              onToggleFav={() => toggleFav(featured.id)}
            />
          </section>
        )}

        {/* Grid suggestions */}
        {rest.length > 0 && (
          <section className="mb-6">
            <SectionHeader title="Más propiedades" sub={`${rest.length} disponibles`} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {rest.map((p) => (
                <PropertyGridCard
                  key={p.id}
                  property={p}
                  slug={site.slug}
                  favorite={favorites.has(p.id)}
                  onToggleFav={() => toggleFav(p.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <Home className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajusta los filtros o limpia la búsqueda.
            </p>
          </div>
        )}
      </main>

      {/* === FLOATING BOTTOM NAV === */}
      <BottomNav agent={agent} site={site} />
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      <button
        type="button"
        className="text-xs font-medium text-primary transition-opacity active:opacity-70"
      >
        Ver todo
      </button>
    </div>
  );
}

// ============================================================
// FEATURED CARD
// ============================================================

function FeaturedCard({
  property: p,
  slug,
  favorite,
  onToggleFav,
}: {
  property: PortalData["properties"][0];
  slug: string;
  favorite: boolean;
  onToggleFav: () => void;
}) {
  const price = p.priceUSD
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(p.priceUSD)
    : null;
  const isRent = p.operation === "EN_ALQUILER";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={`/p/${slug}/${p.id}`}
        className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all active:scale-[0.99]"
      >
        {/* Photo */}
        <div className="relative aspect-[16/12] overflow-hidden bg-muted">
          {p.featuredPhoto ? (
            <Image
              src={p.featuredPhoto}
              alt={p.title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            </div>
          )}

          {/* Category badge (top-left) */}
          <Badge className="absolute left-3 top-3 gap-1 border-0 bg-background/95 text-foreground backdrop-blur">
            <Home className="h-3 w-3 text-primary" strokeWidth={2} />
            {categoryLabel(p.category)}
          </Badge>

          {/* Fav (top-right) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFav();
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground backdrop-blur transition-all active:scale-90"
            aria-label="Favorito"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                favorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
              )}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Recomendación
              </p>
              <p className="mt-0.5 truncate text-base font-semibold tracking-tight">
                {p.title}
              </p>
              {p.location && (
                <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  <span className="truncate">{p.location}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              <Star className="h-3 w-3 fill-amber-500" strokeWidth={0} />
              4.8
            </div>
          </div>

          {/* Spec pills */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {p.bedrooms != null && p.bedrooms > 0 && (
              <SpecPill icon={BedDouble} label={`${p.bedrooms} hab`} />
            )}
            {p.bathrooms != null && (
              <SpecPill icon={Bath} label={`${p.bathrooms} baños`} />
            )}
            {p.parking != null && p.parking > 0 && (
              <SpecPill icon={Car} label={`${p.parking} parq`} />
            )}
          </div>

          {/* Price */}
          <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
            <div>
              {price ? (
                <p className="font-mono text-xl font-bold tabular-nums tracking-tight">
                  {price}
                  {isRent && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      / mes
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Consultar</p>
              )}
            </div>
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {isRent ? "Alquiler" : "Venta"}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SpecPill({
  icon: Icon,
  label,
}: {
  icon: typeof BedDouble;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      {label}
    </span>
  );
}

// ============================================================
// PROPERTY GRID CARD (2-col)
// ============================================================

function PropertyGridCard({
  property: p,
  slug,
  favorite,
  onToggleFav,
}: {
  property: PortalData["properties"][0];
  slug: string;
  favorite: boolean;
  onToggleFav: () => void;
}) {
  const price = p.priceUSD
    ? new Intl.NumberFormat("en-US", {
        notation: "compact",
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(p.priceUSD)
    : null;
  const isRent = p.operation === "EN_ALQUILER";

  return (
    <Link
      href={`/p/${slug}/${p.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all active:scale-[0.98]"
    >
      <div className="relative aspect-[1/1] overflow-hidden bg-muted">
        {p.featuredPhoto ? (
          <Image
            src={p.featuredPhoto}
            alt={p.title}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-8 w-8 text-muted-foreground/30" strokeWidth={1} />
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFav();
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/95 backdrop-blur transition-all active:scale-90"
          aria-label="Favorito"
        >
          <Heart
            className={cn(
              "h-3 w-3",
              favorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
            )}
            strokeWidth={2}
          />
        </button>
        {isRent && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            Renta
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-semibold tracking-tight">
          {p.title}
        </p>
        {p.location && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" strokeWidth={1.75} />
            <span className="truncate">{p.location}</span>
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          {price ? (
            <p className="font-mono text-sm font-bold tabular-nums">{price}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">Consultar</p>
          )}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {p.bedrooms != null && p.bedrooms > 0 && (
              <>
                <BedDouble className="h-2.5 w-2.5" strokeWidth={1.75} />
                <span>{p.bedrooms}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// FLOATING BOTTOM NAV
// ============================================================

function BottomNav({
  agent,
  site,
}: {
  agent: PortalData["agent"];
  site: PortalData["site"];
}) {
  const [tab, setTab] = useState<"home" | "saved" | "chat" | "visits" | "me">(
    "home"
  );

  const items = [
    { key: "home" as const, icon: Home, label: "Inicio" },
    { key: "saved" as const, icon: Heart, label: "Favoritos" },
    { key: "chat" as const, icon: MessageCircle, label: "Chat" },
    { key: "visits" as const, icon: Calendar, label: "Visitas" },
    { key: "me" as const, icon: User, label: "Yo" },
  ];

  function handleClick(k: typeof tab) {
    setTab(k);
    if (k === "chat" && site.whatsapp) {
      window.open(
        `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <nav className="flex items-center gap-1 rounded-full border border-border bg-background/95 p-1.5 shadow-xl backdrop-blur-xl">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => handleClick(it.key)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={it.label}
              title={it.label}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </button>
          );
        })}
        {/* Agent avatar at end */}
        <Avatar className="h-10 w-10 border-2 border-background ring-1 ring-border">
          {agent.image && <AvatarImage src={agent.image} alt={agent.name} />}
          <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
            {agent.name
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </nav>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function categoryLabel(cat: string): string {
  return (
    {
      CASA: "Casa",
      APARTAMENTO: "Apto",
      VILLA: "Villa",
      LOCAL: "Local",
      OFICINA: "Oficina",
      SOLAR: "Solar",
      PENTHOUSE: "Penthouse",
    } as Record<string, string>
  )[cat] ?? cat;
}
