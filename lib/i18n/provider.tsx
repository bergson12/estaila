"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DICT, type Dict, type Locale } from "./dictionary";

type Ctx = { locale: Locale; t: Dict };

const I18nCtx = createContext<Ctx>({ locale: "es", t: DICT.es });

/**
 * Provee el diccionario del panel a Client Components. Se monta en el layout
 * del dashboard con el `locale` derivado de la cookie (server-side), por lo
 * que el primer render del cliente ya coincide con el del servidor.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <I18nCtx.Provider value={{ locale, t: DICT[locale] }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useT() {
  return useContext(I18nCtx);
}
