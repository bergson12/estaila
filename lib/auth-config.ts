import "server-only";

/**
 * Server-side flags about which auth providers / features are wired.
 * Imported by RSC pages to decide what UI to render (Google button, etc.).
 */

export function isGoogleAuthEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isEmailVerificationEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}
