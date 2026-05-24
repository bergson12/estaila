/**
 * Share channel constants — shared client + server.
 * Kept out of lib/actions/property-share.ts because that file is "use server"
 * and Next.js only allows async function exports from server files.
 */

export const SHARE_CHANNELS = [
  "WHATSAPP",
  "EMAIL",
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "COPY_LINK",
  "QR",
] as const;

export type ShareChannel = (typeof SHARE_CHANNELS)[number];
