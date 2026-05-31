"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { audit, type AuditAction } from "@/lib/audit";
import {
  invalidateAppSettingsCache,
  type AppSettingsValues,
} from "@/lib/app-settings";

export type UserPlan = "FREE" | "PRO" | "TEAM";

export async function listUsers(args: {
  search?: string;
  plan?: UserPlan | "ALL";
  limit?: number;
}) {
  await requireAdmin();
  const where: Record<string, unknown> = {};
  if (args.plan && args.plan !== "ALL") where.plan = args.plan;
  if (args.search) {
    where.OR = [
      { email: { contains: args.search } },
      { name: { contains: args.search } },
    ];
  }
  return prisma.user.findMany({
    where,
    take: args.limit ?? 50,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      credits: true,
      planActive: true,
      suspended: true,
      paypalSubId: true,
      createdAt: true,
      _count: {
        select: { properties: true, contacts: true, aiGenerations: true },
      },
    },
  });
}

export async function getUserDetail(userId: string) {
  await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      plan: true,
      credits: true,
      planActive: true,
      suspended: true,
      paypalSubId: true,
      planRenewsAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          properties: true,
          contacts: true,
          aiGenerations: true,
          photos: true,
          appointments: true,
          marketingPosts: true,
        },
      },
    },
  });
  if (!user) return null;
  const [billingEvents, recentGens, recentProps, site] = await Promise.all([
    prisma.billingEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.aIGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        tool: true,
        status: true,
        creditsUsed: true,
        createdAt: true,
        errorMsg: true,
      },
    }),
    prisma.property.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        category: true,
        operation: true,
        priceUSD: true,
        createdAt: true,
      },
    }),
    prisma.site.findUnique({
      where: { userId },
      select: { slug: true, template: true, published: true },
    }),
  ]);
  return { user, billingEvents, recentGens, recentProps, site };
}

export async function changePlan(userId: string, plan: UserPlan): Promise<void> {
  const admin = await requireAdmin();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { plan, planActive: plan !== "FREE" },
    }),
    prisma.billingEvent.create({
      data: {
        userId,
        type: "ADMIN_GRANT",
        metadata: JSON.stringify({ changedTo: plan, by: admin.id }),
      },
    }),
  ]);
  await audit(admin.id, "user.changePlan", userId, { plan });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function adjustCredits(
  userId: string,
  delta: number,
  reason: string
): Promise<void> {
  const admin = await requireAdmin();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: delta } },
    }),
    prisma.billingEvent.create({
      data: {
        userId,
        type: delta > 0 ? "ADMIN_GRANT" : "REFUND",
        credits: delta,
        metadata: JSON.stringify({ reason, by: admin.id }),
      },
    }),
  ]);
  await audit(admin.id, "user.adjustCredits", userId, { delta, reason });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function setSuspended(
  userId: string,
  suspended: boolean
): Promise<void> {
  const admin = await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { suspended },
  });
  await audit(admin.id, "user.setSuspended", userId, { suspended });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function setRole(
  userId: string,
  role: "USER" | "ADMIN"
): Promise<void> {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await audit(admin.id, "user.setRole", userId, { role });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function resetMonthlyCredits(userId: string): Promise<void> {
  const admin = await requireAdmin();
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!dbUser) return;
  // Sincronizado con lib/billing-config.ts (PLAN_CREDITS / FREE_MONTHLY_CREDITS).
  const credits =
    dbUser.plan === "AGENCY"
      ? 2000
      : dbUser.plan === "BUSINESS"
        ? 500
        : dbUser.plan === "TEAM"
          ? 200
          : dbUser.plan === "PRO"
            ? 60
            : 10;
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits } }),
    prisma.billingEvent.create({
      data: {
        userId,
        type: "ADMIN_GRANT",
        credits,
        metadata: JSON.stringify({ action: "reset_monthly", by: admin.id }),
      },
    }),
  ]);
  await audit(admin.id, "user.resetCredits", userId, { credits });
  revalidatePath(`/admin/users/${userId}`);
}

