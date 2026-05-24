"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
  User as UserIcon,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveOnboardingProfile,
  createOnboardingProperty,
  completeOnboarding,
} from "@/lib/actions/onboarding";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

type ProfileState = {
  agentRole: string;
  agentLocation: string;
  agentPhone: string;
  image: string;
  name: string;
};

type PropertyState = {
  title: string;
  category:
    | "CASA"
    | "APARTAMENTO"
    | "VILLA"
    | "TERRENO"
    | "LOCAL"
    | "OFICINA"
    | "EDIFICIO";
  operation: "EN_VENTA" | "EN_ALQUILER" | "EN_CONSIGNACION";
  location: string;
  priceUSD: string;
  bedrooms: string;
  bathrooms: string;
  metersSquared: string;
};

const STEPS = [
  { key: "profile", label: "Tu perfil", icon: UserIcon },
  { key: "property", label: "Primera propiedad", icon: Building2 },
  { key: "studio", label: "Studio IA", icon: Sparkles },
  { key: "done", label: "Listo", icon: CheckCircle2 },
] as const;

const CATEGORY_LABELS: Record<PropertyState["category"], string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  VILLA: "Villa",
  TERRENO: "Terreno",
  LOCAL: "Local comercial",
  OFICINA: "Oficina",
  EDIFICIO: "Edificio",
};

const OPERATION_LABELS: Record<PropertyState["operation"], string> = {
  EN_VENTA: "En venta",
  EN_ALQUILER: "En alquiler",
  EN_CONSIGNACION: "En consignación",
};

// ============================================================
// WIZARD
// ============================================================

