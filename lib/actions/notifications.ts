"use server";

import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

/**
 * Live notification feed.
 *
 * Builds a unified list from multiple sources:
 *   - Appointments today and the next 24h
 *   - New leads (unattended)
 *   - Pipeline cards whose target close date is overdue
 *   - Properties with recent share spikes
 *
 * Returns items ordered by urgency.
 */

export type LiveNotification = {
  id: string;
  type: "APPOINTMENT" | "LEAD" | "PIPELINE" | "PROPERTY" | "SYSTEM";
  title: string;
  description: string;
  href: string | null;
  imageUrl: string | null; // contact avatar or property photo
  /** ISO date string */
  when: string;
  unread: boolean;
  urgency: "high" | "medium" | "low";
};

export async function getLiveNotifications(): Promise<LiveNotification[]> {
  const user = await requireUser();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [appointments, leads, pipeline] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        startAt: { gte: now, lte: in24h },
        status: { in: ["PENDIENTE", "EN_CURSO"] },
      },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    prisma.lead.findMany({
      where: {
        agentId: user.id,
        createdAt: { gte: last7d },
        status: { in: ["NUEVO", "CONTACTADO"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            title: true,
            photos: { select: { url: true }, take: 1 },
          },
        },
      },
      take: 5,
    }),
    prisma.pipelineCard.findMany({
      where: {
        userId: user.id,
        nextActionDate: { lte: in24h, gte: last7d },
        stage: { in: ["NUEVO", "CONTACTADO", "VISITA", "NEGOCIACION"] },
      },
      orderBy: { nextActionDate: "asc" },
      take: 5,
    }),
  ]);

  const out: LiveNotification[] = [];

  for (const a of appointments) {
    const date = new Date(a.startAt);
    const minutes = Math.round((date.getTime() - now.getTime()) / 60000);
    const isImminent = minutes <= 60;
    out.push({
      id: `appt-${a.id}`,
      type: "APPOINTMENT",
      title: a.title,
      description:
        minutes < 60
          ? minutes <= 0
            ? `Ahora · ${formatTime(date)}`
            : `En ${minutes} min · ${formatTime(date)}`
          : `${formatRelativeDay(date, now)} · ${formatTime(date)}`,
      href: `/agenda?focus=${a.id}`,
      imageUrl: null,
      when: date.toISOString(),
      unread: true,
      urgency: isImminent ? "high" : "medium",
    });
  }

  for (const l of leads) {
    const photoUrl = l.property?.photos?.[0]?.url ?? null;
    out.push({
      id: `lead-${l.id}`,
      type: "LEAD",
      title: `Nuevo lead: ${l.name}`,
      description: l.property?.title
        ? `Interesado en "${l.property.title}"`
        : "Contacto inicial sin asignar a propiedad",
      href: `/contactos?lead=${l.id}`,
      imageUrl: photoUrl,
      when: l.createdAt.toISOString(),
      unread: l.status === "NUEVO",
      urgency: l.status === "NUEVO" ? "high" : "low",
    });
  }

  for (const p of pipeline) {
    if (!p.nextActionDate) continue;
    const overdue = p.nextActionDate < now;
    const label = p.nextAction ?? "Acción pendiente";
    out.push({
      id: `pipe-${p.id}`,
      type: "PIPELINE",
      title: overdue ? `Vencida: ${label}` : `Próxima: ${label}`,
      description: overdue
        ? `Vencía ${formatRelativeDay(p.nextActionDate, now)}`
        : `${formatRelativeDay(p.nextActionDate, now)}`,
      href: `/pipeline?focus=${p.id}`,
      imageUrl: null,
      when: p.nextActionDate.toISOString(),
      unread: true,
      urgency: overdue ? "high" : "medium",
    });
  }

  return out.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    if (order[a.urgency] !== order[b.urgency]) {
      return order[a.urgency] - order[b.urgency];
    }
    return new Date(a.when).getTime() - new Date(b.when).getTime();
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDay(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "mañana";
  if (diffDays === -1) return "ayer";
  if (diffDays > 0 && diffDays < 7) return `en ${diffDays} días`;
  if (diffDays < 0 && diffDays > -7) return `hace ${Math.abs(diffDays)} días`;
  return target.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}