export async function getMetrics() {
  await requireAdmin();
  const [users, props, gens, sites, totalCredits, plansBy, recentRevenue] =
    await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.aIGeneration.count(),
      prisma.site.count({ where: { published: true } }),
      prisma.user.aggregate({ _sum: { credits: true } }),
      prisma.user.groupBy({ by: ["plan"], _count: true }),
      prisma.billingEvent.aggregate({
        _sum: { amount: true },
        where: {
          type: { in: ["SUB_ACTIVATED", "SUB_RENEWED", "PACK_PURCHASED"] },
          createdAt: { gte: new Date(Date.now() - 30 * 86400 * 1000) },
        },
      }),
    ]);

  return {
    users,
    props,
    gens,
    sitesPublished: sites,
    totalCreditsOutstanding: totalCredits._sum.credits ?? 0,
    plans: plansBy.reduce<Record<string, number>>((acc, p) => {
      acc[p.plan] = p._count;
      return acc;
    }, {}),
    revenue30d: Number(recentRevenue._sum.amount ?? 0),
  };
}

export async function getRevenueAnalytics() {
  await requireAdmin();
  // last 90 days
  const since = new Date(Date.now() - 90 * 86400 * 1000);
  const events = await prisma.billingEvent.findMany({
    where: {
      type: { in: ["SUB_ACTIVATED", "SUB_RENEWED", "PACK_PURCHASED"] },
      createdAt: { gte: since },
    },
    select: { type: true, amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Bucket by day
  const buckets = new Map<string, { day: string; subs: number; packs: number; total: number }>();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { day: key, subs: 0, packs: 0, total: 0 });
  }
  for (const e of events) {
    const key = e.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    const amt = Number(e.amount);
    if (e.type === "PACK_PURCHASED") b.packs += amt;
    else b.subs += amt;
    b.total += amt;
  }
  const daily = Array.from(buckets.values());

  // Signups by day (last 90)
  const newUsers = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, plan: true },
  });
  const signups = new Map<string, number>();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400 * 1000);
    signups.set(d.toISOString().slice(0, 10), 0);
  }
  for (const u of newUsers) {
    const k = u.createdAt.toISOString().slice(0, 10);
    signups.set(k, (signups.get(k) ?? 0) + 1);
  }
  const signupsArr = Array.from(signups.entries()).map(([day, count]) => ({ day, count }));

  // MRR snapshot
  const activeSubs = await prisma.user.groupBy({
    by: ["plan"],
    where: { planActive: true, plan: { in: ["PRO", "TEAM"] } },
    _count: true,
  });
  let mrr = 0;
  for (const s of activeSubs) {
    if (s.plan === "PRO") mrr += s._count * 15;
    if (s.plan === "TEAM") mrr += s._count * 39;
  }

  return { daily, signups: signupsArr, mrr, arr: mrr * 12 };
}

export async function listRecentGenerations(limit = 30) {
  await requireAdmin();
  return prisma.aIGeneration.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tool: true,
      status: true,
      creditsUsed: true,
      errorMsg: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
  });
}

export async function listBillingEvents(limit = 50) {
  await requireAdmin();
  return prisma.billingEvent.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });
}

export async function getActivityFeed(limit = 20) {
  await requireAdmin();
  // Stream of: recent signups + billing events + generations + admin actions
  const since = new Date(Date.now() - 30 * 86400 * 1000);
  const [signups, billing, gens, audit] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, email: true, name: true, createdAt: true, plan: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.billingEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.aIGeneration.findMany({
      where: { createdAt: { gte: since }, status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);
  const actorIds = Array.from(new Set(audit.map((a) => a.actorId)));
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true },
  });
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  type Entry = {
    id: string;
    kind: "signup" | "billing" | "gen_fail" | "admin";
    at: Date;
    title: string;
    sub: string;
    user?: { name: string; email: string };
    severity?: "neutral" | "positive" | "warning" | "danger";
  };

  const entries: Entry[] = [
    ...signups.map<Entry>((s) => ({
      id: `s-${s.id}`,
      kind: "signup",
      at: s.createdAt,
      title: `Nuevo signup`,
      sub: `${s.name} · ${s.plan}`,
      user: { name: s.name, email: s.email },
      severity: "positive",
    })),
    ...billing.map<Entry>((b) => ({
      id: `b-${b.id}`,
      kind: "billing",
      at: b.createdAt,
      title:
        b.type === "SUB_ACTIVATED"
          ? `Suscripción activada`
          : b.type === "SUB_RENEWED"
            ? `Renovación`
            : b.type === "SUB_CANCELLED"
              ? `Cancelación`
              : b.type === "PACK_PURCHASED"
                ? `Pack comprado`
                : b.type,
      sub: `${b.user.name} · $${Number(b.amount).toFixed(2)}`,
      user: { name: b.user.name, email: b.user.email },
      severity:
        b.type === "SUB_CANCELLED"
          ? "danger"
          : b.type === "PACK_PURCHASED" || b.type === "SUB_ACTIVATED" || b.type === "SUB_RENEWED"
            ? "positive"
            : "neutral",
    })),
    ...gens.map<Entry>((g) => ({
      id: `g-${g.id}`,
      kind: "gen_fail",
      at: g.createdAt,
      title: `Generación falló · ${g.tool}`,
      sub: `${g.user.name} · ${g.errorMsg?.slice(0, 60) ?? "error"}`,
      user: { name: g.user.name, email: g.user.email },
      severity: "warning",
    })),
    ...audit.map<Entry>((a) => {
      const actor = actorMap.get(a.actorId);
      return {
        id: `a-${a.id}`,
        kind: "admin",
        at: a.createdAt,
        title: a.action,
        sub: `${actor?.name ?? "?"}${a.targetId ? ` → ${a.targetId.slice(0, 8)}…` : ""}`,
        user: actor ? { name: actor.name, email: actor.email } : undefined,
        severity: "neutral",
      };
    }),
  ];

  return entries
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}

