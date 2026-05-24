"use client";

import { useEffect, useState, useTransition } from "react";
import { Users2, X, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { findDuplicates, mergeContacts, type DuplicateGroup } from "@/lib/actions/contact-duplicates";

/**
 * Banner shown above the contacts table when duplicates are detected.
 * Click → opens a merge dialog.
 */
export function DuplicatesBanner() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeGroup, setActiveGroup] = useState<DuplicateGroup | null>(null);

  useEffect(() => {
    // Check sessionStorage dismiss
    if (typeof window !== "undefined") {
      const d = sessionStorage.getItem("contacts:dups:dismissed");
      if (d) setDismissed(true);
    }
    findDuplicates().then(setGroups).catch(() => setGroups([]));
  }, []);

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("contacts:dups:dismissed", "1");
    }
  }

  if (dismissed || groups.length === 0) return null;

  const total = groups.reduce((sum, g) => sum + g.contacts.length, 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
            <Users2 className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium">
              Detectamos{" "}
              <span className="font-mono font-semibold tabular-nums">
                {groups.length}
              </span>{" "}
              {groups.length === 1 ? "duplicado" : "duplicados"} ·{" "}
              <span className="font-mono tabular-nums">{total}</span> contactos
              afectados
            </p>
            <p className="text-[11px] text-muted-foreground">
              Revisa y fusiona para mantener tu directorio limpio.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="h-8"
          >
            Revisar
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            onClick={handleDismiss}
            aria-label="Descartar"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <MergeDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setActiveGroup(null);
        }}
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={setActiveGroup}
        onMerged={() => {
          // Re-fetch
          findDuplicates().then(setGroups);
          setActiveGroup(null);
        }}
      />
    </>
  );
}

// ============================================================
// MERGE DIALOG
// ============================================================

function MergeDialog({
  open,
  onOpenChange,
  groups,
  activeGroup,
  onSelectGroup,
  onMerged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: DuplicateGroup[];
  activeGroup: DuplicateGroup | null;
  onSelectGroup: (g: DuplicateGroup | null) => void;
  onMerged: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (activeGroup) {
      // Default target = most recently updated
      const sorted = [...activeGroup.contacts].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setTargetId(sorted[0]?.id ?? null);
    } else {
      setTargetId(null);
    }
  }, [activeGroup]);

  async function handleMerge() {
    if (!activeGroup || !targetId) return;
    const sources = activeGroup.contacts
      .map((c) => c.id)
      .filter((id) => id !== targetId);
    if (sources.length === 0) return;
    setPending(true);
    try {
      const r = await mergeContacts({ targetId, sourceIds: sources });
      toast.success(`${r.merged} contactos fusionados`);
      onMerged();
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-amber-500" />
            Fusionar contactos duplicados
          </DialogTitle>
          <DialogDescription>
            {activeGroup
              ? "Selecciona el contacto que se mantiene. Los demás se absorben (datos, tags, propiedades, citas y pipeline cards se mueven al elegido)."
              : "Elige un grupo para revisar."}
          </DialogDescription>
        </DialogHeader>

        {!activeGroup ? (
          // Group list
          <ul className="max-h-[400px] space-y-2 overflow-y-auto">
            {groups.map((g) => (
              <li key={g.key}>
                <button
                  type="button"
                  onClick={() => onSelectGroup(g)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border bg-card/40 p-3 text-left transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.04]"
                >
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/15 text-[10px] uppercase text-amber-600"
                  >
                    {g.reason}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {g.contacts.length} contactos con mismo {g.reason}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {g.contacts.map((c) => c.name).join(" · ")}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          // Group detail
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ¿Cuál se mantiene? ({activeGroup.contacts.length} contactos)
            </p>
            <ul className="space-y-2">
              {activeGroup.contacts.map((c) => {
                const isTarget = c.id === targetId;
                return (
                  <li key={c.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all",
                        isTarget
                          ? "border-primary/50 bg-primary/[0.04]"
                          : "border-border bg-card/40 hover:border-foreground/20"
                      )}
                    >
                      <input
                        type="radio"
                        checked={isTarget}
                        onChange={() => setTargetId(c.id)}
                        className="mt-1 cursor-pointer accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{c.name}</p>
                          {c.favorite && (
                            <span className="text-amber-500">★</span>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase"
                          >
                            {c.type}
                          </Badge>
                          {isTarget && (
                            <Badge className="bg-primary text-primary-foreground text-[9px] uppercase">
                              Mantener
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                          {c.email && <span>{c.email}</span>}
                          {c.phone && <span className="font-mono">{c.phone}</span>}
                          {c.whatsapp && (
                            <span className="font-mono">WA: {c.whatsapp}</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Actualizado{" "}
                          {new Date(c.updatedAt).toLocaleDateString("es", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {activeGroup && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onSelectGroup(null)}
            >
              ← Otro grupo
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          {activeGroup && (
            <Button
              type="button"
              onClick={handleMerge}
              disabled={pending || !targetId}
            >
              {pending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Users2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Fusionar {activeGroup.contacts.length - 1} →{" "}
              {activeGroup.contacts.find((c) => c.id === targetId)?.name ?? "?"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
