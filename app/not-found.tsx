"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Ambient background — subtle green glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px]" />
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

      {/* Logo */}
      <Link
        href="/"
        className="relative mb-10 flex items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/iso-estaila.png"
          alt="Estaila"
          className="h-8 w-8 object-contain"
        />
        <span className="text-base font-semibold tracking-tight">estaila</span>
      </Link>

      {/* 404 number — display font, big */}
      <p className="relative font-mono text-[120px] font-bold leading-none tracking-tighter text-primary md:text-[160px]">
        404
      </p>

      <h1 className="relative mt-2 text-2xl font-bold tracking-tight md:text-3xl">
        Esta página no existe
      </h1>
      <p className="relative mt-2 max-w-md text-center text-sm text-muted-foreground">
        La URL no coincide con ninguna ruta. Es posible que el enlace esté roto
        o la página se haya movido.
      </p>

      {/* Actions */}
      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/inicio">
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Ir al inicio
          </Link>
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Volver atrás
        </Button>
      </div>

      {/* Quick links */}
      <div className="relative mt-8 grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { label: "Propiedades", href: "/propiedades" },
          { label: "Contactos", href: "/contactos" },
          { label: "Agenda", href: "/agenda" },
          { label: "Pipeline", href: "/pipeline" },
          { label: "Studio IA", href: "/studio" },
          { label: "Configuración", href: "/settings" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <span>{l.label}</span>
            <Search className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <p className="relative mt-10 text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} estaila · CRM + AI Studio
      </p>
    </main>
  );
}