export async function getTopUsers() {
  await requireAdmin();
  // Top by generations (proxy for engagement/cost)
  const topByGens = await prisma.aIGeneration.groupBy({
    by: ["userId"],
    _count: true,
    orderBy: { _count: { userId: "desc" } },
    take: 8,
  });
  const userIds = topByGens.map((x) => x.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, plan: true, credits: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const topByActivity = topByGens
    .map((t) => ({ user: userMap.get(t.userId)!, gens: t._count }))
    .filter((x) => x.user);

  // Top by revenue
  const events = await prisma.billingEvent.findMany({
    where: {
      type: { in: ["SUB_ACTIVATED", "SUB_RENEWED", "PACK_PURCHASED"] },
    },
    select: { userId: true, amount: true },
  });
  const revByUser = new Map<string, number>();
  for (const e of events) {
    revByUser.set(
      e.userId,
      (revByUser.get(e.userId) ?? 0) + Number(e.amount)
    );
  }
  const revIds = Array.from(revByUser.keys()).slice(0, 200);
  const revUsers = await prisma.user.findMany({
    where: { id: { in: revIds } },
    select: { id: true, name: true, email: true, plan: true },
  });
  const topByRevenue = revUsers
    .map((u) => ({ user: u, revenue: revByUser.get(u.id) ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return { topByActivity, topByRevenue };
}

export async function getSystemHealth() {
  await requireAdmin();
  const since24 = new Date(Date.now() - 24 * 3600 * 1000);
  const [totalGens24h, failedGens24h, signups24h, signupsPrev24h] =
    await Promise.all([
      prisma.aIGeneration.count({ where: { createdAt: { gte: since24 } } }),
      prisma.aIGeneration.count({
        where: { createdAt: { gte: since24 }, status: "FAILED" },
      }),
      prisma.user.count({ where: { createdAt: { gte: since24 } } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 48 * 3600 * 1000),
            lt: since24,
          },
        },
      }),
    ]);
  return {
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    paypalConfigured: !!(
      process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    ),
    mapboxConfigured: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    totalGens24h,
    failedGens24h,
    failureRate24h:
      totalGens24h > 0 ? Math.round((failedGens24h / totalGens24h) * 100) : 0,
    signups24h,
    signupsDelta: signups24h - signupsPrev24h,
  };
}

export async function listAuditLogs(limit = 80) {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  // Hydrate actor + target manually (no relation defined to keep model simple)
  const userIds = Array.from(
    new Set(logs.flatMap((l) => [l.actorId, l.targetId].filter(Boolean) as string[]))
  );
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const map = new Map(users.map((u) => [u.id, u]));
  return logs.map((l) => ({
    ...l,
    actor: map.get(l.actorId) ?? null,
    target: l.targetId ? (map.get(l.targetId) ?? null) : null,
  }));
}

// ---- Settings ---------------------------------------------------------------

export async function updateAppSettings(
  patch: Partial<AppSettingsValues>
): Promise<void> {
  const admin = await requireAdmin();
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: { ...patch, updatedById: admin.id },
    create: { id: "singleton", ...patch, updatedById: admin.id },
  });
  invalidateAppSettingsCache();
  await audit(admin.id, "settings.update", null, patch as Record<string, unknown>);
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
