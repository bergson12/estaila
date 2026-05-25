import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAppSettings } from "@/lib/app-settings";
import { isGoogleAuthEnabled, isEmailVerificationEnabled } from "@/lib/auth-config";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const s = await getAppSettings();
  if (!s.signupsEnabled) {
    return (
      <Card className="p-7 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Registro cerrado temporalmente</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos en lista de espera. Vuelve pronto.
        </p>
        <p className="mt-5 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </Card>
    );
  }
  return (
    <SignupForm
      googleEnabled={isGoogleAuthEnabled()}
      requiresVerification={isEmailVerificationEnabled()}
    />
  );
}
