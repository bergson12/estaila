"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  Copy,
  Crown,
  Eye,
  Mail,
  Plus,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  changeMemberRole,
  inviteMember,
  removeMember,
} from "@/lib/actions/organization";

type MemberRow = {
  id: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  acceptedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null } | null;
};

const ROLE_META: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  OWNER: { label: "Owner", color: "bg-amber-500/15 text-amber-600", icon: Crown },
  ADMIN: { label: "Admin", color: "bg-blue-500/15 text-blue-600", icon: ShieldCheck },
  MEMBER: { label: "Member", color: "bg-muted text-foreground", icon: UserIcon },
  VIEWER: { label: "Viewer", color: "bg-muted text-muted-foreground", icon: Eye },
};

export function MembersTable({
  orgId,
  maxSeats,
  plan,
  members,
  canEdit,
}: {
  orgId: string;
  maxSeats: number;
  plan: string;
  members: MemberRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tokenJustCreated, setTokenJustCreated] = useState<string | null>(null);

  function withToast<T>(promise: Promise<T>, success: string, after?: () => void) {
    startTransition(async () => {
      try {
        await promise;
        toast.success(success);
        router.refresh();
        after?.();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const seatsUsed = members.length;
  const atLimit = seatsUsed >= maxSeats;

  return (
    <div>
      {/* Seats overview */}
      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Asientos en uso</p>
          <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums">
            {seatsUsed} <span className="text-base font-normal text-muted-foreground">/ {maxSeats}</span>
          </p>
        </div>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${atLimit ? "bg-amber-500" : "bg-primary"}`}
              style={{ width: `${Math.min(100, (seatsUsed / maxSeats) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Plan {plan} · {atLimit ? "Has alcanzado el límite. Actualiza para invitar más miembros." : `${maxSeats - seatsUsed} asientos disponibles`}
          </p>
        </div>
        {canEdit && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button disabled={atLimit}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Invitar miembro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invitar a tu equipo</DialogTitle>
                <DialogDescription>
                  Enviaremos un enlace para que acepte la invitación.
                </DialogDescription>
              </DialogHeader>
              {tokenJustCreated ? (
                <InvitationLinkPanel
                  token={tokenJustCreated}
                  onClose={() => {
                    setTokenJustCreated(null);
                    setInviteOpen(false);
                  }}
                />
              ) : (
                <InviteForm
                  orgId={orgId}
                  pending={pending}
                  onSuccess={(token) => setTokenJustCreated(token)}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </Card>

      {/* Members list */}
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Miembro</th>
              <th className="px-3 py-2.5 font-semibold">Rol</th>
              <th className="px-3 py-2.5 font-semibold">Estado</th>
              <th className="px-3 py-2.5 font-semibold">Desde</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => {
              const meta = ROLE_META[m.role] ?? ROLE_META.MEMBER;
              const RoleIcon = meta.icon;
              const isPending = !m.acceptedAt;
              return (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {m.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.user.image}
                          alt={m.user.name}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {(m.user?.name ?? m.invitedEmail ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {m.user?.name ?? m.invitedEmail ?? "Invitado"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.user?.email ?? m.invitedEmail ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge className={`${meta.color} hover:bg-current/15`}>
                      <RoleIcon className="mr-1 h-2.5 w-2.5" /> {meta.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    {isPending ? (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                        <Clock className="mr-1 h-2.5 w-2.5" /> Pendiente
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("es", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {canEdit && m.role !== "OWNER" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={pending}>
                            Acciones
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
                            Cambiar rol
                          </DropdownMenuLabel>
                          {(["ADMIN", "MEMBER", "VIEWER"] as const).map((r) => (
                            <DropdownMenuItem
                              key={r}
                              disabled={m.role === r}
                              onClick={() =>
                                withToast(changeMemberRole(orgId, m.id, r), `Rol → ${r}`)
                              }
                            >
                              {ROLE_META[r].label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => withToast(removeMember(orgId, m.id), "Miembro eliminado")}
                            className="text-rose-600 focus:text-rose-600"
                          >
                            <X className="mr-2 h-3.5 w-3.5" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No hay miembros aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function InviteForm({
  orgId,
  pending,
  onSuccess,
}: {
  orgId: string;
  pending: boolean;
  onSuccess: (token: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { invitationToken } = await inviteMember({
        organizationId: orgId,
        email,
        role,
      });
      onSuccess(invitationToken);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label className="text-xs">Email</Label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="agente@empresa.com"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Rol</Label>
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin — gestiona miembros y marca</SelectItem>
            <SelectItem value="MEMBER">Member — gestiona sus propiedades</SelectItem>
            <SelectItem value="VIEWER">Viewer — solo lectura</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || pending}>
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          {submitting ? "Generando…" : "Generar invitación"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function InvitationLinkPanel({
  token,
  onClose,
}: {
  token: string;
  onClose: () => void;
}) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/invitacion?token=${token}` : `/invitacion?token=${token}`;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Enlace de invitación
        </p>
        <p className="mt-2 break-all font-mono text-xs">{url}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            navigator.clipboard.writeText(url);
            toast.success("Enlace copiado");
          }}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copiar enlace
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Comparte este enlace con el miembro. Al abrirlo desde su cuenta podrá aceptar la invitación.
      </p>
      <DialogFooter>
        <Button onClick={onClose}>Listo</Button>
      </DialogFooter>
    </div>
  );
}
