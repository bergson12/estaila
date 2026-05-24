"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/lib/actions/organization";

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go() {
    startTransition(async () => {
      try {
        await acceptInvitation(token);
        toast.success("Bienvenido al equipo");
        router.push("/empresa");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Button onClick={go} disabled={pending}>
      <Check className="mr-1.5 h-3.5 w-3.5" />
      {pending ? "Aceptando…" : "Aceptar invitación"}
    </Button>
  );
}
