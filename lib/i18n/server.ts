import "server-only";
import { cookies } from "next/headers";
import { DICT, LOCALE_COOKIE, type Locale } from "./dictionary";

/**
 * Locale efectivo para render. Cookie = fuente única de verdad (la escribe
 * el toggle de Configuración). Default "es". Server + client leen lo mismo,
 * así no hay desajuste ni "flash" de español.
 */
export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return v === "en" ? "en" : "es";
}

/** Diccionario del panel para Server Components. */
export async function getDict() {
  return DICT[await getLocale()];
}
