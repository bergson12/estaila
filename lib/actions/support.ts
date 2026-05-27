"use server";

/**
 * Support ticket system — users open tickets, admins respond.
 *
 * - Auto-creates schema if missing (Turso fresh deploy)
 * - All actions return tagged union { ok, ... } so prod errors aren't redacted
 * - Email notifications via Resend on status change
 */

import { revalidatePath } from "next/cache";
import { requireUser, isAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

// ============================================================
// Auto-create tables if missing (Turso fresh deploy)
// ============================================================

let schemaReady = false;
async function ensureSupportSchema() {
  if (schemaReady) return;
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SupportTicket" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "category" TEXT NOT NULL DEFAULT 'OTHER',
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "preview" TEXT,
      "assignedTo" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "resolvedAt" DATETIME,
      CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    )`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SupportMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ticketId" TEXT NOT NULL,
      "authorRole" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "attachments" TEXT,
      "internal" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE
    )`);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SupportTicket_userId_updatedAt_idx" ON "SupportTicket"("userId","updatedAt")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId","createdAt")`
    );
    schemaReady = true;
  } catch (e) {
    console.warn("[ensureSupportSchema]", (e as Error).message);
  }
}

// ============================================================
// Types
// ============================================================

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketCategory =
  | "BUG"
  | "QUESTION"
  | "BILLING"
  | "FEATURE"
  | "OTHER";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type TicketSummary = {
  id: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  preview: string | null;
  createdAt: string;
  updatedAt: string;
  unread?: boolean;
};

export type TicketDetail = {
  id: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  messages: {
    id: string;
    authorRole: "user" | "admin";
    authorId: string;
    content: string;
    internal: boolean;
    createdAt: string;
  }[];
};

// ============================================================
// User-facing actions
// ============================================================

export async function createTicket(args: {
  subject: string;
  category: TicketCategory;
  message: string;
  priority?: TicketPriority;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    await ensureSupportSchema();
    if (!args.subject.trim() || !args.message.trim()) {
      return { ok: false, error: "Asunto y mensaje son obligatorios." };
    }
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: args.subject.trim().slice(0, 200),
        category: args.category,
        priority: args.priority ?? "NORMAL",
        preview: args.message.slice(0, 140),
        messages: {
          create: {
            authorRole: "user",
            authorId: user.id,
            content: args.message.trim().slice(0, 8000),
          },
        },
      },
      select: { id: true },
    });

    // Notify admin (best-effort)
    notifyAdminNewTicket({
      ticketId: ticket.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      subject: args.subject,
      category: args.category,
      message: args.message,
    }).catch(() => {});

    revalidatePath("/soporte");
    return { ok: true, id: ticket.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function listMyTickets(): Promise<TicketSummary[]> {
  const user = await requireUser();
  await ensureSupportSchema();
  const rows = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      subject: true,
      status: true,
      category: true,
      priority: true,
      preview: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status as TicketStatus,
    category: r.category as TicketCategory,
    priority: r.priority as TicketPriority,
    preview: r.preview,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getTicket(
  ticketId: string
): Promise<TicketDetail | null> {
  const user = await requireUser();
  await ensureSupportSchema();
  const admin = await isAdmin();
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      ...(admin ? {} : { userId: user.id }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        where: admin ? {} : { internal: false },
      },
    },
  });
  if (!ticket) return null;
  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status as TicketStatus,
    category: ticket.category as TicketCategory,
    priority: ticket.priority as TicketPriority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    user: ticket.user,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      authorRole: m.authorRole === "admin" ? "admin" : "user",
      authorId: m.authorId,
      content: m.content,
      internal: m.internal,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function replyToTicket(args: {
  ticketId: string;
  content: string;
  internal?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await requireUser();
    await ensureSupportSchema();
    if (!args.content.trim()) {
      return { ok: false, error: "Mensaje vacío." };
    }
    const admin = await isAdmin();
    const internal = !!args.internal && admin;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: args.ticketId,
        ...(admin ? {} : { userId: user.id }),
      },
      select: { id: true, userId: true, subject: true },
    });
    if (!ticket) return { ok: false, error: "Ticket no encontrado." };

    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        authorRole: admin ? "admin" : "user",
        authorId: user.id,
        content: args.content.trim().slice(0, 8000),
        internal,
      },
    });

    // Bump ticket updated, set IN_PROGRESS if admin replied to OPEN
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        updatedAt: new Date(),
        ...(admin && !internal ? { status: "IN_PROGRESS" } : {}),
      },
    });

    // Notify other party (best-effort)
    if (admin && !internal) {
      const u = await prisma.user.findUnique({
        where: { id: ticket.userId },
        select: { name: true, email: true },
      });
      if (u?.email) {
        notifyUserReply({
          ticketId: ticket.id,
          subject: ticket.subject,
          userName: u.name,
          userEmail: u.email,
          reply: args.content,
        }).catch(() => {});
      }
    } else if (!admin) {
      notifyAdminUserReply({
        ticketId: ticket.id,
        subject: ticket.subject,
        userName: user.name,
        userEmail: user.email,
        reply: args.content,
      }).catch(() => {});
    }

    revalidatePath(`/soporte/${ticket.id}`);
    revalidatePath(`/admin/soporte`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Admin actions
// ============================================================

export async function listAllTickets(filter?: {
  status?: TicketStatus;
  category?: TicketCategory;
}): Promise<(TicketSummary & { user: { name: string; email: string } })[]> {
  await requireUser();
  if (!(await isAdmin())) throw new Error("Admin required");
  await ensureSupportSchema();
  const rows = await prisma.supportTicket.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.category ? { category: filter.category } : {}),
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status as TicketStatus,
    category: r.category as TicketCategory,
    priority: r.priority as TicketPriority,
    preview: r.preview,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    user: r.user,
  }));
}

export async function updateTicketStatus(args: {
  ticketId: string;
  status: TicketStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireUser();
    if (!(await isAdmin())) {
      return { ok: false, error: "Admin required" };
    }
    await ensureSupportSchema();
    await prisma.supportTicket.update({
      where: { id: args.ticketId },
      data: {
        status: args.status,
        resolvedAt:
          args.status === "RESOLVED" || args.status === "CLOSED"
            ? new Date()
            : null,
      },
    });
    revalidatePath(`/admin/soporte`);
    revalidatePath(`/soporte/${args.ticketId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ============================================================
// Email notifications (best-effort)
// ============================================================

const ADMIN_EMAIL = "bergson@estaila.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://estaila.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function notifyAdminNewTicket(args: {
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
}) {
  const url = `${APP_URL}/admin/soporte/${args.ticketId}`;
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Soporte ${args.category}] ${args.subject}`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <p style="font-size:11px;color:#00bf63;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Nuevo ticket</p>
      <h2 style="margin:8px 0 4px;font-size:18px;">${escapeHtml(args.subject)}</h2>
      <p style="color:#737373;font-size:13px;margin:0 0 16px;">${escapeHtml(args.userName)} · ${escapeHtml(args.userEmail)}</p>
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(args.message)}</div>
      <p style="margin-top:18px;"><a href="${url}" style="background:#00bf63;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13px;">Responder ticket →</a></p>
    </div>`,
  });
}

