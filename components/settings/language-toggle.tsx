"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setLocale } from "@/lib/actions/locale";
import { useT } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/dictionary";

export function LanguageToggle({ initial }: { initial: Locale }) {
  const router = useRouter();
  const { t } = useT();
  const [locale, setLocaleState] = useState<Locale>(initial);
  const [pending, startTransition] = useTransition();

  function pick(next: Locale) {
    if (next === locale || pending) return;
    const prev = locale;
    setLocaleState(next); // optimista
    startTransition(async () => {
      try {
        await setLocale(next);
        toast.success(t.language.saved);
        router.refresh(); // re-render server + client con el nuevo idioma
      } catch {
        setLocaleState(prev);
        toast.error("Error");
      }
    });
  }

  const options: { value: Locale; label: string; code: string }[] = [
    { value: "es", label: t.language.spanish, code: "ES" },
    { value: "en", label: t.language.english, code: "EN" },
  ];

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{t.language.section}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {t.language.description}
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={t.language.section}
        className="mt-4 inline-flex rounded-xl border border-border bg-background/60 p-1"
      >
        {options.map((o) => {
          const isActive = locale === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => pick(o.value)}
              disabled={pending}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                pending && "opacity-80"
              )}
            >
              {pending && isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isActive ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <span className="font-mono text-[10px] font-bold tracking-wider opacity-60">
                  {o.code}
                </span>
              )}
              {o.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
