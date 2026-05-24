"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/** Toggle between monthly / yearly cycle (writes to ?cycle= search param) */
export function PricingCycleClient({ cycle }: { cycle: "monthly" | "yearly" }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setCycle(next: "monthly" | "yearly") {
    const params = new URLSearchParams(sp);
    if (next === "yearly") params.set("cycle", "yearly");
    else params.delete("cycle");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex h-9 items-center rounded-full border border-border bg-card/60 p-1 text-xs">
      <button
        type="button"
        onClick={() => setCycle("monthly")}
        className={cn(
          "rounded-full px-4 py-1 font-medium transition-colors",
          cycle === "monthly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Mensual
      </button>
      <button
        type="button"
        onClick={() => setCycle("yearly")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 py-1 font-medium transition-colors",
          cycle === "yearly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Anual
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
            cycle === "yearly"
              ? "bg-primary-foreground/20"
              : "bg-emerald-500/15 text-emerald-600"
          )}
        >
          −20%
        </span>
      </button>
    </div>
  );
}
