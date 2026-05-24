"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { PLAN_MAX_TEAMS, type PlanKey } from "@/lib/billing-config";
import crypto from "node:crypto";

// ============================================================
// HELPERS
// ============================================================

async function requireOrgRole(args: {
  organizationId: string;
  allow: ("OWNER" | "ADMIN" | "MEMBER")[];
}) {
  const user = await requireUser();
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId: args.organizationId,
      userId: user.id,
      acceptedAt: { not: null },
    },
  });
  if (!member) throw new Error("No perteneces a esta organización");
  if (!args.allow.includes(member.role as never)) {
    throw new Error("Sin permisos para esta acción");
  }
  return { user, member };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ============================================================
// TEAM CRUD
// ============================================================

export type TeamInput = {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
};

export async function createTeam(orgId: string, input: TeamInput) {
  const { user } = await requireOrgRole({
    organizationId: orgId,
    allow: ["OWNER", "ADMIN"],
  });

  // Check plan supports teams
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, _count: { select: { teams: true } } },
  });
  if (!org) throw new Error("Organización no encontrada");
  const maxTeams = PLAN_MAX_TEAMS[org.plan as PlanKey] ?? 0;
  if (org._count.teams >= maxTeams) {
    throw new Error(
      `Tu plan ${org.plan} permite hasta ${maxTeams} equipos. Sube a BUSINESS o AGENCY para crear más.`
    );
  }

  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let attempt = 1;
  while (
    await prisma.team.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug } },
    })
  ) {
    slug = `${baseSlug}-${++attempt}`;
  }

  const team = await prisma.team.create({
    data: {
      organizationId: orgId,
      name: input.name.trim().slice(0, 60),
      slug,
      color: input.color ?? "#3B82F6",
      icon: input.icon ?? "Users",
      description: input.description?.trim().slice(0, 240) || null,
    },
  });

  // Add creator as LEAD
  const myMember = await prisma.organizationMember.findFirst({
    where: { organizationId: orgId, userId: user.id },
  });
  if (myMember) {
    await prisma.teamMember.create({
      data: { teamId: team.id, memberId: myMember.id, role: "LEAD" },
    });
  }

  revalidatePath("/empresa");
  return team;
}

export async function updateTeam(
  teamId: string,
  patch: Partial<TeamInput>
) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error("Equipo no encontrado");
  await requireOrgRole({
    organizationId: team.organizationId,
    allow: ["OWNER", "ADMIN"],
  });
  await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(patch.name !== undefined && { name: patch.name.trim().slice(0, 60) }),
      ...(patch.color !== undefined && { color: patch.color }),
      ...(patch.icon !== undefined && { icon: patch.icon }),
      ...(patch.description !== undefined && {
        description: patch.description?.trim().slice(0, 240) || null,
      }),
    },
  });
  revalidatePath("/empresa");
}

export async function deleteTeam(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error("Equipo no encontrado");
  await requireOrgRole({
    organizationId: team.organizationId,
    allow: ["OWNER", "ADMIN"],
  });
  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath("/empresa");
}

// ============================================================
// MEMBER ASSIGNMENT
// ============================================================

export async function addMemberToTeam(args: {
  teamId: string;
  memberId: string;
  role?: "LEAD" | "MEMBER";
}) {
  const team = await prisma.team.findUnique({ where: { id: args.teamId } });
  if (!team) throw new Error("Equipo no encontrado");
  await requireOrgRole({
    organizationId: team.organizationId,
    allow: ["OWNER", "ADMIN"],
  });

  // Verify member belongs to same org
  const member = await prisma.organizationMember.findFirst({
    where: { id: args.memberId, organizationId: team.organizationId },
  });
  if (!member) throw new Error("Miembro no encontrado en la organización");

  await prisma.teamMember.upsert({
    where: {
      teamId_memberId: { teamId: args.teamId, memberId: args.memberId },
    },
    create: {
      teamId: args.teamId,
      memberId: args.memberId,
      role: args.role ?? "MEMBER",
    },
    update: { role: args.role ?? undefined },
  });

  revalidatePath("/empresa");
}

export async function removeMemberFromTeam(args: {
  teamId: string;
  memberId: string;
}) {
  const team = await prisma.team.findUnique({ where: { id: args.teamId } });
  if (!team) throw new Error("Equipo no encontrado");
  await requireOrgRole({
    organizationId: team.organizationId,
    allow: ["OWNER", "ADMIN"],
  });
  await prisma.teamMember.deleteMany({
    where: { teamId: args.teamId, memberId: args.memberId },
  });
  revalidatePath("/empresa");
}

// ============================================================
// CUSTOM DOMAIN
// ============================================================

const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function setCustomDomain(orgId: string, domain: string) {
  await requireOrgRole({
    organizationId: orgId,
    allow: ["OWNER", "ADMIN"],
  });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, domainVerifyToken: true },
  });
  if (!org) throw new Error("Organización no encontrada");

  // Gate by plan
  const { PLAN_HAS_CUSTOM_DOMAIN } = await import("@/lib/billing-config");
  if (!PLAN_HAS_CUSTOM_DOMAIN[org.plan as PlanKey]) {
    throw new Error(
      `Tu plan ${org.plan} no soporta dominio personalizado. Sube a BUSINESS o AGENCY.`
    );
  }

  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!DOMAIN_REGEX.test(clean)) {
    throw new Error("Dominio inválido. Formato esperado: tudominio.com");
  }

  // Check uniqueness
  const existing = await prisma.organization.findFirst({
    where: { customDomain: clean, NOT: { id: orgId } },
  });
  if (existing) throw new Error("Este dominio ya está en uso por otra cuenta");

  const token =
    org.domainVerifyToken || `rex-${crypto.randomBytes(16).toString("hex")}`;

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      customDomain: clean,
      domainVerifyToken: token,
      domainVerifiedAt: null, // reset verification
    },
  });

  revalidatePath("/empresa");
  return { domain: clean, token };
}

export async function clearCustomDomain(orgId: string) {
  await requireOrgRole({
    organizationId: orgId,
    allow: ["OWNER", "ADMIN"],
  });
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      customDomain: null,
      domainVerifiedAt: null,
      domainVerifyToken: null,
    },
  });
  revalidatePath("/empresa");
}

/**
 * Verify the DNS TXT record matches the stored verification token.
 * Production: actually query DNS via dns.promises.resolveTxt.
 * Dev: shortcut — mark as verified if token exists.
 */
export async function verifyCustomDomain(orgId: string) {
  await requireOrgRole({
    organizationId: orgId,
    allow: ["OWNER", "ADMIN"],
  });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      customDomain: true,
      domainVerifyToken: true,
    },
  });
  if (!org?.customDomain || !org.domainVerifyToken) {
    throw new Error("Configura primero el dominio");
  }

  let verified = false;
  let detail = "";

  try {
    const dns = await import("node:dns");
    const records = await dns.promises.resolveTxt(`_rex-verify.${org.customDomain}`);
    const flat = records.flat();
    if (flat.includes(org.domainVerifyToken)) {
      verified = true;
    } else {
      detail = `Token TXT no encontrado. Esperado: ${org.domainVerifyToken}`;
    }
  } catch (e) {
    detail = `No se pudo resolver DNS: ${(e as Error).message}`;
  }

  if (verified) {
    await prisma.organization.update({
      where: { id: orgId },
      data: { domainVerifiedAt: new Date() },
    });
  }

  revalidatePath("/empresa");
  return { verified, detail };
}
