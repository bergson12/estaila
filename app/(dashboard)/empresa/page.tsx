import { Building2, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth-server";
import { getMyOrganization, getOrgFull, getMyPendingInvitations } from "@/lib/actions/organization";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { CreateOrgForm } from "@/components/empresa/create-org-form";
import { OrgClient } from "@/components/empresa/org-client";
import { InvitationsList } from "@/components/empresa/invitations-list";

export const dynamic = "force-dynamic";

export default async function EmpresaPage() {
  await requireUser();
  const myOrg = await getMyOrganization();

  if (!myOrg) {
    const invites = await getMyPendingInvitations();
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Crea tu empresa"
          description="Configura tu marca, invita a tu equipo y trabaja como agencia. Disponible en planes Team y Agency."
        />

        {invites.length > 0 && (
          <Card className="mb-6 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Invitaciones pendientes
            </h3>
            <InvitationsList invites={invites.map((i) => ({
              id: i.id,
              token: i.invitationToken,
              orgName: i.organization.name,
              orgSlug: i.organization.slug,
              orgLogo: i.organization.logoUrl,
              invitedBy: i.invitedBy.name,
              role: i.role,
            }))} />
          </Card>
        )}

        <Card className="p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Nueva organización</h2>
              <p className="text-xs text-muted-foreground">
                Convierte tu cuenta en agencia con equipo y branding propio.
              </p>
            </div>
          </div>
          <CreateOrgForm />
        </Card>
      </div>
    );
  }

  const detail = await getOrgFull(myOrg.id);
  if (!detail) {
    return (
      <div className="text-sm text-muted-foreground">No tienes acceso a esta organización.</div>
    );
  }

  return (
    <OrgClient
      org={{
        id: detail.org.id,
        slug: detail.org.slug,
        name: detail.org.name,
        logoUrl: detail.org.logoUrl,
        primaryColor: detail.org.primaryColor,
        secondaryColor: detail.org.secondaryColor,
        accentColor: detail.org.accentColor,
        fontPair: detail.org.fontPair,
        legalName: detail.org.legalName,
        taxId: detail.org.taxId,
        email: detail.org.email,
        phone: detail.org.phone,
        website: detail.org.website,
        address: detail.org.address,
        plan: detail.org.plan,
        maxSeats: detail.org.maxSeats,
        planActive: detail.org.planActive,
        customDomain: detail.org.customDomain,
        domainVerifyToken: detail.org.domainVerifyToken ?? null,
        domainVerifiedAt: detail.org.domainVerifiedAt?.toISOString() ?? null,
        whiteLabel: detail.org.whiteLabel,
      }}
      members={detail.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        invitedEmail: m.invitedEmail,
        role: m.role,
        acceptedAt: m.acceptedAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
        user: m.user
          ? { id: m.user.id, name: m.user.name, email: m.user.email, image: m.user.image }
          : null,
      }))}
      teams={detail.teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
        icon: t.icon,
        description: t.description,
        members: t.members.map((tm) => ({
          memberId: tm.memberId,
          role: tm.role,
          member: {
            id: tm.member.id,
            userId: tm.member.userId,
            invitedEmail: tm.member.invitedEmail,
            role: tm.member.role,
            acceptedAt: tm.member.acceptedAt?.toISOString() ?? null,
            user: tm.member.user
              ? {
                  id: tm.member.user.id,
                  name: tm.member.user.name,
                  email: tm.member.user.email,
                  image: tm.member.user.image,
                }
              : null,
          },
        })),
      }))}
      myRole={detail.myRole}
    />
  );
}
