import Link from "next/link";
import { Wrench } from "lucide-react";

export function MaintenanceScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
          <Wrench className="h-7 w-7 text-amber-500" strokeWidth={1.75} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Mantenimiento en curso
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Estamos haciendo mejoras. Volvemos en unos minutos. Disculpa las molestias.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          <Link href="/login" className="underline hover:text-foreground">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
