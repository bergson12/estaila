"use client";

import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile";
import { cn, formatDate, initials } from "@/lib/utils";

type DbUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  plan: string;
  credits: number;
  role: string;
  agentRole: string | null;
  agentLocation: string | null;
  agentPhone: string | null;
  createdAt: Date;
};

export function ProfileForm({ user }: { user: DbUser }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [agentRole, setAgentRole] = useState(user.agentRole ?? "");
  const [agentLocation, setAgentLocation] = useState(user.agentLocation ?? "");
  const [agentPhone, setAgentPhone] = useState(user.agentPhone ?? "");
  const [image, setImage] = useState(user.image ?? "");

  const dirty =
    name !== user.name ||
    agentRole !== (user.agentRole ?? "") ||
    agentLocation !== (user.agentLocation ?? "") ||
    agentPhone !== (user.agentPhone ?? "") ||
    image !== (user.image ?? "");

  function save() {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        await updateProfile({
          name: name.trim(),
          agentRole: agentRole.trim() || undefined,
          agentLocation: agentLocation.trim() || undefined,
          agentPhone: agentPhone.trim() || undefined,
          image: image.trim() || undefined,
        });
        toast.success("Perfil actualizado");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Identity hero */}
      <Card className="overflow-hidden rounded-2xl border-border p-0">
        <div className="relative h-24 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary" />
        <div className="-mt-12 flex flex-col items-start gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-card">
              <AvatarImage src={image || undefined} />
              <AvatarFallback className="bg-primary/15 text-2xl font-semibold text-primary">
                {initials(name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="mb-1 min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">
                {name || "Sin nombre"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Miembro desde {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user.role === "ADMIN" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-secondary/40"
            >
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>
                Plan <strong>{user.plan}</strong>
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                · {user.credits} cr
              </span>
            </Link>
          </div>
        </div>
      </Card>

      {/* Personal info */}
      <Card className="rounded-2xl border-border p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <UserIcon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Información personal</h2>
            <p className="text-[11px] text-muted-foreground">
              Aparece en tu portal público, tarjeta digital y plantillas legales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre completo *" className="sm:col-span-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={120}
            />
          </Field>

          <Field label="Email" className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <Input
                value={user.email}
                disabled
                className="bg-secondary/40"
              />
              <span className="text-[10px] text-muted-foreground">
                No editable
              </span>
            </div>
          </Field>

          <Field label="Cargo / Título profesional">
            <Input
              value={agentRole}
              onChange={(e) => setAgentRole(e.target.value)}
              placeholder="Agente inmobiliario · Mi Ciudad"
              maxLength={120}
            />
          </Field>

          <Field label="Ciudad / Zona">
            <Input
              value={agentLocation}
              onChange={(e) => setAgentLocation(e.target.value)}
              placeholder="Miami, FL"
              maxLength={120}
            />
          </Field>

          <Field label="WhatsApp / Teléfono">
            <Input
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              placeholder="+1 555 0100"
              maxLength={40}
              type="tel"
            />
          </Field>

          <Field label="URL de tu foto de perfil">
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
          <p className="text-[11px] text-muted-foreground">
            {dirty
              ? "Cambios sin guardar"
              : "Todos los cambios guardados"}
          </p>
          <Button
            onClick={save}
            disabled={pending || !dirty}
            variant="ink"
          >
            {pending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Guardar cambios
          </Button>
        </div>
      </Card>

      {/* Quick links to other settings */}
      <Card className="rounded-2xl border-border p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Más configuración</h2>
            <p className="text-[11px] text-muted-foreground">
              Branding, dominio, equipos y facturación
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <QuickLink
            href="/empresa"
            icon={<UserIcon className="h-3.5 w-3.5" />}
            label="Mi Empresa"
            desc="Logo, colores, dominio personalizado"
          />
          <QuickLink
            href="/sitio"
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Mi Sitio público"
            desc="Configura tu portal público"
          />
          <QuickLink
            href="/pricing"
            icon={<CreditCard className="h-3.5 w-3.5" />}
            label="Plan y créditos"
            desc="Suscripción + comprar créditos IA"
          />
          <QuickLink
            href="/marketing"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Tarjetas digitales"
            desc="Tu link tipo Linktree"
          />
        </ul>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/30 hover:bg-background"
      >
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
      </Link>
    </li>
  );
}
