"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useState } from "react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [, setMouse] = useState({ x: 0.5, y: 0.5 });

  const x = useSpring(0, { stiffness: 80, damping: 30 });
  const y = useSpring(0, { stiffness: 80, damping: 30 });

  useEffect(() => {
    if (reduced) return;
    function onMove(e: MouseEvent) {
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      setMouse({ x: nx, y: ny });
      x.set((nx - 0.5) * 80);
      y.set((ny - 0.5) * 80);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, x, y]);

  const glowX = useTransform(x, (v) => `calc(50% + ${v}px)`);
  const glowY = useTransform(y, (v) => `calc(33% + ${v}px)`);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 overflow-hidden">
      {/* Animated background mesh */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {!reduced && (
          <>
            <motion.div
              style={{ left: glowX, top: glowY }}
              className="absolute h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[140px]"
            />
            <motion.div
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[15%] top-[20%] h-[300px] w-[300px] rounded-full bg-emerald-500/15 blur-[100px]"
            />
            <motion.div
              animate={{
                opacity: [0.5, 0.3, 0.5],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute bottom-[15%] left-[10%] h-[350px] w-[350px] rounded-full bg-amber-500/10 blur-[120px]"
            />
          </>
        )}
        {reduced && (
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        )}
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-8"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: -5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30"
          >
            <Building2 className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
          </motion.div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">estaila</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              CRM + Studio IA
            </span>
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative w-full max-w-sm"
      >
        {children}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative mt-8 text-center text-xs text-muted-foreground"
      >
        © {new Date().getFullYear()} estaila · CRM + AI Studio
      </motion.p>
    </div>
  );
}
