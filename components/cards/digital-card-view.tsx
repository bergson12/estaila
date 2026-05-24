"use client";

/**
 * Public Digital Card view (Linktree-style).
 * Mobile-first. Theme-aware. Auto-tracks view + per-link clicks.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  ExternalLink,
  Camera,
  Globe,
  Hash,
  Home,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";

// Lucide 1.16 lacks Facebook/Instagram/Twitter/Youtube — alias substitutes
const Facebook = Hash;
const Instagram = Camera;
const Twitter = Hash;
const Youtube = Video;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Link: LinkIcon,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MapPin,
  ExternalLink,
  Sparkles,
  Home,
  Building2,
};

type CardData = {
  id: string;
  slug: string;
  title: string;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  theme: string;
  primaryColor: string;
  accentColor: string | null;
  showProperties: boolean;
  showWhatsapp: boolean;
  links: {
    id: string;
    label: string;
    url: string;
    icon: string;
    imageUrl: string | null;
    description: string | null;
    color: string | null;
    highlight: boolean;
  }[];
};

type AgentInfo = {
  name: string;
  image: string | null;
  siteSlug: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
};

type PropertyLite = {
  id: string;
  title: string;
  featuredPhoto: string | null;
  priceUSD: number | null;
  location: string | null;
  operation: string;
};

export function DigitalCardView({
  card,
  agent,
  properties,
}: {
  card: CardData;
  agent: AgentInfo;
  properties: PropertyLite[];
}) {
  // Track view
  useEffect(() => {
    import("@/lib/actions/cards").then(({ trackCardView }) => {
      trackCardView(card.slug, document.referrer || undefined).catch(() => {});
    });
  }, [card.slug]);

  const themeClass = getThemeClass(card.theme);

  async function handleLinkClick(linkId: string) {
    import("@/lib/actions/cards").then(({ trackCardLinkClick }) => {
      trackCardLinkClick(linkId).catch(() => {});
    });
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: card.title,
          text: card.role ?? card.bio ?? "",
          url: window.location.href,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
  }

  // Auto-prepend WhatsApp if showWhatsapp + not in links
  const autoLinks: typeof card.links = [];
  if (card.showWhatsapp && agent.whatsapp) {
    autoLinks.push({
      id: `auto-wa`,
      label: "WhatsApp",
      url: `https://wa.me/${agent.whatsapp.replace(/\D/g, "")}`,
      icon: "MessageCircle",
      imageUrl: null,
      description: null,
      color: "#10B981",
      highlight: false,
    });
  }

  const allLinks = [...autoLinks, ...card.links];

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden",
        themeClass.background
      )}
      style={{
        ["--card-primary" as never]: card.primaryColor,
        ["--card-accent" as never]: card.accentColor ?? card.primaryColor,
      } as React.CSSProperties}
    >
      {/* Background flourish per theme */}
      {card.theme === "GLASS" && (
        <>
          <div
            className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: card.primaryColor }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-40 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: card.accentColor ?? card.primaryColor }}
            aria-hidden
          />
        </>
      )}
      {card.theme === "TROPICAL" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${card.primaryColor} 0%, transparent 40%), radial-gradient(circle at 80% 60%, ${card.accentColor ?? card.primaryColor} 0%, transparent 40%)`,
          }}
          aria-hidden
        />
      )}

      <div className="relative mx-auto max-w-md px-5 pb-16 pt-10 sm:px-6">
        {/* Share button — high contrast, always visible */}
        <div className="absolute right-5 top-5 z-20 sm:right-6">
          <button
            type="button"
            onClick={handleShare}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full shadow-lg ring-1 backdrop-blur-md transition-all active:scale-90",
              themeClass.shareButton
            )}
            aria-label="Compartir tarjeta"
          >
            <Share2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Cover (optional) */}
        {card.coverUrl && (
          <div className="relative mb-[-50px] aspect-[16/9] overflow-hidden rounded-2xl">
            <Image
              src={card.coverUrl}
              alt={card.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              priority
            />
          </div>
        )}

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className={cn(
            "relative mx-auto flex items-center justify-center",
            card.coverUrl && "mt-0"
          )}
        >
          <div
            className="relative rounded-full p-1 shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${card.primaryColor}, ${card.accentColor ?? card.primaryColor})`,
            }}
          >
            <Avatar className="h-24 w-24 ring-2 ring-background">
              {card.avatarUrl ? (
                <AvatarImage src={card.avatarUrl} alt={card.title} />
              ) : agent.image ? (
                <AvatarImage src={agent.image} alt={card.title} />
              ) : null}
              <AvatarFallback
                className="text-xl font-semibold text-white"
                style={{ background: card.primaryColor }}
              >
                {card.title
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        {/* Name + Role + Bio */}
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-5 text-center"
        >
          <h1
            className={cn(
              "text-2xl font-semibold tracking-tight",
              themeClass.text
            )}
          >
            {card.title}
          </h1>
          {card.role && (
            <p className={cn("mt-1 text-sm", themeClass.textMuted)}>
              {card.role}
            </p>
          )}
          {card.bio && (
            <p
              className={cn(
                "mx-auto mt-4 max-w-[40ch] text-sm leading-relaxed",
                themeClass.textMuted
              )}
            >
              {card.bio}
            </p>
          )}
        </motion.div>

        {/* Links */}
        {allLinks.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
            }}
            className="mt-8 space-y-2.5"
          >
            {allLinks.map((link) => {
              const Icon = ICONS[link.icon] ?? LinkIcon;
              const isExternal = /^https?:\/\//.test(link.url);
              const linkColor = link.color ?? card.primaryColor;
              const isBold = card.theme === "BOLD";
              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer noopener" : undefined}
                  onClick={() => !link.id.startsWith("auto-") && handleLinkClick(link.id)}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  whileTap={{ scale: 0.97 }}
                  whileHover={link.highlight ? { y: -2 } : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl p-3 transition-all",
                    !link.highlight && themeClass.link,
                    link.highlight && "highlight-link-3d"
                  )}
                  style={
                    link.highlight
                      ? undefined
                      : isBold
                        ? {
                            backgroundColor: linkColor,
                            color: contrastText(linkColor),
                          }
                        : undefined
                  }
                >
                  {/* Shine sweep for highlighted */}
                  {link.highlight && (
                    <span
                      className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
                      aria-hidden
                    >
                      <span className="absolute -inset-x-12 -top-2 h-[200%] -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />
                    </span>
                  )}
                  {link.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={link.imageUrl}
                      alt={link.label}
                      className={cn(
                        "relative z-10 h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-current/10",
                        isBold && "ring-white/20",
                        link.highlight && "ring-2 ring-amber-200/80 shadow-lg shadow-amber-900/30"
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        link.highlight
                          ? "bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 shadow-inner ring-1 ring-amber-300/50"
                          : isBold
                            ? "bg-white/20 text-current"
                            : themeClass.iconBg
                      )}
                      style={
                        !link.highlight && !isBold ? { color: linkColor } : undefined
                      }
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                  )}
                  <span className="relative z-10 min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "truncate text-sm font-semibold",
                          link.highlight && "font-bold tracking-tight"
                        )}
                      >
                        {link.label}
                      </span>
                      {link.highlight && (
                        <Sparkles
                          className="h-3 w-3 shrink-0 animate-pulse fill-amber-200 text-amber-200 drop-shadow"
                          strokeWidth={0}
                          aria-hidden
                        />
                      )}
                    </span>
                    {link.description && (
                      <span
                        className={cn(
                          "mt-0.5 line-clamp-1 text-[11px]",
                          link.highlight
                            ? "text-amber-100/90"
                            : isBold
                              ? "text-current/80"
                              : themeClass.textMuted
                        )}
                      >
                        {link.description}
                      </span>
                    )}
                  </span>
                  <ArrowUpRight
                    className={cn(
                      "relative z-10 h-4 w-4 shrink-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                      link.highlight
                        ? "text-amber-100 opacity-90 group-hover:opacity-100"
                        : "opacity-50 group-hover:opacity-100"
                    )}
                    strokeWidth={1.75}
                  />
                </motion.a>
              );
            })}
          </motion.div>
        )}

        {/* Properties featured */}
        {card.showProperties && properties.length > 0 && agent.siteSlug && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <h2
              className={cn(
                "mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em]",
                themeClass.textMuted
              )}
            >
              Propiedades destacadas
            </h2>
            <div className="space-y-2">
              {properties.map((p) => {
                const isRent = p.operation === "EN_ALQUILER";
                return (
                  <Link
                    key={p.id}
                    href={`/p/${agent.siteSlug}/${p.id}`}
                    className={cn(
                      "group flex gap-3 overflow-hidden rounded-2xl p-2.5 transition-all active:scale-[0.98]",
                      themeClass.propertyCard
                    )}
                  >
                    <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {p.featuredPhoto ? (
                        <Image
                          src={p.featuredPhoto}
                          alt={p.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-5 w-5 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <p className="line-clamp-1 text-sm font-semibold">{p.title}</p>
                      {p.location && (
                        <p className={cn("mt-0.5 truncate text-[11px]", themeClass.textMuted)}>
                          {p.location}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        {p.priceUSD ? (
                          <p className="font-mono text-sm font-bold tabular-nums">
                            ${p.priceUSD.toLocaleString()}
                            {isRent && (
                              <span className={cn("ml-0.5 text-[10px] font-normal", themeClass.textMuted)}>
                                /mes
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className={cn("text-xs", themeClass.textMuted)}>Consultar</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {agent.siteSlug && (
              <div className="mt-3 text-center">
                <Link
                  href={`/p/${agent.siteSlug}`}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    themeClass.textMuted
                  )}
                >
                  Ver todas →
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div
          className={cn(
            "mt-12 text-center text-[10px] uppercase tracking-wider",
            themeClass.textMuted
          )}
        >
          <p>
            Powered by{" "}
            <Link href="/welcome" className="font-semibold hover:underline">
              estaila
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// THEMES
// ============================================================

function getThemeClass(theme: string) {
  switch (theme) {
    case "DARK":
      return {
        background: "bg-zinc-950 text-zinc-50",
        text: "text-white",
        textMuted: "text-zinc-400",
        link: "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800",
        iconBg: "bg-zinc-800",
        shareButton: "bg-zinc-900 text-white ring-white/15 hover:bg-zinc-800",
        propertyCard: "bg-zinc-900/60 hover:bg-zinc-800/60 text-white",
      };
    case "GLASS":
      return {
        background: "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-50",
        text: "text-foreground",
        textMuted: "text-muted-foreground",
        link: "bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm hover:bg-white/80 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10",
        iconBg: "bg-white/40 dark:bg-white/10",
        shareButton: "bg-white text-zinc-900 ring-black/10 hover:bg-white/90 dark:bg-zinc-900 dark:text-white dark:ring-white/15 dark:hover:bg-zinc-800",
        propertyCard: "bg-white/60 backdrop-blur-xl border border-white/40 hover:bg-white/80 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10",
      };
    case "BOLD":
      return {
        background: "bg-background text-foreground",
        text: "text-foreground",
        textMuted: "text-muted-foreground",
        link: "shadow-md hover:shadow-lg transition-shadow",
        iconBg: "",
        shareButton: "bg-card text-foreground ring-foreground/15 hover:bg-card/80",
        propertyCard: "bg-card border border-border hover:border-foreground/20",
      };
    case "TROPICAL":
      return {
        background: "bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 text-emerald-950 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-800 dark:text-emerald-50",
        text: "text-emerald-950 dark:text-emerald-50",
        textMuted: "text-emerald-800/70 dark:text-emerald-200/70",
        link: "bg-white/70 backdrop-blur border border-emerald-200/40 hover:bg-white shadow-sm dark:bg-emerald-900/40 dark:border-emerald-700/40 dark:hover:bg-emerald-900/60",
        iconBg: "bg-emerald-100/60 dark:bg-emerald-800/40",
        shareButton: "bg-white ring-emerald-300/40 hover:bg-emerald-50 dark:bg-emerald-900 dark:ring-emerald-700/40 dark:hover:bg-emerald-800",
        propertyCard: "bg-white/70 backdrop-blur border border-emerald-200/40 hover:bg-white dark:bg-emerald-900/40",
      };
    case "MINIMAL":
    default:
      return {
        background: "bg-background text-foreground",
        text: "text-foreground",
        textMuted: "text-muted-foreground",
        link: "bg-card border border-border hover:border-foreground/20 hover:bg-card/80",
        iconBg: "bg-muted",
        shareButton: "bg-card text-foreground border border-border hover:bg-card/80",
        propertyCard: "bg-card border border-border hover:border-foreground/20",
      };
  }
}

function contrastText(hex: string): string {
  // simple luminance check
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0F172A" : "#FFFFFF";
}
