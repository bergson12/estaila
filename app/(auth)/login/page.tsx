"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const Schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormValues = z.infer<typeof Schema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="p-7 text-sm text-muted-foreground">Cargando...</Card>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/inicio";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: next,
      });
      if (error) {
        toast.error(error.message ?? "Credenciales incorrectas");
        return;
      }
      toast.success("¡Bienvenido de vuelta!");
      router.push(next);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accede a tu CRM y al Studio IA.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={submitting}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Crear cuenta
        </Link>
      </p>
    </Card>
  );
}
