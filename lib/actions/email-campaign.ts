"use server";

/**
 * Email campaigns + newsletters — persisted broadcasts.
 *
 * A campaign (type CAMPAIGN | NEWSLETTER) holds editor content (bodyHtml +
 * bodyJson for re-editing), a template variant (MINIMAL | EDITORIAL) and an
 * audience selector. Tables auto-create on Turso/dev via raw SQL (same pattern
 * as the chat tables) so no fragile migrate step is needed.
 */

import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendEmail, agentSender } from "@/lib/email/resend";
import { renderTemplate, type EmailVariant } from "@/lib/email/templates";
import { revalidatePath } from "next/cache";

let campaignSchemaReady = false;
async function ensureCampaignSchema() {
  if (campaignSchemaReady) return;
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "EmailCampaign" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'CAMPAIGN',
      "name" TEXT NOT NULL,
      "subject" TEXT NOT NULL DEFAULT '',
      "variant" TEXT NOT NULL DEFAULT 'MINIMAL',
      "editorMode" TEXT NOT NULL DEFAULT 'BLOCKS',
      "bodyHtml" TEXT NOT NULL DEFAULT '',
      "bodyJson" TEXT,
      "audienceType" TEXT NOT NULL DEFAULT 'ALL',
      "audienceJson" TEXT,
      "propertyId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "recipientCount" INTEGER NOT NULL DEFAULT 0,
      "sentCount" INTEGER NOT NULL DEFAULT 0,
      "sentAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "EmailCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "EmailCampaign_userId_status_idx" ON "EmailCampaign"("userId", "status")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "EmailCampaign_userId_updatedAt_idx" ON "EmailCampaign"("userId", "updatedAt")`
    );
    campaignSchemaReady = true;
  } catch (e) {
    console.warn("[ensureCampaignSchema] failed, will retry:", (e as Error).message);
  }
}

const MAX_RECIPIENTS = 200;

export type CampaignType = "CAMPAIGN" | "NEWSLETTER";
export type EditorMode = "BLOCKS" | "HTML";

export type CampaignListItem = {
  id: string;
  type: string;
  name: string;
  subject: string;
  variant: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  sentAt: string | null;
  updatedAt: string;
};

export type CampaignDetail = {
  id: string;
  type: string;
  name: string;
  subject: string;
  variant: string;
  editorMode: string;
  bodyHtml: string;
  bodyJson: string | null;
  audienceType: string;
  audienceJson: string | null;
  propertyId: string | null;
  status: string;
  recipientCount: number;
  sentCount: number;
  sentAt: string | null;
};

export type SaveCampaignInput = {
  id?: string;
  type?: CampaignType;
  name: string;
  subject: string;
  variant: EmailVariant;
  editorMode: EditorMode;
  bodyHtml: string;
  bodyJson?: string | null;
  audienceType?: string;
  audienceJson?: string | null;
  propertyId?: string | null;
};

export async function listCampaigns(): Promise<CampaignListItem[]> {
  const user = await requireUser();
  await ensureCampaignSchema();
  const rows = await prisma.emailCampaign.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      type: true,
      name: true,
      subject: true,
      variant: true,
      status: true,
      recipientCount: true,
      sentCount: true,
      sentAt: true,
      updatedAt: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    sentAt: r.sentAt ? r.sentAt.toISOString() : null,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getCampaign(id: string): Promise<CampaignDetail | null> {
  const user = await requireUser();
  await ensureCampaignSchema();
  const r = await prisma.emailCampaign.findFirst({
    where: { id, userId: user.id },
  });
  if (!r) return null;
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    subject: r.subject,
    variant: r.variant,
    editorMode: r.editorMode,
    bodyHtml: r.bodyHtml,
    bodyJson: r.bodyJson,
    audienceType: r.audienceType,
    audienceJson: r.audienceJson,
    propertyId: r.propertyId,
    status: r.status,
    recipientCount: r.recipientCount,
    sentCount: r.sentCount,
    sentAt: r.sentAt ? r.sentAt.toISOString() : null,
  };
}

export async function saveCampaign(
  input: SaveCampaignInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    await ensureCampaignSchema();
    if (!input.name.trim()) return { ok: false, error: "Ponle un nombre a la campaña." };

    const data = {
      type: input.type ?? "CAMPAIGN",
      name: input.name.trim().slice(0, 160),
      subject: input.subject.trim().slice(0, 240),
      variant: input.variant,
      editorMode: input.editorMode,
      bodyHtml: input.bodyHtml,
      bodyJson: input.bodyJson ?? null,
      audienceType: input.audienceType ?? "ALL",
      audienceJson: input.audienceJson ?? null,
      propertyId: input.propertyId ?? null,
    };

    if (input.id) {
      const existing = await prisma.emailCampaign.findFirst({
        where: { id: input.id, userId: user.id },
        select: { id: true, status: true },
      });
      if (!existing) return { ok: false, error: "Campaña no encontrada." };
      await prisma.emailCampaign.update({ where: { id: input.id }, data });
      revalidatePath("/marketing");
      return { ok: true, id: input.id };
    }

    const created = await prisma.emailCampaign.create({
      data: { ...data, userId: user.id },
      select: { id: true },
    });
    revalidatePath("/marketing");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteCampaign(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireUser();
    await ensureCampaignSchema();
    await prisma.emailCampaign.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/marketing");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function duplicateCampaign(
  id: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    await ensureCampaignSchema();
    const src = await prisma.emailCampaign.findFirst({
      where: { id, userId: user.id },
    });
    if (!src) return { ok: false, error: "Campaña no encontrada." };
    const copy = await prisma.emailCampaign.create({
      data: {
        userId: user.id,
        type: src.type,
        name: `${src.name} (copia)`,
        subject: src.subject,
        variant: src.variant,
        editorMode: src.editorMode,
        bodyHtml: src.bodyHtml,
        bodyJson: src.bodyJson,
        audienceType: src.audienceType,
        audienceJson: src.audienceJson,
        propertyId: src.propertyId,
        status: "DRAFT",
      },
      select: { id: true },
    });
    revalidatePath("/marketing");
    return { ok: true, id: copy.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function resolveAudience(
  userId: string,
  audienceType: string,
  audienceJson: string | null
): Promise<{ id: string; name: string; email: string }[]> {
  let where: { userId: string; email: { not: null }; type?: string; id?: { in: string[] } } = {
    userId,
    email: { not: null },
  };
  if (audienceType.startsWith("TYPE:")) {
    where = { ...where, type: audienceType.slice(5) };
  } else if (audienceType === "CUSTOM") {
    let ids: string[] = [];
    try {
      ids = JSON.parse(audienceJson ?? "[]");
    } catch {
      ids = [];
    }
    if (ids.length === 0) return [];
    where = { ...where, id: { in: ids } };
  }
  const rows = await prisma.contact.findMany({
    where,
    take: MAX_RECIPIENTS,
    select: { id: true, name: true, email: true },
  });
  return rows
    .filter((r) => r.email)
    .map((r) => ({ id: r.id, name: r.name, email: r.email as string }));
}

async function loadAgentAndProperty(userId: string, propertyId: string | null) {
  const agent = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      agentRole: true,
      agentLocation: true,
      agentPhone: true,
    },
  });
  let property = null;
  if (propertyId) {
    const prop = await prisma.property.findFirst({
      where: { id: propertyId, userId },
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
        metersSquared: prop.metersSquared != null ? Number(prop.metersSquared) : null,
        location: prop.location,
        description: prop.description,
        heroPhoto: prop.photos[0]?.url ?? null,
      };
    }
  }
  return { agent, property };
}

/** Render the campaign's full email HTML (shell + body) for live preview. */
export async function previewCampaign(args: {
  subject: string;
  variant: EmailVariant;
  bodyHtml: string;
  propertyId?: string | null;
}): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    const { agent, property } = await loadAgentAndProperty(user.id, args.propertyId ?? null);
    if (!agent) return { ok: false, error: "Perfil no encontrado." };
    const rendered = renderTemplate({
      kind: "CUSTOM",
      variant: args.variant,
      agent: {
        name: agent.name,
        email: agent.email,
        phone: agent.agentPhone,
        role: agent.agentRole,
        location: agent.agentLocation,
        image: agent.image,
      },
      contact: { name: "Cliente" },
      property: property ?? undefined,
      customSubject: args.subject,
      customHtml: args.bodyHtml,
    });
    return { ok: true, html: rendered.html };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type SendCampaignResult =
  | { ok: true; sent: number; failed: number; test?: boolean }
  | { ok: false; error: string };

export async function sendCampaign(
  id: string,
  opts?: { test?: boolean }
): Promise<SendCampaignResult> {
  try {
    const user = await requireUser();
    await ensureCampaignSchema();
    const c = await prisma.emailCampaign.findFirst({ where: { id, userId: user.id } });
    if (!c) return { ok: false, error: "Campaña no encontrada." };
    if (!c.subject.trim()) return { ok: false, error: "La campaña no tiene asunto." };
    if (!c.bodyHtml.trim()) return { ok: false, error: "La campaña no tiene contenido." };

    const { agent, property } = await loadAgentAndProperty(user.id, c.propertyId);
    if (!agent) return { ok: false, error: "Perfil no encontrado." };

    const agentInfo = {
      name: agent.name,
      email: agent.email,
      phone: agent.agentPhone,
      role: agent.agentRole,
      location: agent.agentLocation,
      image: agent.image,
    };
    const from = agentSender({ name: agent.name, email: agent.email });
    const variant = c.variant as EmailVariant;

    // TEST: send only to the agent's own email
    if (opts?.test) {
      if (!user.email) return { ok: false, error: "Tu perfil no tiene email." };
      const rendered = renderTemplate({
        kind: "CUSTOM",
        variant,
        agent: agentInfo,
        contact: { name: agent.name },
        property: property ?? undefined,
        customSubject: c.subject,
        customHtml: c.bodyHtml,
      });
      const res = await sendEmail({
        from,
        to: user.email,
        subject: `[TEST] ${rendered.subject}`,
        html: rendered.html,
        text: rendered.text,
        tags: [{ name: "test", value: "1" }],
      });
      if (!res.ok) return { ok: false, error: res.error };
      return { ok: true, sent: 1, failed: 0, test: true };
    }

    const recipients = await resolveAudience(user.id, c.audienceType, c.audienceJson);
    if (recipients.length === 0) {
      return { ok: false, error: "No hay destinatarios con email para esta audiencia." };
    }

    const details: { ok: boolean }[] = [];
    const concurrency = 5;
    for (let i = 0; i < recipients.length; i += concurrency) {
      const batch = recipients.slice(i, i + concurrency);
      const results = await Promise.all(
        batch.map(async (ct) => {
          try {
            const rendered = renderTemplate({
              kind: "CUSTOM",
              variant,
              agent: agentInfo,
              contact: { name: ct.name },
              property: property ?? undefined,
              customSubject: c.subject,
              customHtml: c.bodyHtml,
            });
            const res = await sendEmail({
              from,
              to: ct.email,
              replyTo: agent.email ?? undefined,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
              tags: [
                { name: "campaign", value: c.id.slice(0, 8) },
                { name: "user", value: user.id.slice(0, 8) },
              ],
            });
            if (res.ok) {
              await prisma.contactActivity
                .create({
                  data: {
                    userId: user.id,
                    contactId: ct.id,
                    type: "EMAIL",
                    title: c.subject,
                    propertyId: c.propertyId ?? null,
                    metadata: JSON.stringify({ campaignId: c.id, resendId: res.id }),
                  },
                })
                .catch(() => {});
              return { ok: true };
            }
            return { ok: false };
          } catch {
            return { ok: false };
          }
        })
      );
      details.push(...results);
    }

    const sent = details.filter((d) => d.ok).length;
    const failed = details.length - sent;

    await prisma.emailCampaign.update({
      where: { id: c.id },
      data: {
        status: "SENT",
        recipientCount: recipients.length,
        sentCount: sent,
        sentAt: new Date(),
      },
    });
    revalidatePath("/marketing");
    revalidatePath("/contactos");
    return { ok: true, sent, failed };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
