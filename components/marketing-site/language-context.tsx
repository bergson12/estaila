"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MARKETING_T, type Lang, type MarketingDict } from "@/lib/marketing-i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: MarketingDict;
};

const LanguageCtx = createContext<Ctx | null>(null);

function readInitial(): Lang {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem("rx-lang");
  if (stored === "es" || stored === "en") return stored;
  const browser = navigator.language?.slice(0, 2);
  if (browser === "en") return "en";
  return "es";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLangState(readInitial());
    setHydrated(true);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("rx-lang", l);
      document.cookie = `rx-lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }

  const value: Ctx = {
    lang,
    setLang,
    t: MARKETING_T[lang] as unknown as MarketingDict,
  };

  return (
    <LanguageCtx.Provider value={value}>
      <span suppressHydrationWarning data-lang={hydrated ? lang : "es"}>
        {children}
      </span>
    </LanguageCtx.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageCtx);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
