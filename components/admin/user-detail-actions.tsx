"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  Pause,
  Play,
  ShieldCheck,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  KeyRound,
  Loader2,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changePlan,
  adjustCredits,
  setSuspended,
  setRole,
  resetMonthlyCredits,
} from "@/lib/actions/admin";
import {
  sendPasswordResetEmail,
  setUserPasswordDirect,
} from "@/lib/actions/admin-password";

type UserMini = {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  suspended: boolean;
  credits: number;
};

export function UserDetailActions({ user }: { user: UserMini }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function withToast<T>(promise: Promise<T>, success: string) {
    startTransition(async () => {
      try {
        await promise;
        toast.success(success);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <Card className="flex flex-wrap items-center gap-2 p-3">
      <span className="ml-1 mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Acciones admin
      </span>

      <ChangePlanDialog
        currentPlan={user.plan}
        userName={user.name}
        onConfirm={(plan) => withToast(changePlan(user.id, plan), `Plan → ${plan}`)}
      />

      <AdjustCreditsDialog
        userName={user.name}
        currentCredits={user.credits}
        onConfirm={(delta, reason) =>
          withToast(adjustCredits(user.id, delta, reason), `${delta > 0 ? "+" : ""}${delta} créditos`)
        }
      />

      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => withToast(resetMonthlyCredits(user.id), "Créditos reseteados al plan")}
      >
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Reset mensual
      </Button>

      <Button
        variant={user.suspended ? "default" : "outline"}
        size="sm"
        disabled={pending}
        onClick={() =>
          withToast(setSuspended(user.id, !user.suspended), user.suspended ? "Reactivado" : "Suspendido")
        }
      >
        {user.suspended ? (
          <>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Reactivar
          </>
        ) : (
          <>
            <Pause className="mr-1.5 h-3.5 w-3.5" />
            Suspender
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          withToast(
            setRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN"),
            user.role === "ADMIN" ? "Rol → USER" : "Rol → ADMIN"
          )
        }
      >
        {user.role === "ADMIN" ? (
          <>
            <UserIcon className="mr-1.5 h-3.5 w-3.5" />
            Quitar admin
          </>
        ) : (
          <>
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Hacer admin
          </>
        )}
      </Button>

      <PasswordResetDialog userId={user.id} userName={user.name} userEmail={user.email} />
    </Card>
  );
}

function PasswordResetDialog({
  userId,
  userName,
  userEmail,
}: {
  userId: string;
  userName: string;
  userEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"email" | "direct">("email");
  const [newPw, setNewPw] = useState("");
  const [working, setWorking] = useState(false);

  async function sendEmail() {
    setWorking(true);
    try {
      const r = await sendPasswordResetEmail({ userId });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Enlace de reset enviado a ${userEmail}`);
      setOpen(false);
    } finally {
      setWorking(false);
    }
  }

  async function setDirect() {
    if (newPw.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    setWorking(true);
    try {
      const r = await setUserPasswordDirect({ userId, newPassword: newPw });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Contraseña actualizada");
      setNewPw("");
      setOpen(false);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="mr-1.5 h-3.5 w-3.5" />
          Reset contraseña
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resetear contraseña de {userName}</DialogTitle>
          <DialogDescription>
            Elige cómo quieres restablecer la contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-xs transition-all ${
                mode === "email"
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card/50 hover:border-foreground/20"
              }`}
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">Enviar enlace al usuario</span>
              <span className="text-[10px] text-muted-foreground">
                Recomendado · usuario elige
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-xs transition-all ${
                mode === "direct"
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card/50 hover:border-foreground/20"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">Definir manualmente</span>
              <span className="text-[10px] text-muted-foreground">
                Solo si no puede acceder al email
              </span>
            </button>
          </div>

          {mode === "email" && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs">
              Se enviará un email de reset a{" "}
              <strong className="font-mono">{userEmail}</strong>. El enlace
              expira en 1 hora. El usuario crea su propia contraseña — admin
              nunca la ve.
            </div>
          )}

          {mode === "direct" && (
            <div className="space-y-2">
              <Label htmlFor="new-pw" className="text-[11px]">
                Nueva contraseña (mínimo 6 caracteres)
              </Label>
              <Input
                id="new-pw"
                type="text"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="contraseña-temporal-123"
                minLength={6}
                className="font-mono"
              />
              <p className="text-[10px] text-amber-600">
                ⚠️ Avisa al usuario que cambie la contraseña al iniciar
                sesión.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={working}
          >
            Cancelar
          </Button>
          {mode === "email" ? (
            <Button onClick={sendEmail} disabled={working}>
              {working ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="mr-1.5 h-3.5 w-3.5" />
              )}
              Enviar enlace
            </Button>
          ) : (
            <Button
              onClick={setDirect}
              disabled={working || newPw.length < 6}
            >
              {working ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              )}
              Guardar contraseña
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePlanDialog({
  currentPlan,
  userName,
  onConfirm,
}: {
  currentPlan: string;
  userName: string;
  onConfirm: (plan: "FREE" | "PRO" | "TEAM") => void;
}) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<"FREE" | "PRO" | "TEAM">(currentPlan as "FREE" | "PRO" | "TEAM");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentPlan === "FREE" ? <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-1.5 h-3.5 w-3.5" />}
          Cambiar plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar plan de {userName}</DialogTitle>
          <DialogDescription>
            Plan actual: <span className="font-semibold">{currentPlan}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Nuevo plan</Label>
          <Select value={plan} onValueChange={(v) => setPlan(v as "FREE" | "PRO" | "TEAM")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">FREE — gratuito</SelectItem>
              <SelectItem value="PRO">PRO — $15/mes</SelectItem>
              <SelectItem value="TEAM">TEAM — $39/mes</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            No procesa cobro real. Solo cambia el plan en la cuenta del usuario.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={plan === currentPlan}
            onClick={() => {
              onConfirm(plan);
              setOpen(false);
            }}
          >
            Aplicar cambio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustCreditsDialog({
  userName,
  currentCredits,
  onConfirm,
}: {
  userName: string;
  currentCredits: number;
  onConfirm: (delta: number, reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState(50);
  const [reason, setReason] = useState("Admin grant");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" />
          <Minus className="-ml-1.5 mr-1.5 h-3.5 w-3.5" />
          Ajustar créditos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar créditos de {userName}</DialogTitle>
          <DialogDescription>
            Créditos actuales: <span className="font-mono font-semibold">{currentCredits}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Delta (positivo = sumar, negativo = restar)</Label>
            <Input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value || "0", 10))}
              className="mt-1"
            />
            <div className="mt-2 flex gap-1.5">
              {[10, 50, 100, -10, -50].map((d) => (
                <button
                  key={d}
                  onClick={() => setDelta(d)}
                  className={`rounded-md border px-2 py-0.5 text-xs ${
                    delta === d
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {d > 0 ? "+" : ""}{d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Motivo (para auditoría)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              placeholder="Refund, grant, support fix..."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Resultado: <span className="font-mono font-semibold">{currentCredits + delta}</span> créditos
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!delta}
            onClick={() => {
              onConfirm(delta, reason);
              setOpen(false);
            }}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
