import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { ensurePropertySlug } from "@/lib/actions/property-share";

/**
 * POST /api/properties/[id]/brochure
 *
 * Returns the JSON payload the client uses to render the brochure PDF
 * via `@react-pdf/renderer` in the browser. Also records the generation
 * in `PdfGeneration` for analytics + audit.
 *
 * The previous server-side renderToBuffer approach is removed because
 * @react-pdf/renderer relies on Node-only APIs (fs, Buffer) and breaks
 * inside Cloudflare Workers / edge runtime. Client-side rendering keeps
 * the same template, costs zero compute on the server, and works in
 * every deployment target.
 */

const BodySchema = z.object({
  contactId: z.string().optional().nullable(),
  recipientName: z.string().max(120).optional().nullable(),
  recipientEmail: z.string().email().optional().nullable().or(z.literal("")),
  recipientPhone: z.string().max(40).optional().nullable(),
  personalMessage: z.string().max(2000).optional().nullable(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;

    const property = await prisma.property.findFirst({
      where: { id, userId: user.id },
      include: {
        photos: { orderBy: { order: "asc" } },
      },
    });
    if (!property) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
        { status: 404 }
      );
    }

    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        image: true,
        agentPhone: true,
        agentLocation: true,
        agentRole: true,
      },
    });

    const slug = await ensurePropertySlug(property.id);
    const body = BodySchema.parse(await req.json());

    // Resolve recipient
    let recipientName: string | null = body.recipientName ?? null;
    let recipientEmail: string | null = body.recipientEmail ?? null;
    let recipientPhone: string | null = body.recipientPhone ?? null;

    if (body.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: body.contactId, userId: user.id },
        select: { name: true, email: true, phone: true, whatsapp: true },
      });
      if (contact) {
        recipientName = contact.name;
        recipientEmail = contact.email;
        recipientPhone = contact.whatsapp ?? contact.phone;
      }
    }

    const photos = [
      ...(property.featuredPhoto ? [property.featuredPhoto] : []),
      ...property.photos
        .map((p) => p.url)
        .filter((u) => u !== property.featuredPhoto),
    ];

    const url = new URL(req.url);
    const publicUrl = `${url.protocol}//${url.host}/propiedad/${slug}`;

    // Record the generation (audit trail / analytics)
    await prisma.pdfGeneration.create({
      data: {
        propertyId: property.id,
        userId: user.id,
        contactId: body.contactId || null,
        recipientName,
        recipientEmail,
        recipientPhone,
        template: "BROCHURE",
        personalMessage: body.personalMessage ?? null,
      },
    });

    // Return payload — client renders PDF
    return NextResponse.json({
      property: {
        title: property.title,
        description: property.description,
        category: property.category,
        operation: property.operation,
        priceUSD: property.priceUSD ? Number(property.priceUSD) : null,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
        parking: property.parking,
        metersSquared: property.metersSquared,
        location: property.location,
        address: property.address,
        featuredPhoto: property.featuredPhoto,
        photos,
        slug,
      },
      agent: {
        name: userDb?.name ?? user.name ?? "Agente",
        email: userDb?.email ?? user.email ?? "",
        phone: userDb?.agentPhone ?? null,
        location: userDb?.agentLocation ?? null,
        role: userDb?.agentRole ?? null,
        avatar: userDb?.image ?? null,
      },
      recipient: {
        name: recipientName,
        email: recipientEmail,
        phone: recipientPhone,
      },
      personalMessage: body.personalMessage ?? null,
      publicUrl,
      generatedAtISO: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[brochure] payload failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
