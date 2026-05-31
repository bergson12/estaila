import "server-only";
import { uploadFile, type UploadResult as StorageResult } from "./storage";

/**
 * Legacy upload helper — kept for backward compatibility with existing
 * callers (image uploader, property form). Internally delegates to the
 * runtime-aware `lib/storage.ts` which writes to R2 in Cloudflare Workers
 * and to disk in Node dev.
 */

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export type UploadResult = {
  url: string;
  filename: string;
  size: number;
  mime: string;
};

export async function saveUpload(
  file: File,
  userId: string
): Promise<UploadResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Archivo demasiado grande (máx 15MB)");
  }

  const result: StorageResult = await uploadFile(file, {
    filename: file.name,
    contentType: file.type,
    prefix: `users/${userId.slice(0, 8)}`,
  });

  return {
    url: result.url,
    filename: result.key.split("/").pop() ?? result.key,
    size: result.size,
    mime: result.contentType,
  };
}

// Documentos: además de imágenes, acepta PDF y Word (.doc/.docx). Límite 25MB.
const ALLOWED_DOC_MIME = new Set([
  ...ALLOWED_MIME,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25MB

export async function saveDocumentUpload(
  file: File,
  userId: string
): Promise<UploadResult> {
  if (!ALLOWED_DOC_MIME.has(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type || "desconocido"}`);
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new Error("Archivo demasiado grande (máx 25MB)");
  }

  const result: StorageResult = await uploadFile(file, {
    filename: file.name,
    contentType: file.type,
    prefix: `docs/${userId.slice(0, 8)}`,
  });

  return {
    url: result.url,
    filename: result.key.split("/").pop() ?? result.key,
    size: result.size,
    mime: result.contentType,
  };
}
