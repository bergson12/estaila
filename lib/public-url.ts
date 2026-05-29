/**
 * Convert a raw Vercel Blob CDN URL into a branded estaila.com link.
 *
 *   https://<id>.public.blob.vercel-storage.com/genXXX/2026/05/28/abc.png
 *   →  https://estaila.com/cdn/genXXX/2026/05/28/abc.png
 *
 * The /cdn/* path is rewritten at the edge back to the blob store
 * (see next.config.ts rewrites). We brand at SHARE/COPY time only — the
 * DB keeps the canonical blob URL so deletion via @vercel/blob still works.
 *
 * Client+server safe (uses NEXT_PUBLIC_APP_URL, inlined on the client).
 * Non-blob URLs (relative, external) are returned unchanged.
 */

const ENV_APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

const BLOB_HOST_RE = /\.public\.blob\.vercel-storage\.com$/i;

/**
 * Base host for branded links. Priority:
 *   1. NEXT_PUBLIC_APP_URL (explicit, e.g. https://estaila.com)
 *   2. The current origin in the browser (works on preview *.vercel.app AND
 *      the live domain without any env config — the /cdn rewrite is
 *      host-agnostic, so the link resolves on whatever domain you're on)
 *   3. https://estaila.com as a server-side fallback
 */
function brandBase(): string {
  if (ENV_APP_URL) return ENV_APP_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "https://estaila.com";
}

export function brandedImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (BLOB_HOST_RE.test(u.hostname)) {
      return `${brandBase()}/cdn${u.pathname}`;
    }
    return url;
  } catch {
    // Relative path or invalid URL — leave as-is.
    return url;
  }
}
