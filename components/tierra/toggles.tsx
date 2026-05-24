"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Languages } from "lucide-react";
import { useLang } from "@/components/marketing-site/language-context";
import { cn } from "@/lib/utils";

// ============================================================
// THEME TOGGLE — light/dark with editorial labels
// ============================================================

export function TierraThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? resolvedTheme ?? theme ?? "light" : "light";
  const isDark = current === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "tierra-mono group inline-flex items-center gap-2 border border-current/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors hover:border-current/80",
        className
      )}
    >
      <span className="relative h-3 w-3">
        <Sun
          className={cn(
            "absolute inset-0 h-3 w-3 transition-all",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
          strokeWidth={1.5}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-3 w-3 transition-all",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
          strokeWidth={1.5}
        />
      </span>
      <span>{isDark ? "Noche" : "Día"}</span>
    </button>
  );
}

// ============================================================
// LANGUAGE TOGGLE — ES / EN
// ============================================================

export function TierraLangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "tierra-mono inline-flex items-center border border-current/30 text-[10px] font-medium uppercase tracking-[0.18em]",
        className
      )}
    >
      <Languages
        className="ml-3 mr-2 h-3 w-3 opacity-60"
        strokeWidth={1.5}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => setLang("es")}
        aria-pressed={lang === "es"}
        className={cn(
          "px-2 py-1.5 transition-colors",
          lang === "es"
            ? "bg-current/10 text-current"
            : "text-current/60 hover:text-current"
        )}
      >
        ES
      </button>
      <span className="px-0.5 opacity-30">/</span>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "px-2 py-1.5 transition-colors",
          lang === "en"
            ? "bg-current/10 text-current"
            : "text-current/60 hover:text-current"
        )}
      >
        EN
      </button>
    </div>
  );
}
