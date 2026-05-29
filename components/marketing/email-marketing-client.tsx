"use client";

/**
 * EmailMarketingClient — constructor de campañas de email (P-007 v1).
 *
 * Selecciona audiencia (todos con email / por tipo / búsqueda + checkboxes),
 * opcionalmente una propiedad de contexto, y abre SendEmailDialog para
 * elegir plantilla y enviar (server action sendTemplatedEmail, máx 100).
 */

import {
  CheckSquare,
  Mail,
  Search,
  Send,
  Square,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SendEmailDialog } from "@/components/email/send-email-dialog";
import { labelFor, CONTACT_TYPES } from "@/lib/constants";
import type { EmailAudienceContact } from "@/lib/actions/email";

type Property = { id: string; title: string };

const MAX = 100;

export function EmailMarketingClient({
  audience,
  properties,
}: {
  audience: EmailAudienceContact[];
  properties: Property[];
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [propertyId, setPropertyId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Counts per type for the segment chips
  const typeCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const c of audience) acc[c.type] = (acc[c.type] ?? 0) + 1;
    return acc;
  }, [audience]);

  const types = useMemo(
    () => Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]),
    [typeCounts]
  );

  const filtered = useMemo(() => {
    return audience.filter((c) => {
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [audience, typeFilter, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= MAX) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of filtered) {
        if (next.size >= MAX) break;
        next.add(c.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const selectedProperty = properties.find((p) => p.id === propertyId) ?? null;
  const selectedIds = Array.from(selected);

  if (audience.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Mail className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Aún no tienes contactos con email</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Agrega el email a tus contactos para poder enviarles campañas.
        </p>
        <Button asChild size="sm" className="mt-4" variant="outline">
          <a href="/contactos">Ir a Contactos</a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      {/* ===== Audiencia ===== */}
      <Card className="overflow-hidden p-0">
        {/* Toolbar */}
        <div className="space-y-3 border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="h-9 pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <SegChip
              active={typeFilter === "ALL"}
              onClick={() => setTypeFilter("ALL")}
              label="Todos"
              count={audience.length}
            />
            {types.map((t) => (
              <SegChip
                key={t}
                active={typeFilter === t}
                onClick={() => setTypeFilter(t)}
                label={labelFor(CONTACT_TYPES, t)}
                count={typeCounts[t]}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={selectAllVisible}
              className="font-medium text-primary hover:underline"
            >
              Seleccionar visibles ({filtered.length})
            </button>
            {selected.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-muted-foreground hover:text-foreground"
              >
                Limpiar ({selected.size})
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[52vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-muted-foreground">
              Sin resultados.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((c) => {
                const checked = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => toggle(c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                        checked && "bg-primary/5"
                      )}
                    >
                      {checked ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {c.email}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {labelFor(CONTACT_TYPES, c.type)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* ===== Panel de campaña ===== */}
      <div className="space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none tabular-nums">
                {selected.size}
              </p>
              <p className="text-[11px] text-muted-foreground">
                destinatario{selected.size === 1 ? "" : "s"} · máx {MAX}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Propiedad (opcional)
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary/40"
            >
              <option value="">Sin propiedad</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Requerida para plantillas de listado / open house.
            </p>
          </div>

          <Button
            className="mt-4 w-full"
            disabled={selected.size === 0}
            onClick={() => setDialogOpen(true)}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Crear campaña
          </Button>
        </Card>

        <Card className="p-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Las campañas usan tus plantillas con la marca del agente. El
            reply-to apunta a tu correo. Cada envío se registra en el timeline
            del contacto.
          </p>
        </Card>
      </div>

      <SendEmailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        contactIds={selectedIds}
        contactCount={selectedIds.length}
        propertyId={propertyId || null}
        propertyTitle={selectedProperty?.title ?? null}
      />
    </div>
  );
}

function SegChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? "border-primary/40 bg-primary text-primary-foreground"
          : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px] tabular-nums",
          active ? "bg-white/20" : "bg-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}
