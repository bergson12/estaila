"use client";

import { CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudio } from "./studio-context";

export function CreditsMeter({ plan }: { plan: string }) {
  const { credits, cost, isGenerating } = useStudio();
  const insufficient = credits < cost;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <CreditCard className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-mono text-xl font-bold tabular-nums ${
              insufficient ? "text-destructive" : ""
            }`}
          >
            {credits}
          </span>
          <span className="text-xs text-muted-foreground">créditos</span>
          <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
            {plan}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            Esta operación: {cost} crédito{cost > 1 ? "s" : ""}
          </span>
          <Link
            href="/pricing"
            className="font-medium text-primary hover:underline"
          >
            <Plus className="-mb-px mr-0.5 inline h-3 w-3" />
            Comprar
          </Link>
        </div>
      </div>
      {isGenerating && (
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
      )}
    </div>
  );
}
