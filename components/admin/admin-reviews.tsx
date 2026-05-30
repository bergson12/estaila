"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Eye, Inbox, Star, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import { MODULE_LABEL } from "@/lib/modules";
import { setTesterReviewStatus, setUserTester } from "@/lib/actions/tester-review";

type Rating = { id: string; moduleId: string; rating: number; note: string | null };
type Img = { id: string; imageUrl: string; caption: string | null; moduleId: string | null };
export type AdminReviewRow = {
  id: string;
  createdAt: string;
  status: string;
  overall: number | null;
  positive: string | null;
  negative: string | null;
  improvements: string | null;
  user: { name: string; email: string; image: string | null };
  ratings: Rating[];
  images: Img[];
};

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-amber-500/15 text-amber-600",
  SEEN: "bg-blue-500/15 text-blue-600",
  RESOLVED: "bg-emerald-500/15 text-emerald-600",
};

function avg(ratings: Rating[]) {
  if (!ratings.length) return null;
  return (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1);
}

export function AdminReviews({ reviews }: { reviews: AdminReviewRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");

  function changeStatus(id: string, status: "NEW" | "SEEN" | "RESOLVED") {
    start(async () => {
      try {
        await setTesterReviewStatus(id, status);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function toggleTester(on: boolean) {
    if (!email.trim()) {
      toast.error("Escribe un email.");
      return;
    }
    start(async () => {
      try {
        await setUserTester(email.trim(), on);
        toast.success(on ? "Usuario convertido en tester." : "Rol tester removido.");
        setEmail("");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Gestionar testers */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Gestionar testers</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Convierte un usuario existente en tester (desbloquea todos los módulos + 150 créditos IA).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@usuario.com"
            className="h-9 min-w-[220px] flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          <Button type="button" onClick={() => toggleTester(true)} disabled={pending}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Hacer tester
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toggleTester(false)}
            disabled={pending}
          >
            <UserMinus className="mr-1.5 h-4 w-4" /> Quitar
          </Button>
        </div>
      </div>

      {/* Reseñas */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aún no hay reseñas de testers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                    {r.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.user.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(r.user.name)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.user.name}</p>
                    <p className="text-xs text-muted-foreground">{r.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.overall ? (
                    <span className="flex items-center gap-0.5 text-sm font-medium text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.overall}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      STATUS_STYLE[r.status] ?? "bg-secondary text-muted-foreground"
                    )}
                  >
                    {r.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="mt-3 space-y-1.5 text-sm">
                {r.positive && (
                  <p className="text-foreground">
                    <b className="text-emerald-600">+ </b>
                    {r.positive}
                  </p>
                )}
                {r.negative && (
                  <p className="text-foreground">
                    <b className="text-destructive">− </b>
                    {r.negative}
                  </p>
                )}
                {r.improvements && (
                  <p className="text-foreground">
                    <b className="text-amber-600">↗ </b>
                    {r.improvements}
                  </p>
                )}
              </div>

              {/* Ratings */}
              {r.ratings.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    Promedio {avg(r.ratings)}★ ·
                  </span>
                  {r.ratings.map((rt) => (
                    <span
                      key={rt.id}
                      title={rt.note ?? undefined}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {MODULE_LABEL[rt.moduleId] ?? rt.moduleId}: {rt.rating}★
                      {rt.note ? " 💬" : ""}
                    </span>
                  ))}
                </div>
              )}

              {/* Images */}
              {r.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((im) => (
                    <a
                      key={im.id}
                      href={im.imageUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group relative block"
                      title={im.caption ?? undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={im.imageUrl}
                        alt={im.caption ?? "captura"}
                        className="h-24 w-36 rounded-lg border border-border object-cover transition-opacity group-hover:opacity-80"
                      />
                      {im.moduleId && (
                        <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                          {MODULE_LABEL[im.moduleId] ?? im.moduleId}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("es-DO")}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending || r.status === "SEEN"}
                    onClick={() => changeStatus(r.id, "SEEN")}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" /> Visto
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || r.status === "RESOLVED"}
                    onClick={() => changeStatus(r.id, "RESOLVED")}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resuelto
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
