"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type OrgBranding = {
  name?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  fontPair?: "ELEGANT" | "MODERN" | "EDITORIAL" | "MINIMAL";
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  customDomain?: string | null;
  whiteLabel?: boolean;
};

const PLAN_SEATS: Record<string, number> = {
  TEAM: 5,
  AGENCY: 15,
  ENTERPRISE: 100,
};

// ---------- Read ----------

export async function getMyOrganization() {
  const user = await requireUser();
  const member = await prisma.organizationMember.findFirst({
    where: { userId: user.id, acceptedAt: { not: null } },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  if (!member) return null;
  return { ...member.organization, myRole: member.role as OrgRole };
}

export async function getOrgFull(orgId: string) {
  const user = await requireUser();
  const myMembership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
  });
  if (!myMembership || !myMembership.acceptedAt) return null;

  const [org, members, teams] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.team.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      include: {
        members: {
          include: {
            member: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
      },
    }),
  ]);
  if (!org) return null;
  return { org, members, teams, myRole: myMembership.role as OrgRole };
}

export async function getMyPendingInvitations() {
  const user = await requireUser();
  return prisma.organizationMember.findMany({
    where: {
      OR: [
        { userId: user.id, acceptedAt: null },
        { invitedEmail: user.email, userId: null },
      ],
    },
    include: {
      organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
}

// ---------- Create ----------

export async function createOrganization(args: {
  name: string;
  slug?: string;
}): Promise<{ id: string; slug: string }> {
  const user = await requireUser();
  const name = args.name.trim();
  if (!name || name.length < 2) throw new Error("Nombre demasiado corto");

  // Slug
  const baseSlug =
    args.slug?.trim() ||
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  // Ensure unique
  let slug = baseSlug;
  for (let i = 1; i < 20; i++) {
    const exists = await prisma.organization.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i + 1}`;
  }

  // User can only own one organization
  const existing = await prisma.organizationMember.findFirst({
    where: { userId: user.id, role: "OWNER" },
  });
  if (existing) throw new Error("Ya tienes una organización");

  // Plan defaults — match user's current plan or default to TEAM
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });
  const initialPlan =
    dbUser?.plan === "AGENCY" ? "AGENCY" : "TEAM";

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      plan: initialPlan,
      maxSeats: PLAN_SEATS[initialPlan] ?? 5,
      planActive: true,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
          acceptedAt: new Date(),
          invitedById: user.id,
        },
      },
    },
  });

  await audit(user.id, "settings.update", org.id, {
    action: "createOrganization",
    name,
  });

  revalidatePath("/empresa");
  return { id: org.id, slug: org.slug };
}

// ---------- Update branding ----------

async function requireOrgRole(
  orgId: string,
  userId: string,
  allowed: OrgRole[]
) {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
  });
  if (!member || !member.acceptedAt) throw new Error("No perteneces a esta organización");
  if (!allowed.includes(member.role as OrgRole)) {
    throw new Error("No tienes permisos para esta acción");
  }
  return member;
}

export async function updateBranding(
  orgId: string,
  patch: OrgBranding
): Promise<void> {
  const user = await requireUser();
  await requireOrgRole(orgId, user.id, ["OWNER", "ADMIN"]);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.logoUrl !== undefined && { logoUrl: patch.logoUrl }),
      ...(patch.primaryColor !== undefined && { primaryColor: patch.primaryColor }),
      ...(patch.secondaryColor !== undefined && { secondaryColor: patch.secondaryColor }),
      ...(patch.accentColor !== undefined && { accentColor: patch.accentColor }),
      ...(patch.fontPair !== undefined && { fontPair: patch.fontPair }),
      ...(patch.legalName !== undefined && { legalName: patch.legalName }),
      ...(patch.taxId !== undefined && { taxId: patch.taxId }),
      ...(patch.email !== undefined && { email: patch.email }),
      ...(patch.phone !== undefined && { phone: patch.phone }),
      ...(patch.website !== undefined && { website: patch.website }),
      ...(patch.address !== undefined && { address: patch.address }),
      ...(patch.customDomain !== undefined && { customDomain: patch.customDomain }),
      ...(patch.whiteLabel !== undefined && { whiteLabel: patch.whiteLabel }),
    },
  });

  await audit(user.id, "settings.update", orgId, { action: "branding", patch });
  revalidatePath("/empresa");
}

// ---------- Members ----------

export async function inviteMember(args: {
  organizationId: string;
  email: string;
  role: Exclude<OrgRole, "OWNER">;
}): Promise<{ invitationToken: string }> {
  const user = await requireUser();
  await requireOrgRole(args.organizationId, user.id, ["OWNER", "ADMIN"]);

  const email = args.email.trim().toLowerCase();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) throw new Error("Email inválido");

  // Check seats limit
  const org = await prisma.organization.findUnique({
    where: { id: args.organizationId },
    include: { members: { where: { OR: [{ acceptedAt: { not: null } }, { userId: null }] } } },
  });
  if (!org) throw new Error("Organización no encontrada");
  if (org.members.length >= org.maxSeats) {
    throw new Error(
      `Has alcanzado el límite de ${org.maxSeats} asientos. Actualiza tu plan.`
    );
  }

  // Already invited?
  const existing = await prisma.organizationMember.findFirst({
    where: {
      organizationId: args.organizationId,
      OR: [{ invitedEmail: email }, { user: { email } }],
    },
  });
  if (existing) throw new Error("Este email ya está invitado");

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  const invitationToken = randomBytes(24).toString("hex");

  await prisma.organizationMember.create({
    data: {
      organizationId: args.organizationId,
      userId: existingUser?.id ?? null,
      invitedEmail: email,
      role: args.role,
      invitationToken,
      invitedById: user.id,
    },
  });

  await audit(user.id, "user.setRole", null, {
    action: "inviteMember",
    email,
    role: args.role,
    orgId: args.organizationId,
  });

  revalidatePath("/empresa");
  return { invitationToken };
}

export async function changeMemberRole(
  organizationId: string,
  memberId: string,
  role: Exclude<OrgRole, "OWNER">
): Promise<void> {
  const user = await requireUser();
  await requireOrgRole(organizationId, user.id, ["OWNER", "ADMIN"]);

  const target = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });
  if (!target) throw new Error("Miembro no encontrado");
  if (target.role === "OWNER") throw new Error("No puedes cambiar el rol del owner");

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });
  await audit(user.id, "user.setRole", target.userId, { role, orgId: organizationId });
  revalidatePath("/empresa");
}

export async function removeMember(
  organizationId: string,
  memberId: string
): Promise<void> {
  const user = await requireUser();
  await requireOrgRole(organizationId, user.id, ["OWNER", "ADMIN"]);

  const target = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });
  if (!target) throw new Error("Miembro no encontrado");
  if (target.role === "OWNER") throw new Error("No puedes eliminar al owner");

  await prisma.organizationMember.delete({ where: { id: memberId } });
  await audit(user.id, "user.setRole", target.userId, {
    action: "removeMember",
    orgId: organizationId,
  });
  revalidatePath("/empresa");
}

export async function leaveOrganization(organizationId: string): Promise<void> {
  const user = await requireUser();
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) throw new Error("No perteneces a esta organización");
  if (member.role === "OWNER") {
    throw new Error("Los dueños no pueden abandonar. Transfiere o elimina la organización.");
  }
  await prisma.organizationMember.delete({ where: { id: member.id } });
  revalidatePath("/empresa");
}

export async function acceptInvitation(token: string): Promise<void> {
  const user = await requireUser();
  const member = await prisma.organizationMember.findUnique({
    where: { invitationToken: token },
  });
  if (!member) throw new Error("Invitación inválida o expirada");
  if (member.acceptedAt) throw new Error("Esta invitación ya fue aceptada");
  if (
    member.invitedEmail &&
    member.invitedEmail.toLowerCase() !== user.email.toLowerCase()
  ) {
    throw new Error("Esta invitación es para otro email");
  }
  await prisma.organizationMember.update({
    where: { id: member.id },
    data: {
      userId: user.id,
      acceptedAt: new Date(),
      invitationToken: null,
    },
  });
  revalidatePath("/empresa");
}

// Server-action wrappers for forms

export async function createOrganizationAction(formData: FormData): Promise<never> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || undefined;
  await createOrganization({ name, slug });
  redirect("/empresa");
}
