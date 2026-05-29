"use server";

/**
 * Email server actions — send templated emails to contacts.
 *
 * All actions return { ok, ... } | { ok: false, error } so the client
 * gets real error messages even in Next 16 production.
 */

import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendEmail, agentSender } from "@/lib/email/resend";
import { renderTemplate, type TemplateKind } from "@/lib/email/templates";
import { revalidatePath } from "next/cache";

export type EmailAudienceContact = {
  id: string;
  name: string;
  email: string;
  type: string;
};

/** Contacts that have an email — the addressable audience for campaigns. */
export async function listEmailAudience(): Promise<EmailAudienceContact[]> {
  const user = await requireUser();
  const rows = await prisma.contact.findMany({
    where: { userId: user.id, email: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 2000,
    select: { id: true, name: true, email: true, type: true },
  });
  return rows
    .filter((r) => r.email)
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email as string,
      type: r.type,
    }));
}

export type SendTemplatedEmailInput = {
  kind: TemplateKind;
  contactIds: string[];
  propertyId?: string;
  customSubject?: string;
  customBody?: string;
  customDateTime?: string;
};

export type SendTemplatedEmailResult =
  | {
      ok: true;
      sent: number;
      failed: number;
      details: { contactId: string; ok: boolean; error?: string }[];
    }
  | { ok: false; error: string };

export async function sendTemplatedEmail(
  input: SendTemplatedEmailInput
): Promise<SendTemplatedEmailResult> {
  try {
    const user = await requireUser();

    if (input.contactIds.length === 0) {
      return { ok: false, error: "Selecciona al menos un contacto." };
    }
    if (input.contactIds.length > 100) {
      return { ok: false, error: "Máximo 100 contactos por envío." };
    }

    // Load agent profile
    const agent = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        image: true,
        agentRole: true,
        agentLocation: true,
        agentPhone: true,
      },
    });
    if (!agent) return { ok: false, error: "Perfil no encontrado." };

    // Load contacts (verify ownership + has email)
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: input.contactIds },
        userId: user.id,
      },
      select: { id: true, name: true, email: true },
    });
    const validContacts = contacts.filter((c) => c.email);
    if (validContacts.length === 0) {
      return {
        ok: false,
        error: "Ninguno de los contactos seleccionados tiene email.",
      };
    }

    // Load property (optional)
    let property = null;
    if (input.propertyId) {
      const prop = await prisma.property.findFirst({
        where: { id: input.propertyId, userId: user.id },
        select: {
          id: true,
          slug: true,
          title: true,
          priceUSD: true,
          operation: true,
          bedrooms: true,
          bathrooms: true,
          metersSquared: true,
          location: true,
          description: true,
          photos: {
            take: 1,
            orderBy: { order: "asc" },
            select: { url: true },
          },
        },
      });
      if (prop) {
        property = {
          id: prop.id,
          slug: prop.slug,
          title: prop.title,
          priceUSD: prop.priceUSD ? Number(prop.priceUSD) : null,
          operation: prop.operation,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms != null ? Number(prop.bathrooms) : null,
          metersSquared:
            prop.metersSquared != null ? Number(prop.metersSquared) : null,
          location: prop.location,
          description: prop.description,
          heroPhoto: prop.photos[0]?.url ?? null,
        };
      }
    }

    const agentInfo = {
      name: agent.name,
      email: agent.email,
      phone: agent.agentPhone,
      role: agent.agentRole,
      location: agent.agentLocation,
      image: agent.image,
    };

    const from = agentSender({
      name: agent.name,
      email: agent.email,
    });

    // Send to each contact (parallel, but cap concurrency at 5 to avoid
    // hitting Resend rate limits)
    const details: { contactId: string; ok: boolean; error?: string }[] = [];
    const concurrency = 5;
    for (let i = 0; i < validContacts.length; i += concurrency) {
      const batch = validContacts.slice(i, i + concurrency);
      const results = await Promise.all(
        batch.map(async (c) => {
          try {
            const rendered = renderTemplate({
              kind: input.kind,
              agent: agentInfo,
              contact: { name: c.name },
              property: property ?? undefined,
              customSubject: input.customSubject,
              customBody: input.customBody,
              customDateTime: input.customDateTime,
            });
            const res = await sendEmail({
              from,
              to: c.email!,
              replyTo: agent.email ?? undefined,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
              tags: [
                { name: "kind", value: input.kind.toLowerCase() },
                { name: "user", value: user.id.slice(0, 8) },
              ],
            });

            if (res.ok) {
              // Log activity
              await prisma.contactActivity.create({
                data: {
                  userId: user.id,
                  contactId: c.id,
                  type: "EMAIL",
                  title: rendered.subject,
                  content: input.customBody ?? null,
                  propertyId: input.propertyId ?? null,
                  metadata: JSON.stringify({
                    kind: input.kind,
                    resendId: res.id,
                  }),
                },
              });
              return { contactId: c.id, ok: true };
            }
            return { contactId: c.id, ok: false, error: res.error };
          } catch (e) {
            return { contactId: c.id, ok: false, error: (e as Error).message };
          }
        })
      );
      details.push(...results);
    }

    revalidatePath("/contactos");
    const sent = details.filter((d) => d.ok).length;
    const failed = details.length - sent;
    return { ok: true, sent, failed, details };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Render the email HTML for a live preview (does NOT send). */
