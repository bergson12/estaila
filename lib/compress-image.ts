"use client";

import imageCompression, {
  type Options as CompressionOptions,
} from "browser-image-compression";

/**
 * Compress an image File client-side before uploading.
 *
 * Default: max 1920px on the longest side, ~85% JPEG quality, ~1.5MB ceiling.
 * Typically reduces 6-15 MB phone photos down to 200-500 KB without visible
 * quality loss in real-estate context.
 *
 * Falls back to the original file if compression fails (e.g. weird format,
 * tiny file already, or AVIF). Returns either the new compressed File or the
 * input untouched.
 */

export type CompressMode = "default" | "avatar" | "thumbnail" | "raw";

const PRESETS: Record<CompressMode, CompressionOptions> = {
  default: {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    initialQuality: 0.85,
    useWebWorker: true,
    fileType: "image/jpeg",
  },
  avatar: {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 512,
    initialQuality: 0.88,
    useWebWorker: true,
    fileType: "image/jpeg",
  },
  thumbnail: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 480,
    initialQuality: 0.82,
    useWebWorker: true,
    fileType: "image/jpeg",
  },
  raw: {
    // for AI Studio uploads — preserve more detail but cap absurd sizes
    maxSizeMB: 4,
    maxWidthOrHeight: 2560,
    initialQuality: 0.92,
    useWebWorker: true,
  },
};

export async function compressImage(
  file: File,
  mode: CompressMode = "default"
): Promise<File> {
  // Skip non-images, tiny files, and animated/transparent formats we don't want to flatten.
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 200_000) return file; // <200KB — already small, don't bother
  if (file.type === "image/gif") return file; // preserve animation
  if (file.type === "image/svg+xml") return file;

  try {
    const compressed = await imageCompression(file, PRESETS[mode]);
    // If somehow the result got bigger, return the original.
    if (compressed.size >= file.size) return file;
    return new File([compressed], renameOutput(file.name, compressed.type), {
      type: compressed.type,
      lastModified: Date.now(),
    });
  } catch (e) {
    console.warn("[compress-image] failed, using original:", e);
    return file;
  }
}

function renameOutput(originalName: string, newType: string): string {
  const ext = newType.split("/")[1]?.split("+")[0] ?? "jpg";
  const base = originalName.replace(/\.[^.]+$/, "");
  return `${base}.${ext === "jpeg" ? "jpg" : ext}`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
