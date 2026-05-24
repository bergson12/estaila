"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// ============================================================
// PUBLIC — Submit a lead from a property landing
// ============================================================

const PublicLeadSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  trackingId: z.string().trim().optional().or(z.literal("")),
  honeypot: z.string().optional(), // bot trap — should be empty
});

export async function submitPublicLead(
  input: z.infer<typeof PublicLeadSchema>
) {
  const data = PublicLeadSchema.parse(input);

  // Honeypot — silent fail if a bot filled it
  if (data.honeypot && data.honeypot.length > 0) {
    return { ok: true };
  }

  // Validate at least one contact method
  if (!data.whatsapp && !data.email) {
    throw new Error("Necesitamos al menos un WhatsApp o un email para contactarte.");
  }

  // Resolve property + agent
  const property = await prisma.property.findUnique({
    where: { slug: data.slug },
    select: {
      id: true,
      userId: true,
      title: true,
      publicEnabled: true,
    },
  });
  if (!property || !property.publicEnabled) {
    throw new Error("Esta propiedad no está disponible.");
  }

  // Rate limit by IP (1 lead per 60s per IP+property)
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const ipHash = createHash("sha256")
    .update(ip + ":" + property.id)
    .digest("hex")
    .slice(0, 32);

  const recent = await prisma.lead.findFirst({
    where: {
      propertyId: property.id,
      ipHash,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    select: { id: true },
  });
  if (recent) {
    throw new Error("Ya enviaste un mensaje. Te contactaremos pronto.");
  }

  const userAgent = hdrs.get("user-agent")?.slice(0, 500) ?? null;
  const referrer = hdrs.get("referer") ?? null;

  const lead = await prisma.lead.create({
    data: {
      propertyId: property.id,
      agentId: property.userId,
      name: data.name,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      message: data.message || null,
      source: data.trackingId || null,
      referrer,
      userAgent,
      ipHash,
      status: "NUEVO",
    },
  });

  // Auto-create a Contact if not exists (match by email or whatsapp)
  let convertedContactId: string | null = null;
  let pipelineCardId: string | null = null;

  try {
    const existing = await prisma.contact.findFirst({
      where: {
        userId: property.userId,
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.whatsapp ? [{ whatsapp: data.whatsapp }] : []),
        ],
      },
      select: { id: true },
    });

    let contactId = existing?.id;
    if (!contactId) {
      const newContact = await prisma.contact.create({
        data: {
          userId: property.userId,
          name: data.name,
          email: data.email || null,
          whatsapp: data.whatsapp || null,
          phone: data.whatsapp || null,
          type: "CLIENTE",
          notes: `Lead automático desde landing pública de ${property.title}.`,
        },
      });
      contactId = newContact.id;
    }
    convertedContactId = contactId;

    // Create pipeline card NUEVO stage
    const card = await prisma.pipelineCard.create({
      data: {
        userId: property.userId,
        contactId,
        propertyId: property.id,
        stage: "NUEVO",
        value: 0,
        notes: data.message
          ? `Mensaje: ${data.message}`
          : `Lead desde landing pública (${data.trackingId ? "tracked" : "direct"})`,
      },
    });
    pipelineCardId = card.id;
  } catch (e) {
    // Conversion is best-effort — don't fail the lead submission
    console.warn("Lead conversion failed:", (e as Error).message);
  }

  // Update lead with conversion
  if (convertedContactId || pipelineCardId) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        convertedContactId,
        convertedPipelineCardId: pipelineCardId,
      },
    });
  }

  // Track share click attribution (if came from a tracked link)
  if (data.trackingId) {
    await prisma.propertyShare.updateMany({
      where: { trackingId: data.trackingId },
      data: { lastClickAt: new Date() },
    });
  }

  revalidatePath("/propiedades");
  revalidatePath("/pipeline");

  return { ok: true };
}

// ============================================================
// AGENT — list / update lead status
// ============================================================

export async function listLeads(opts?: {
  propertyId?: string;
  status?: string;
}) {
  const user = await requireUser();
  return prisma.lead.findMany({
    where: {
      agentId: user.id,
      ...(opts?.propertyId ? { propertyId: opts.propertyId } : {}),
      ...(opts?.status && opts.status !== "ALL"
        ? { status: opts.status }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { id: true, title: true, slug: true } },
    },
    take: 100,
  });
}

export async function updateLeadStatus(id: string, status: string) {
  const user = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id, agentId: user.id },
    select: { id: true, propertyId: true },
  });
  if (!lead) throw new Error("Lead no encontrado");
  await prisma.lead.update({
    where: { id },
    data: { status },
  });
  revalidatePath(`/propiedades/${lead.propertyId}`);
  return { ok: true };
}
