"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Modo presentación: pantalla completa con un QR grande de la tarjeta digital.
 * Caso de uso: el agente está frente a un cliente, muestra el QR en su celular
 * y el cliente escanea para abrir la tarjeta (guardar contacto + agendar).
 *
 * Fondo claro forzado (aunque la app esté en dark) para máximo brillo y
 * legibilidad del QR al escanear de cerca.
 */
export function CardQrFullscreen({
  open,
  onClose,
  slug,
  title,
  role,
  avatarUrl,
  primaryColor,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  role: string | null;
  avatarUrl: string | null;
  primaryColor: string;
}) {
  if (!open) return null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://estaila.com";
  const host = origin.replace(/^https?:\/\//, "");
  const url = `${origin}/c/${slug}`;
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white p-6 text-zinc-900"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col items-center gap-2">
        <Avatar className="h-16 w-16 ring-4 ring-zinc-100">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
          <AvatarFallback
            className="text-lg font-semibold text-white"
            style={{ background: primaryColor }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="text-lg font-semibold">{title}</p>
          {role && <p className="text-sm text-zinc-500">{role}</p>}
        </div>
      </div>

      <div
        className="rounded-3xl border-2 bg-white p-5 shadow-xl"
        style={{ borderColor: `${primaryColor}33` }}
      >
        <QRCodeSVG
          value={url}
          size={248}
          level="M"
          marginSize={0}
          fgColor="#16181B"
          bgColor="#ffffff"
        />
      </div>

      <div className="max-w-xs text-center">
        <p className="text-sm font-medium">
          Escanea para guardarme en tus contactos y agendar una cita
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-400 tabular-nums">
          {host}/c/{slug}
        </p>
      </div>
    </motion.div>
  );
}
