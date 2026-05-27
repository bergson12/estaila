"use client";

import { CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });
      if (error) {
        // Better Auth returns generic error to not reveal account existence
        // Show success regardless to avoid email enumeration
      }
      setSent(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card className="p-7">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Revisa tu email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Si <strong className="text-foreground">{email}</strong> existe en
            nuestro sistema, recibirás un email con instrucciones para
            restablecer tu contraseña. El enlace expira en{" "}
            <strong>1 hora</strong>.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            ¿No te llegó? Revisa spam o intenta de nuevo en 1 minuto.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Usar otro email
            </Button>
            <Button asChild>
              <Link href="/login">Volver a login</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <div className="mb-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Te enviamos un enlace para crear una nueva. Solo necesitamos el email
          con el que te registraste.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !email.trim()}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar enlace
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        ¿Te acordaste?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Volver a login
        </Link>
      </p>
    </Card>
  );
}
