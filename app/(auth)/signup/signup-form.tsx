"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Loader2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { GoogleButton } from "@/components/auth/google-button";

const Schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormValues = z.infer<typeof Schema>;

export function SignupForm({
  googleEnabled = false,
  requiresVerification = false,
}: {
  googleEnabled?: boolean;
  requiresVerification?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { error } = await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
        callbackURL: "/onboarding",
      });
      if (error) {
        toast.error(error.message ?? "Error al crear cuenta");
        return;
      }
      if (requiresVerification) {
        setPendingEmail(values.email);
        return;
      }
      toast.success("¡Cuenta creada! Empezamos en 60 segundos.");
      router.push("/onboarding");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingEmail) {
    return (
      <Card className="p-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <Mail className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-semibold leading-tight">
          Revisa tu correo
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos un enlace de verificación a{" "}
          <span className="font-medium text-foreground">{pendingEmail}</span>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Haz click en el botón del email para confirmar tu cuenta y entrar a
          tu CRM.
        </p>
        <p className="mt-5 text-[11px] text-muted-foreground">
          ¿No lo ves? Revisa la carpeta de Spam o promociones.
        </p>
      </Card>
    );
  }

  const benefits = [
    "5 créditos de Studio IA incluidos",
    "CRM completo + hasta 10 propiedades",
    "Sin tarjeta de crédito",
    "Cancela cuando quieras",
  ];

  return (
    <Card className="p-7">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight">Empieza gratis</h1>
          <p className="text-xs text-muted-foreground">
            Setup en menos de 60 segundos
          </p>
        </div>
      </div>

      <ul className="mb-6 space-y-2 rounded-lg border border-border bg-card/40 p-3.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs">
            <CheckCircle2
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
              strokeWidth={2}
            />
            <span className="text-foreground/90">{b}</span>
          </li>
        ))}
      </ul>

      <GoogleButton available={googleEnabled} callbackURL="/onboarding" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Tu nombre"
            autoComplete="name"
            disabled={submitting}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            disabled={submitting}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              disabled={submitting}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {showPwd ? (
                <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting} size="lg">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta gratis
        </Button>

        <p className="text-center text-[10px] text-muted-foreground">
          Al crear cuenta aceptas los{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacidad
          </Link>
          .
        </p>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Iniciar sesión
        </Link>
      </p>
    </Card>
  );
}
