import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { AcceptInvitationButton } from "@/components/empresa/accept-invitation-button";

export const dynamic = "force-dynamic";

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token;
  if (!token) redirect("/");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invitacion?token=${token}`)}`);
  }

  const member = await prisma.organizationMember.findUnique({
    where: { invitationToken: token },
    include: { organization: true, invitedBy: { select: { name: true, email: true } } },
  });

  if (!member) {
    return (
      <ErrorCard
        title="Invitación no válida"
        body="Esta invitación no existe o ya expiró."
      />
    );
  }
  if (member.acceptedAt) {
    return (
      <ErrorCard
        title="Ya aceptaste esta invitación"
        body="Puedes acceder a tu empresa desde el menú."
        success
      />
    );
  }
  if (
    member.invitedEmail &&
    member.invitedEmail.toLowerCase() !== user.email.toLowerCase()
  ) {
    return (
      <ErrorCard
        title="Esta invitación es para otro email"
        body={`Estás autenticado como ${user.email}. La invitación fue enviada a ${member.invitedEmail}.`}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          {member.organization.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.organization.logoUrl}
              alt={member.organization.name}
              className="h-12 w-12 rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold">{member.organization.name}</h1>
            <p className="text-xs text-muted-foreground">/p/{member.organization.slug}</p>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{member.invitedBy.name}</span> te invitó a unirte como <span className="font-mono text-foreground">{member.role}</span>.
        </p>

        <div className="mt-6 grid gap-2">
          <AcceptInvitationButton token={token} />
          <Button asChild variant="outline">
            <Link href="/">Cancelar</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ErrorCard({
  title,
  body,
  success,
}: {
  title: string;
  body: string;
  success?: boolean;
}) {
  const Icon = success ? CheckCircle2 : AlertTriangle;
  const tone = success ? "text-emerald-500" : "text-amber-500";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <Icon className={`mx-auto h-10 w-10 ${tone}`} strokeWidth={1.5} />
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Button asChild className="mt-6">
          <Link href="/">Ir al dashboard</Link>
        </Button>
      </Card>
    </div>
  );
}
