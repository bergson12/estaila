import Link from "next/link";
import { XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <XCircle className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Pago cancelado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No se ha procesado ningún cargo. Puedes volver a intentar cuando quieras.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Volver</Link>
          </Button>
          <Button asChild>
            <Link href="/pricing">Ver planes</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
