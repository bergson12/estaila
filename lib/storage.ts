/**
 * Storage abstraction — uploads to Vercel Blob.
 *
 * Single backend: Vercel Blob (S3-compatible, edge-distributed, CDN-cached).
 * Local dev falls back to ./public/uploads/ if BLOB_READ_WRITE_TOKEN is missing.
 *
 * Public URLs returned by Vercel Blob are absolute (https://<id>.public.blob.vercel-storage.com/<key>),
 * so no proxy route is needed.
 */

import "server-only";

import { randomBytes } from "node:crypto";

export type UploadResult = {
  key: string;
  url: string; // absolute public URL
  size: number;
  contentType: string;
};

function generateKey(filename: string, prefix = ""): string {
  const ext = (filename.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
  const random = randomBytes(8).toString("hex");
  const date = new Date();
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const safePrefix = prefix
    ? prefix.replace(/[^a-z0-9-]/gi, "").slice(0, 32) + "/"
    : "";
  return `${safePrefix}${yy}/${mm}/${dd}/${random}.${ext}`;
}

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isServerless(): boolean {
  // Vercel (and most serverless platforms) set this. The filesystem is read-only
  // in production, so we must use Blob storage.
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/**
 * Persist a file. Returns absolute URL + key.
 */
export async function uploadFile(
  file: File | Blob,
  opts?: { filename?: string; prefix?: string; contentType?: string }
): Promise<UploadResult> {
  const filename = opts?.filename ?? (file as File).name ?? "file.bin";
  const contentType =
    opts?.contentType ?? (file as File).type ?? "application/octet-stream";
  const key = generateKey(filename, opts?.prefix);

  if (hasBlobToken()) {
    // Production path — Vercel Blob
    const { put } = await import("@vercel/blob");
    const result = await put(key, file, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const buffer = await file.arrayBuffer();
    return {
      key,
      url: result.url,
      size: buffer.byteLength,
      contentType,
    };
  }

  // In serverless without Blob configured, fail loudly instead of crashing
  // with ENOENT (read-only filesystem). Surface a clear setup hint to the dev.
  if (isServerless()) {
    throw new Error(
      "Vercel Blob no configurado. Crea un Blob Store en Vercel Dashboard → Storage y la variable BLOB_READ_WRITE_TOKEN se inyectará automáticamente."
    );
  }

  // Local dev fallback — write to ./public/uploads/
  const { writeFile, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const localPath = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(localPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(localPath, buffer);
  return {
    key,
    url: `/uploads/${key}`,
    size: buffer.byteLength,
    contentType,
  };
}

/**
 * Seguridad (anti-SSRF): valida que una URL de imagen pertenezca a NUESTRO
 * almacenamiento — Vercel Blob (https://*.blob.vercel-storage.com) o un upload
 * local relativo (/uploads/...). El servidor NUNCA debe hacer fetch a URLs
 * externas arbitrarias provistas por el cliente (evita pedir metadata cloud,
 * servicios internos/localhost, o usar el server como proxy).
 */
export function isTrustedStorageUrl(raw: string): boolean {
  if (typeof raw !== "string" || !raw) return false;
  if (raw.startsWith("/uploads/")) return true; // upload local (solo dev)
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    return (
      u.hostname === "blob.vercel-storage.com" ||
      u.hostname.endsWith(".blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/**
 * Delete a file by URL or key. No-op safe.
 */
export async function deleteFile(keyOrUrl: string): Promise<void> {
  if (hasBlobToken() && keyOrUrl.startsWith("http")) {
    const { del } = await import("@vercel/blob");
    try {
      await del(keyOrUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // ignore missing
    }
    return;
  }

  // Local dev — try to remove from disk
  try {
    const { unlink } = await import("node:fs/promises");
    const path = await import("node:path");
    const rel = keyOrUrl.startsWith("/uploads/")
      ? keyOrUrl.slice("/uploads/".length)
      : keyOrUrl;
    await unlink(path.join(process.cwd(), "public", "uploads", rel));
  } catch {
    // ignore
  }
}
