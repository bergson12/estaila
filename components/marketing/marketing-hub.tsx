"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Megaphone, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

type Tab = "posts" | "digital" | "email";

export function MarketingHub({
  postsView,
  digitalView,
  emailView,
}: {
  postsView: React.ReactNode;
  digitalView: React.ReactNode;
  emailView: React.ReactNode;
}) {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>("digital");

  const TABS: { key: Tab; label: string; icon: typeof Share2; desc: string }[] = [
    {
      key: "digital",
      label: t.marketing.tabDigitalCards,
      icon: Share2,
      desc: t.marketing.tabDigitalCardsDesc,
    },
    {
      key: "email",
      label: t.marketing.tabEmailNewsletter,
      icon: Mail,
      desc: t.marketing.tabEmailNewsletterDesc,
    },
    {
      key: "posts",
      label: t.marketing.tabPosts,
      icon: Megaphone,
      desc: t.marketing.tabPostsDesc,
    },
  ];

  return (
    <div>
      {/* Tab pill bar */}
      <div className="mb-6 -mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card/40 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="marketing-hub-tab-bg"
                    className="absolute inset-0 rounded-lg bg-background shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "digital" && digitalView}
      {tab === "email" && emailView}
      {tab === "posts" && postsView}
    </div>
  );
}
