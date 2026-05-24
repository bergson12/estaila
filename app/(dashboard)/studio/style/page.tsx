import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { StudioProvider } from "@/components/studio/studio-context";
import { StyleClient } from "./client";

export const dynamic = "force-dynamic";

export default async function StyleChangePage({
  searchParams,
}: {
  searchParams: Promise<{ photoUrl?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true, plan: true },
  });
  return (
    <StudioProvider
      tool="STYLE_CHANGE"
      cost={2}
      initialCredits={dbUser?.credits ?? 0}
      initialImage={sp.photoUrl ? { url: sp.photoUrl } : null}
    >
      <StyleClient plan={dbUser?.plan ?? "FREE"} />
    </StudioProvider>
  );
}