export function OnboardingWizard({
  initialProfile,
  hasProperty,
}: {
  initialProfile: ProfileState;
  hasProperty: boolean;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(
    null
  );

  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [property, setProperty] = useState<PropertyState>({
    title: "",
    category: "APARTAMENTO",
    operation: "EN_VENTA",
    location: "",
    priceUSD: "",
    bedrooms: "",
    bathrooms: "",
    metersSquared: "",
  });

  const firstName = profile.name.split(" ")[0];

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function saveProfile() {
    startTransition(async () => {
      try {
        await saveOnboardingProfile({
          agentRole: profile.agentRole || undefined,
          agentLocation: profile.agentLocation || undefined,
          agentPhone: profile.agentPhone || undefined,
          image: profile.image || undefined,
        });
        next();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function createFirstProperty() {
    if (!property.title.trim() || !property.location.trim()) {
      toast.error("Necesitamos título y ubicación al menos.");
      return;
    }
    const priceNum = Number(property.priceUSD);
    if (!priceNum || priceNum <= 0) {
      toast.error("Precio inválido.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await createOnboardingProperty({
          title: property.title,
          category: property.category,
          operation: property.operation,
          location: property.location,
          priceUSD: priceNum,
          bedrooms: property.bedrooms ? Number(property.bedrooms) : undefined,
          bathrooms: property.bathrooms ? Number(property.bathrooms) : undefined,
          metersSquared: property.metersSquared
            ? Number(property.metersSquared)
            : undefined,
        });
        setCreatedPropertyId(res.id);
        toast.success("Propiedad creada ✓");
        next();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function finishOnboarding(skipped = false) {
    startTransition(async () => {
      try {
        await completeOnboarding({ skipped });
        if (skipped) {
          toast.message("Puedes completar el onboarding más tarde.");
        }
        router.push("/");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="ambient-glow pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="absolute inset-0 bg-dots pointer-events-none opacity-50" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-[860px] flex-col px-5 py-8 md:px-8 md:py-12">
        {/* Header — logo + skip */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              estaila<span className="text-primary">.</span>
            </span>
          </Link>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => finishOnboarding(true)}
              disabled={pending}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Saltar y explorar
            </button>
          )}
        </div>

        {/* Progress bar */}
        <ProgressTrack current={step} />

        {/* Step content */}
        <Card className="mt-8 flex-1 overflow-hidden border-border/70 bg-card/60 p-7 backdrop-blur md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduced ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <ProfileStep
                  firstName={firstName}
                  profile={profile}
                  setProfile={setProfile}
                />
              )}
              {step === 1 && (
                <PropertyStep
                  property={property}
                  setProperty={setProperty}
                  alreadyCreated={hasProperty && !createdPropertyId}
                />
              )}
              {step === 2 && <StudioStep propertyId={createdPropertyId} />}
              {step === 3 && (
                <DoneStep firstName={firstName} propertyId={createdPropertyId} />
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0 || pending}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Atrás
          </Button>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Paso {step + 1} de {STEPS.length}
          </div>
          {step === 0 && (
            <Button onClick={saveProfile} disabled={pending} size="lg">
              {pending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              Siguiente
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
          {step === 1 && (
            <Button
              onClick={createFirstProperty}
              disabled={pending}
              size="lg"
            >
              {pending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              Crear propiedad
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={next} size="lg">
              Continuar
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={() => finishOnboarding(false)}
              disabled={pending}
              size="lg"
            >
              {pending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              Ir al dashboard
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROGRESS TRACK
// ============================================================

function ProgressTrack({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                done && "border-emerald-500/40 bg-emerald-500/15 text-emerald-500",
                active && "border-primary bg-primary text-primary-foreground",
                !done && !active && "border-border bg-card text-muted-foreground"
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </div>
            <span
              className={cn(
                "hidden text-[11px] uppercase tracking-wider transition-colors sm:inline-block",
                done || active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  done ? "bg-emerald-500/40" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ============================================================
// STEP 1 — PROFILE
// ============================================================

function ProfileStep({
  firstName,
  profile,
  setProfile,
}: {
  firstName: string;
  profile: ProfileState;
  setProfile: (fn: (p: ProfileState) => ProfileState) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
        Paso 1 de 4
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        Hola {firstName || "agente"} 👋
      </h1>
      <p className="mt-2 max-w-[52ch] text-sm text-muted-foreground md:text-base">
        Cuéntanos un poco sobre ti. Aparece en tu portal público, tarjeta
        digital y plantillas legales. Puedes saltarlo y completarlo después.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Tu cargo o título">
          <Input
            placeholder="Ej. Agente inmobiliario · Mi Ciudad"
            value={profile.agentRole}
            onChange={(e) =>
              setProfile((p) => ({ ...p, agentRole: e.target.value }))
            }
            maxLength={120}
          />
        </Field>
        <Field label="Ciudad / Zona">
          <Input
            placeholder="Ej. Miami, FL"
            value={profile.agentLocation}
            onChange={(e) =>
              setProfile((p) => ({ ...p, agentLocation: e.target.value }))
            }
            maxLength={120}
          />
        </Field>
        <Field label="WhatsApp / Teléfono">
          <Input
            placeholder="+1 555 0100"
            value={profile.agentPhone}
            onChange={(e) =>
              setProfile((p) => ({ ...p, agentPhone: e.target.value }))
            }
            maxLength={40}
          />
        </Field>
        <Field label="URL de tu foto (opcional)">
          <Input
            placeholder="https://..."
            value={profile.image}
            onChange={(e) =>
              setProfile((p) => ({ ...p, image: e.target.value }))
            }
          />
        </Field>
      </div>
    </div>
  );
}

// ============================================================
// STEP 2 — FIRST PROPERTY
// ============================================================

function PropertyStep({
  property,
  setProperty,
  alreadyCreated,
}: {
  property: PropertyState;
  setProperty: (fn: (p: PropertyState) => PropertyState) => void;
  alreadyCreated: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
        Paso 2 de 4
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        Crea tu primera propiedad
      </h2>
      <p className="mt-2 max-w-[52ch] text-sm text-muted-foreground md:text-base">
        Sólo los campos básicos. Después podrás añadir fotos, plantillas
        legales y publicar al portal público.
      </p>

      {alreadyCreated && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          Ya tienes propiedades creadas. Puedes crear una nueva aquí o saltar al
          siguiente paso.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Título *" className="md:col-span-2">
          <Input
            placeholder="Ej. Apartamento moderno con vista al mar"
            value={property.title}
            onChange={(e) =>
              setProperty((p) => ({ ...p, title: e.target.value }))
            }
            maxLength={160}
          />
        </Field>

        <Field label="Tipo *">
          <Select
            value={property.category}
            onValueChange={(v) =>
              setProperty((p) => ({
                ...p,
                category: v as PropertyState["category"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Operación *">
          <Select
            value={property.operation}
            onValueChange={(v) =>
              setProperty((p) => ({
                ...p,
                operation: v as PropertyState["operation"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OPERATION_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Ubicación *" className="md:col-span-2">
          <Input
            placeholder="Ej. Sector, Ciudad"
            value={property.location}
            onChange={(e) =>
              setProperty((p) => ({ ...p, location: e.target.value }))
            }
            maxLength={160}
          />
        </Field>

        <Field label="Precio USD *">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="125000"
            value={property.priceUSD}
            onChange={(e) =>
              setProperty((p) => ({ ...p, priceUSD: e.target.value }))
            }
          />
        </Field>

        <Field label="Metros²">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="98"
            value={property.metersSquared}
            onChange={(e) =>
              setProperty((p) => ({ ...p, metersSquared: e.target.value }))
            }
          />
        </Field>

        <Field label="Habitaciones">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="3"
            value={property.bedrooms}
            onChange={(e) =>
              setProperty((p) => ({ ...p, bedrooms: e.target.value }))
            }
          />
        </Field>

        <Field label="Baños">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="2"
            value={property.bathrooms}
            onChange={(e) =>
              setProperty((p) => ({ ...p, bathrooms: e.target.value }))
            }
          />
        </Field>
      </div>
    </div>
  );
}

// ============================================================
// STEP 3 — STUDIO PREVIEW
// ============================================================

function StudioStep({ propertyId }: { propertyId: string | null }) {
  const tools = [
    {
      name: "Virtual Staging",
      desc: "Amueblar espacios vacíos con IA fotorrealista.",
      cr: "1 crédito",
    },
    {
      name: "Declutter",
      desc: "Eliminar muebles viejos y desorden.",
      cr: "1 crédito",
    },
    {
      name: "Twilight",
      desc: "Convertir foto diurna en atardecer cinematográfico.",
      cr: "1 crédito",
    },
    {
      name: "Sky / Lawn / Pool",
      desc: "Reemplazar cielo gris, reverdecer jardín, limpiar piscina.",
      cr: "1 crédito",
    },
  ];

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
        Paso 3 de 4
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        Conoce el Studio IA
      </h2>
      <p className="mt-2 max-w-[52ch] text-sm text-muted-foreground md:text-base">
        Sube una foto y deja que la IA haga el trabajo. Tienes{" "}
        <strong className="text-foreground">5 créditos gratis</strong> para
        empezar. Cada generación toma menos de 60 segundos.
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <li
            key={t.name}
            className="flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Wand2 className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                {t.cr}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={propertyId ? `/studio?propertyId=${propertyId}` : "/studio"}>
            <Sparkles className="mr-1.5 h-4 w-4 text-primary" />
            Probar Studio ahora
            <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Opcional · puedes hacerlo más tarde
        </span>
      </div>
    </div>
  );
}

// ============================================================
// STEP 4 — DONE
// ============================================================

function DoneStep({
  firstName,
  propertyId,
}: {
  firstName: string;
  propertyId: string | null;
}) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500"
      >
        <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
      </motion.div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
        Setup completo
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        Bienvenido a estaila, {firstName || "agente"}
      </h2>
      <p className="mx-auto mt-3 max-w-[52ch] text-sm text-muted-foreground md:text-base">
        Tu cuenta está lista. Tienes 5 créditos IA, tu primera propiedad creada
        y un portal público listo para personalizar.
      </p>

      <ul className="mx-auto mt-7 max-w-md space-y-2 text-left">
        {[
          { ok: true, text: "Perfil configurado" },
          { ok: !!propertyId, text: "Primera propiedad creada" },
          { ok: true, text: "5 créditos IA listos" },
          { ok: true, text: "Portal público activo" },
        ].map((b) => (
          <li
            key={b.text}
            className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3.5 py-2.5 text-sm"
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                b.ok
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {b.ok ? (
                <Check className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </div>
            <span className={b.ok ? "" : "text-muted-foreground"}>{b.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {propertyId && (
          <Button variant="outline" asChild>
            <Link href={`/propiedades/${propertyId}`}>
              Ver mi propiedad
              <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/sitio">
            Configurar mi portal
            <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ATOMS
// ============================================================

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
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
