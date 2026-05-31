"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth-server";
import { prisma, ensureLightweightMigrations } from "@/lib/db";
import { isTrustedStorageUrl } from "@/lib/storage";
import { extractReceipt, type ReceiptData } from "@/lib/ai/gemini-receipt";
import { checkRateLimit } from "@/lib/rate-limit";

export type TransactionInput = {
  concept: string;
  amount: number;
  category: string; // INGRESO | GASTO
  type: string; // RESERVA | COMISION | MANTENIMIENTO | PUBLICIDAD | MARKETING | SUSCRIPCION | LEGAL | OTRO
  status?: string;
  currency?: string;
  propertyId?: string;
  notes?: string;
  reference?: string;
  receiptUrl?: string;
  date?: Date;
};

const OCR_COST = 1;

export async function createTransaction(input: TransactionInput) {
  const user = await requireUser();
  await ensureLightweightMigrations();
  const t = await prisma.transaction.create({
    data: {
      userId: user.id,
      concept: input.concept,
      amount: input.amount,
      category: input.category,
      type: input.type,
      status: input.status ?? "PENDIENTE",
      currency: input.currency ?? "USD",
      propertyId: input.propertyId || null,
      notes: input.notes || null,
      reference: input.reference || null,
      receiptUrl: input.receiptUrl || null,
      date: input.date ?? new Date(),
    },
  });
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { id: t.id };
}

/**
 * OCR de una factura/recibo subido (URL en nuestro storage). Llama a Gemini,
 * cobra 1 crédito SOLO si la lectura fue exitosa, y devuelve los campos para
 * pre-rellenar el formulario. La imagen ya quedó subida (se adjunta aparte).
 */
export async function scanReceipt(imageUrl: string): Promise<
  | { ok: true; data: ReceiptData; remainingCredits: number }
  | { ok: false; error: string }
> {
  const user = await requireUser();
  // Anti-SSRF (NEXT-SSRF-001): solo aceptamos imágenes de nuestro propio
  // almacenamiento. Sin esto, el servidor haría fetch a cualquier URL del
  // cliente (metadata cloud, localhost, etc.).
  if (!isTrustedStorageUrl(imageUrl)) {
    return { ok: false, error: "Imagen inválida." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true },
  });
  if (!dbUser || dbUser.credits < OCR_COST) {
    return {
      ok: false,
      error: `Necesitas ${OCR_COST} crédito para escanear. Tienes ${dbUser?.credits ?? 0}.`,
    };
  }

  // Rate-limit: 20 escaneos por minuto por usuario.
  if (!(await checkRateLimit(`ocr:${user.id}`, 20, 60))) {
    return {
      ok: false,
      error: "Demasiados escaneos seguidos. Espera unos segundos e intenta de nuevo.",
    };
  }

  // Resolver a URL absoluta para fetch server-side (uploads locales son relativos).
  let target = imageUrl;
  if (imageUrl.startsWith("/")) {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("host") ?? "localhost:3000";
    target = `${proto}://${host}${imageUrl}`;
  }

  const result = await extractReceipt(target);
  if (!result.ok) return { ok: false, error: result.error };

  await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: OCR_COST } },
  });
  return {
    ok: true,
    data: result.data,
    remainingCredits: dbUser.credits - OCR_COST,
  };
}

export async function updateTransactionStatus(id: string, status: string) {
  const user = await requireUser();
  await prisma.transaction.updateMany({
    where: { id, userId: user.id },
    data: { status },
  });
  revalidatePath("/finanzas");
  return { ok: true };
}

export async function deleteTransaction(id: string) {
  const user = await requireUser();
  await prisma.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { ok: true };
}