export async function previewEmail(args: {
  kind: TemplateKind;
  propertyId?: string;
  customSubject?: string;
  customBody?: string;
  customDateTime?: string;
  contactName?: string;
}): Promise<{ ok: true; html: string; subject: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const agent = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        image: true,
        agentRole: true,
        agentLocation: true,
        agentPhone: true,
      },
    });
    if (!agent) return { ok: false, error: "Perfil no encontrado." };

    let property = null;
    if (args.propertyId) {
      const prop = await prisma.property.findFirst({
        where: { id: args.propertyId, userId: user.id },
        select: {
          id: true,
          slug: true,
          title: true,
          priceUSD: true,
          operation: true,
          bedrooms: true,
          bathrooms: true,
          metersSquared: true,
          location: true,
          description: true,
          photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        },
      });
      if (prop) {
        property = {
          id: prop.id,
          slug: prop.slug,
          title: prop.title,
          priceUSD: prop.priceUSD ? Number(prop.priceUSD) : null,
          operation: prop.operation,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms != null ? Number(prop.bathrooms) : null,
          metersSquared:
            prop.metersSquared != null ? Number(prop.metersSquared) : null,
          location: prop.location,
          description: prop.description,
          heroPhoto: prop.photos[0]?.url ?? null,
        };
      }
    }

    const rendered = renderTemplate({
      kind: args.kind,
      agent: {
        name: agent.name,
        email: agent.email,
        phone: agent.agentPhone,
        role: agent.agentRole,
        location: agent.agentLocation,
        image: agent.image,
      },
      contact: { name: args.contactName?.trim() || "Cliente" },
      property: property ?? undefined,
      customSubject: args.customSubject,
      customBody: args.customBody,
      customDateTime: args.customDateTime,
    });
    return { ok: true, html: rendered.html, subject: rendered.subject };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Test send — sends to the agent's own email so they can preview templates. */
export async function sendTestEmail(args: {
  kind: TemplateKind;
  propertyId?: string;
  customSubject?: string;
  customBody?: string;
  customDateTime?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    if (!user.email) return { ok: false, error: "Tu perfil no tiene email." };

    const agent = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        image: true,
        agentRole: true,
        agentLocation: true,
        agentPhone: true,
      },
    });
    if (!agent) return { ok: false, error: "Perfil no encontrado." };

    let property = null;
    if (args.propertyId) {
      const prop = await prisma.property.findFirst({
        where: { id: args.propertyId, userId: user.id },
        select: {
          id: true,
          slug: true,
          title: true,
          priceUSD: true,
          operation: true,
          bedrooms: true,
          bathrooms: true,
          metersSquared: true,
          location: true,
          description: true,
          photos: {
            take: 1,
            orderBy: { order: "asc" },
            select: { url: true },
          },
        },
      });
      if (prop) {
        property = {
          id: prop.id,
          slug: prop.slug,
          title: prop.title,
          priceUSD: prop.priceUSD ? Number(prop.priceUSD) : null,
          operation: prop.operation,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms != null ? Number(prop.bathrooms) : null,
          metersSquared:
            prop.metersSquared != null ? Number(prop.metersSquared) : null,
          location: prop.location,
          description: prop.description,
          heroPhoto: prop.photos[0]?.url ?? null,
        };
      }
    }

    const rendered = renderTemplate({
      kind: args.kind,
      agent: {
        name: agent.name,
        email: agent.email,
        phone: agent.agentPhone,
        role: agent.agentRole,
        location: agent.agentLocation,
        image: agent.image,
      },
      contact: { name: agent.name },
      property: property ?? undefined,
      customSubject: args.customSubject,
      customBody: args.customBody,
      customDateTime: args.customDateTime,
    });

    const from = agentSender({ name: agent.name, email: agent.email });
    const res = await sendEmail({
      from,
      to: user.email,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
      tags: [{ name: "test", value: "1" }],
    });
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, id: res.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
