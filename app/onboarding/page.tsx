import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      onboardedAt: true,
      agentRole: true,
      agentLocation: true,
      agentPhone: true,
      image: true,
      name: true,
      _count: { select: { properties: true } },
    },
  });

  // If already completed, send them to the dashboard. They can re-run via /onboarding?force=1
  // (handled at the wizard level if you ever need it).
  if (dbUser?.onboardedAt) {
    redirect("/");
  }

  return (
    <OnboardingWizard
      initialProfile={{
        agentRole: dbUser?.agentRole ?? "",
        agentLocation: dbUser?.agentLocation ?? "",
        agentPhone: dbUser?.agentPhone ?? "",
        image: dbUser?.image ?? "",
        name: dbUser?.name ?? "",
      }}
      hasProperty={!!dbUser && dbUser._count.properties > 0}
    />
  );
}
