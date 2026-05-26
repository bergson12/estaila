"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/15 blur-[120px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,191,99,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,191,99,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <Link
        href="/"
        className="relative mb-8 flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/iso-estaila.png"
          alt="Estaila"
          className="h-8 w-8 object-contain"
        />
        <span className="text-base font-semibold tracking-tight">estaila</span>
      </Link>

      <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
        <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
      </div>

      <h1 className="relative text-2xl font-bold tracking-tight md:text-3xl">
        Algo salió mal
      </h1>
      <p className="relative mt-2 max-w-md text-center text-sm text-muted-foreground">
        Encontramos un error inesperado. El equipo fue notificado
        automáticamente. Intenta de nuevo o vuelve al inicio.
      </p>

      {error.digest && (
        <p className="relative mt-2 font-mono text-[10px] text-muted-foreground/60">
          ID: {error.digest}
        </p>
      )}

      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCw className="mr-1.5 h-3.5 w-3.5" />
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/inicio">
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Ir al inicio
          </Link>
        </Button>
      </div>

      <p className="relative mt-10 text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} estaila · CRM + AI Studio
      </p>
    </main>
  );
}
