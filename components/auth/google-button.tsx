"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * Google sign-in / sign-up button.
 *
 * Auto-hidden when the GOOGLE_CLIENT_ID env var isn't set
 * (server passes `available` so the button never renders broken).
 */
export function GoogleButton({
  available,
  callbackURL = "/inicio",
  label = "Continuar con Google",
}: {
  available: boolean;
  callbackURL?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  if (!available) return null;

  async function onClick() {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (e) {
      toast.error((e as Error).message ?? "No se pudo iniciar sesión");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2.5 font-medium"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {label}
      </Button>
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          o con email
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.71-1.58 2.69-3.9 2.69-6.64z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.27c-.81.55-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.94v2.34A9 9 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 013.68 9c0-.6.1-1.17.29-1.71V4.96H.94A9 9 0 000 9c0 1.45.35 2.82.94 4.04l3.03-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.94 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