async function notifyAdminUserReply(args: {
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
  reply: string;
}) {
  const url = `${APP_URL}/admin/soporte/${args.ticketId}`;
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Re] ${args.subject}`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <p style="font-size:11px;color:#00bf63;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Respuesta del usuario</p>
      <h2 style="margin:8px 0 4px;font-size:18px;">${escapeHtml(args.subject)}</h2>
      <p style="color:#737373;font-size:13px;margin:0 0 16px;">${escapeHtml(args.userName)} · ${escapeHtml(args.userEmail)}</p>
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(args.reply)}</div>
      <p style="margin-top:18px;"><a href="${url}" style="color:#0a0a0a;font-weight:600;">Ver hilo →</a></p>
    </div>`,
  });
}

async function notifyUserReply(args: {
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
  reply: string;
}) {
  const url = `${APP_URL}/soporte/${args.ticketId}`;
  await sendEmail({
    to: args.userEmail,
    subject: `Re: ${args.subject}`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <p style="font-size:11px;color:#00bf63;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Soporte estaila</p>
      <h2 style="margin:8px 0 16px;font-size:18px;">Hola ${escapeHtml(args.userName.split(" ")[0])}, te respondimos</h2>
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:8px;padding:14px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(args.reply)}</div>
      <p style="margin-top:18px;"><a href="${url}" style="background:#00bf63;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13px;">Ver hilo →</a></p>
      <p style="margin-top:24px;color:#737373;font-size:12px;">Responde a este email o desde la app para continuar la conversación.</p>
    </div>`,
  });
}
