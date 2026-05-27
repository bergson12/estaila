import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      plan: true,
      credits: true,
      role: true,
      agentRole: true,
      agentLocation: true,
      agentPhone: true,
      agentBio: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Configuración"
          description="No pudimos cargar tu perfil. Vuelve a iniciar sesión."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Configuración"
        description="Personaliza tu perfil. Aparece en tu portal público, tarjeta digital y plantillas legales."
      />
      <ProfileForm user={dbUser} />
    </div>
  );
}
