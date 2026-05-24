"use client";

import { LayoutGrid, LayoutList, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { setLayoutMode } from "@/lib/layout-prefs";
import { cn } from "@/lib/utils";

/**
 * Layout mode segmented toggle — used inside the user-menu dropdown.
 * Switches between vertical sidebar and horizontal top-nav layouts.
 * Persists via cookie + revalidates the root layout.
 */
export function LayoutModeToggle({
  currentMode,
}: {
  currentMode: "sidebar" | "topbar";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingMode, setPendingMode] = useState<"sidebar" | "topbar" | null>(
    null
  );

  // Reset visual pending state once route has actually changed
  useEffect(() => {
    setPendingMode(null);
  }, [currentMode]);

  function apply(mode: "sidebar" | "topbar") {
    if (mode === currentMode) return;
    setPendingMode(mode);
    startTransition(async () => {
      try {
        await setLayoutMode(mode);
        router.refresh();
      } catch (e) {
        setPendingMode(null);
        toast.error((e as Error).message);
      }
    });
  }

  // What the UI should highlight RIGHT NOW (optimistic)
  const visible = pendingMode ?? currentMode;

  return (
    <div className="px-1.5 py-2">
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Layout
      </p>
      <div className="flex gap-1 rounded-xl border border-border bg-background/50 p-1">
        <ModeButton
          mode="sidebar"
          active={visible === "sidebar"}
          loading={pending && pendingMode === "sidebar"}
          disabled={pending}
          onClick={() => apply("sidebar")}
          Icon={LayoutList}
          label="Vertical"
        />
        <ModeButton
          mode="topbar"
          active={visible === "topbar"}
          loading={pending && pendingMode === "topbar"}
          disabled={pending}
          onClick={() => apply("topbar")}
          Icon={LayoutGrid}
          label="Horizontal"
        />
      </div>
      <p className="mt-1.5 px-2 text-[10px] text-muted-foreground">
        Cambia la dirección del menú principal
      </p>
    </div>
  );
}

function ModeButton({
  active,
  loading,
  disabled,
  onClick,
  Icon,
  label,
}: {
  mode: "sidebar" | "topbar";
  active: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  Icon: typeof LayoutList;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
        active
          ? "bg-card text-foreground shadow-sm ring-1 ring-border"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {label}
    </button>
  );
}
