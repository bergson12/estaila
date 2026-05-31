import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { listConversations } from "@/lib/actions/ai-text";
import { getDict } from "@/lib/i18n/server";
import { AsistenteChat } from "@/components/asistente/asistente-chat";

export const dynamic = "force-dynamic";

export default async function AsistentePage() {
  const user = await requireUser();
  const t = await getDict();
  const [dbUser, conversations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, plan: true },
    }),
    listConversations().catch(() => []),
  ]);

  return (
    <AsistenteChat
      plan={dbUser?.plan ?? "FREE"}
      userName={dbUser?.name ?? user.name ?? t.asistente.defaultName}
      initialConversations={conversations}
    />
  );
}
