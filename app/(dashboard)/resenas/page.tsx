import { FlaskConical } from "lucide-react";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getMyTesterReviews } from "@/lib/actions/tester-review";
import { ReviewForm } from "@/components/tester/review-form";
import { MODULE_LABEL } from "@/lib/modules";

export const metadata = { title: "Reseñas" };

export default async function ResenasPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isTester: true, role: true },
  });
  const allowed = !!db?.isTester || db?.role === "ADMIN";

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <FlaskConical className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <h1 className="text-lg font-semibold text-foreground">Sección de testers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta sección es solo para cuentas tester. Si crees que deberías tener acceso, contáctanos.
        </p>
      </div>
    );
  }

  const past = await getMyTesterReviews();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <span className="eyebrow">Programa Tester</span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Deja tu reseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu feedback nos ayuda a mejorar estaila. Sé específico: qué funcionó, qué no, y cómo mejorarlo.
        </p>
      </header>

      <ReviewForm defaultModule={sp.m} />

      {past.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-foreground">
            Tus reseñas anteriores ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("es-DO")}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {r.status}
                  </span>
                </div>
                {r.overall ? (
                  <div className="mt-1 text-sm text-amber-500">
                    {"★".repeat(r.overall)}
                    <span className="text-muted-foreground/40">{"★".repeat(5 - r.overall)}</span>
                  </div>
                ) : null}
                {r.positive && (
                  <p className="mt-2 text-sm text-foreground">
                    <b className="text-emerald-600">+ </b>
                    {r.positive}
                  </p>
                )}
                {r.negative && (
                  <p className="mt-1 text-sm text-foreground">
                    <b className="text-destructive">− </b>
                    {r.negative}
                  </p>
                )}
                {r.improvements && (
                  <p className="mt-1 text-sm text-foreground">
                    <b className="text-amber-600">↗ </b>
                    {r.improvements}
                  </p>
                )}
                {r.ratings.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.ratings.map((rt) => (
                      <span
                        key={rt.id}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {MODULE_LABEL[rt.moduleId] ?? rt.moduleId}: {rt.rating}★
                      </span>
                    ))}
                  </div>
                )}
                {r.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.images.map((im) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={im.id}
                        src={im.imageUrl}
                        alt="captura"
                        className="h-16 w-24 rounded border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
