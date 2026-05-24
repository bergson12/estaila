import Link from "next/link";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; plan?: string; id?: string }>;
}) {
  const sp = await searchParams;
  const isSub = sp.type === "sub";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSub ? "¡Suscripción confirmada!" : "¡Pago recibido!"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSub
            ? `Plan ${sp.plan ?? ""} activado. Tus créditos se han añadido a la cuenta.`
            : `Tus créditos ya están disponibles en el Studio IA.`}
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-left text-xs text-muted-foreground">
          <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
          <p>
            PayPal puede tardar unos segundos en notificar el sistema. Si no ves los créditos, refresca
            esta página en 30s o contacta soporte.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link href="/pricing">Ver mi plan</Link>
          </Button>
          <Button asChild>
            <Link href="/studio">
              Ir al Studio
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
