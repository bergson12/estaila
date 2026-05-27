"use client";

import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <Card className="p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Enlace inválido</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Este enlace no es válido o expiró. Solicita uno nuevo desde la
              pantalla de "Olvidé mi contraseña".
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href="/forgot-password">Solicitar otro enlace</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Volver a login</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (pw !== pw2) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: pw,
        token: token!,
      });
      if (error) {
        toast.error(error.message ?? "No se pudo restablecer la contraseña");
        return;
      }
      toast.success("Contraseña actualizada. Inicia sesión.");
      router.push("/login");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-7">
      <div className="mb-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Crear nueva contraseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige una contraseña fuerte (mínimo 6 caracteres). Después te
          enviaremos a iniciar sesión.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            disabled={submitting}
            required
            minLength={6}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password-confirm">Confirma la contraseña</Label>
          <Input
            id="password-confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            disabled={submitting}
            required
            minLength={6}
          />
          {pw && pw2 && pw !== pw2 && (
            <p className="text-xs text-destructive">
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || pw.length < 6 || pw !== pw2}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Actualizar contraseña
        </Button>
      </form>
    </Card>
  );
}
