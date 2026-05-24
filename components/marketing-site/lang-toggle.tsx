"use client";

import { Languages } from "lucide-react";
import { useLang } from "./language-context";
import { cn } from "@/lib/utils";

/** CRM-aligned language toggle (ES / EN) — matches panel chrome */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-md border border-border bg-card/40 text-xs",
        className
      )}
    >
      <Languages
        className="ml-2.5 mr-1 h-3.5 w-3.5 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => setLang("es")}
        aria-pressed={lang === "es"}
        className={cn(
          "h-full px-2 font-medium uppercase tracking-wider transition-colors",
          lang === "es"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ES
      </button>
      <span className="text-muted-foreground/50">/</span>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "h-full rounded-r-md px-2 font-medium uppercase tracking-wider transition-colors",
          lang === "en"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
}
