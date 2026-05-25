import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { isGoogleAuthEnabled } from "@/lib/auth-config";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const googleEnabled = isGoogleAuthEnabled();
  return (
    <Suspense
      fallback={
        <Card className="p-7 text-sm text-muted-foreground">Cargando...</Card>
      }
    >
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
