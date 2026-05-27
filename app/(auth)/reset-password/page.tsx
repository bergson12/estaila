import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-7 text-sm text-muted-foreground">Cargando...</Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
