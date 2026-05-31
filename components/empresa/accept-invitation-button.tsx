"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { acceptInvitation } from "@/lib/actions/organization";

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useT();
  const [pending, startTransition] = useTransition();

  function go() {
    startTransition(async () => {
      try {
        await acceptInvitation(token);
        toast.success(t.empresa.toastWelcomeTeam);
        router.push("/empresa");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Button onClick={go} disabled={pending}>
      <Check className="mr-1.5 h-3.5 w-3.5" />
      {pending ? t.empresa.accepting : t.empresa.acceptInvitation}
    </Button>
  );
}
