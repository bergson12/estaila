"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Megaphone,
  ToggleRight,
  Sparkles,
  Hash,
  Save,
  AlertTriangle,
  Settings as SettingsIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAppSettings } from "@/lib/actions/admin";
import type { AppSettingsValues } from "@/lib/app-settings";

export function SettingsForm({ initial }: { initial: AppSettingsValues }) {
  const router = useRouter();
  const [state, setState] = useState<AppSettingsValues>(initial);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof AppSettingsValues>(k: K, v: AppSettingsValues[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function save() {
    startTransition(async () => {
      try {
        await updateAppSettings(state);
        toast.success("Configuración guardada");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const dirty = JSON.stringify(initial) !== JSON.stringify(state);

  return (
    <div className="space-y-6 pb-32">
      {/* Banner */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Megaphone className="h-3.5 w-3.5" />
          Anuncio global
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Mensaje que aparece en la parte superior del dashboard para todos los usuarios.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <Label className="text-sm font-medium">Banner activo</Label>
              <p className="text-xs text-muted-foreground">
                Muestra/oculta el banner sin borrar el mensaje
              </p>
            </div>
            <Switch
              checked={state.bannerActive}
              onCheckedChange={(v) => set("bannerActive", v)}
            />
          </div>
          <div>
            <Label className="text-xs">Mensaje</Label>
            <Textarea
              value={state.bannerMessage ?? ""}
              onChange={(e) => set("bannerMessage", e.target.value || null)}
              placeholder="Ej: Mantenimiento programado el sábado 5pm UTC. Studio IA puede estar lento."
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Tono</Label>
            <Select
              value={state.bannerType}
              onValueChange={(v) => set("bannerType", v as AppSettingsValues["bannerType"])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">Info (azul)</SelectItem>
                <SelectItem value="SUCCESS">Éxito (verde)</SelectItem>
                <SelectItem value="WARN">Advertencia (ámbar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Feature flags */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <ToggleRight className="h-3.5 w-3.5" />
          Feature flags
        </h3>

        <FlagRow
          label="Signups abiertos"
          desc="Permite registro de nuevos usuarios. Desactívalo para cerrar la plataforma temporalmente."
          checked={state.signupsEnabled}
          onChange={(v) => set("signupsEnabled", v)}
        />
        <FlagRow
          label="Studio IA disponible"
          desc="Si está OFF, las herramientas de Studio retornan error. Útil para emergencias de costos."
          checked={state.studioEnabled}
          onChange={(v) => set("studioEnabled", v)}
        />
        <FlagRow
          label="Marketing IA disponible"
          desc="Generación de copys + hashtags + reels via IA."
          checked={state.marketingEnabled}
          onChange={(v) => set("marketingEnabled", v)}
        />
        <FlagRow
          label="Modo mantenimiento"
          desc="Bloquea TODAS las rutas excepto /login y /admin. Mostrar página de mantenimiento."
          checked={state.maintenanceMode}
          onChange={(v) => set("maintenanceMode", v)}
          danger
        />
      </Card>

      {/* AI Provider */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Proveedor IA
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Forzar un proveedor o dejar que el sistema escoja automáticamente.
        </p>
        <Select
          value={state.aiProvider}
          onValueChange={(v) => set("aiProvider", v as AppSettingsValues["aiProvider"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AUTO">AUTO — Gemini si hay key, fallback a mock</SelectItem>
            <SelectItem value="GEMINI">GEMINI — solo Nano Banana real (cobra)</SelectItem>
            <SelectItem value="MOCK">MOCK — solo filtros CSS (sin costo)</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-muted-foreground">
          MOCK es útil para test sin gastar cuota. GEMINI fuerza error si la key no funciona (en lugar de fallback silencioso).
        </p>
      </Card>

      {/* Defaults */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Hash className="h-3.5 w-3.5" />
          Defaults de usuarios nuevos
        </h3>
        <div>
          <Label className="text-xs">Créditos iniciales al registrarse (plan FREE)</Label>
          <Input
            type="number"
            min={0}
            max={500}
            value={state.defaultCredits}
            onChange={(e) => set("defaultCredits", parseInt(e.target.value || "0", 10))}
            className="mt-1 max-w-[160px]"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Recomendado: 5-10. Demasiado bajo desincentiva pruebas, demasiado alto come margen.
          </p>
        </div>
      </Card>

      {/* Sticky save bar */}
      <div
        className={`pointer-events-auto fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all ${
          dirty ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <SettingsIcon className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">Cambios sin guardar</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setState(initial)}
          disabled={pending}
        >
          Descartar
        </Button>
        <Button size="sm" onClick={save} disabled={pending}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Guardar
        </Button>
      </div>
    </div>
  );
}

function FlagRow({
  label,
  desc,
  checked,
  onChange,
  danger,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div
      className={`mb-2 flex items-center justify-between rounded-lg border p-3 last:mb-0 ${
        danger && checked
          ? "border-rose-500/40 bg-rose-500/5"
          : "bg-muted/30"
      }`}
    >
      <div className="min-w-0 flex-1 pr-4">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          {danger && checked && (
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
          )}
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
