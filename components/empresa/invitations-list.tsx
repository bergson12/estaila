"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acceptInvitation } from "@/lib/actions/organization";

type Invite = {
  id: string;
  token: string | null;
  orgName: string;
  orgSlug: string;
  orgLogo: string | null;
  invitedBy: string;
  role: string;
};

export function InvitationsList({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept(token: string | null) {
    if (!token) {
      toast.error("Invitación sin token válido");
      return;
    }
    startTransition(async () => {
      try {
        await acceptInvitation(token);
        toast.success("Te uniste a la organización");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <ul className="space-y-2">
      {invites.map((i) => (
        <li
          key={i.id}
          className="flex items-center gap-3 rounded-lg border bg-card/30 p-3"
        >
          {i.orgLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={i.orgLogo}
              alt={i.orgName}
              className="h-9 w-9 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{i.orgName}</p>
            <p className="truncate text-xs text-muted-foreground">
              Invitado por {i.invitedBy}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">{i.role}</Badge>
          <Button size="sm" onClick={() => accept(i.token)} disabled={pending}>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Aceptar
          </Button>
        </li>
      ))}
    </ul>
  );
}
