import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

/**
 * Cierre de sesión seguro. Antes de redirigir, borra TODO el sessionStorage
 * (datos de trabajo por-usuario: pipeline del Studio, drafts, etc.) y fuerza
 * una recarga dura a /welcome.
 *
 * Por qué la recarga dura: los stores zustand (p.ej. studio-pipeline) son
 * singletons a nivel de módulo que SOBREVIVEN a router.push() (navegación SPA).
 * Sin recargar el documento, el siguiente usuario en la misma pestaña podría
 * leer la imagen/estado del usuario anterior. La recarga garantiza un runtime
 * JS limpio. localStorage (tema, preferencias de UI) se preserva a propósito.
 */
export async function signOutClean(): Promise<void> {
  try {
    await authClient.signOut();
  } catch {
    /* aunque falle el signOut remoto, limpiamos y salimos igual */
  } finally {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.clear();
      } catch {
        /* storage no disponible (modo privado) — no bloquea el logout */
      }
      window.location.href = "/welcome";
    }
  }
}
