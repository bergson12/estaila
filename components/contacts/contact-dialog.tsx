"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  AtSign,
  Briefcase,
  FileText,
  Handshake,
  HardHat,
  KeyRound,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plug,
  Scale,
  Sparkles,
  Star,
  User,
  UserCheck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContactSchema, type ContactInput } from "@/lib/validations";
import { CONTACT_TYPES, labelFor } from "@/lib/constants";
import { createContact, updateContact } from "@/lib/actions/contact";
import { cn, initials } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

export type ContactDialogValue = {
  id?: string;
  name: string;
  type: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  location?: string | null;
  rnc?: string | null;
  reference?: string | null;
  notes?: string | null;
  favorite: boolean;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  PROPIETARIO: KeyRound,
  CLIENTE: UserCheck,
  INQUILINO: Users,
  ABOGADO: Scale,
  COLEGA_INMOBILIARIO: Handshake,
  PLOMERO: Wrench,
  ELECTRICISTA: Zap,
  CONTRATISTA: HardHat,
  EMPRESA: Briefcase,
  UTILITY: Plug,
};

const TYPE_GRADIENT: Record<string, string> = {
  PROPIETARIO: "from-emerald-500 to-emerald-600",
  CLIENTE: "from-blue-500 to-blue-600",
  INQUILINO: "from-amber-500 to-amber-600",
  ABOGADO: "from-violet-500 to-violet-600",
  COLEGA_INMOBILIARIO: "from-cyan-500 to-cyan-600",
  PLOMERO: "from-stone-500 to-stone-600",
  ELECTRICISTA: "from-amber-400 to-orange-500",
  CONTRATISTA: "from-orange-500 to-orange-600",
  EMPRESA: "from-indigo-500 to-indigo-600",
  UTILITY: "from-slate-500 to-slate-600",
};

export function ContactDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ContactDialogValue;
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const isEdit = !!initial?.id;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: "",
      type: "CLIENTE",
      phone: "",
      whatsapp: "",
      email: "",
      location: "",
      rnc: "",
      reference: "",
      notes: "",
      favorite: false,
    },
  });

  useEffect(() => {
    if (initial) {
      form.reset({
        name: initial.name,
        type: initial.type,
        phone: initial.phone ?? "",
        whatsapp: initial.whatsapp ?? "",
        email: initial.email ?? "",
        location: initial.location ?? "",
        rnc: initial.rnc ?? "",
        reference: initial.reference ?? "",
        notes: initial.notes ?? "",
        favorite: initial.favorite,
      });
    } else if (open) {
      form.reset({
        name: "",
        type: "CLIENTE",
        phone: "",
        whatsapp: "",
        email: "",
        location: "",
        rnc: "",
        reference: "",
        notes: "",
        favorite: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, open]);

  async function onSubmit(values: ContactInput) {
    setSubmitting(true);
    try {
      if (isEdit && initial?.id) {
        await updateContact(initial.id, values);
        toast.success(t.contactos.toastUpdated);
      } else {
        await createContact(values);
        toast.success(t.contactos.toastCreated);
      }
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const errors = form.formState.errors;
  const watchedName = form.watch("name");
  const watchedType = form.watch("type");
  const watchedFav = form.watch("favorite");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="overflow-hidden p-0 sm:max-w-[640px]"
      >
        {/* === HERO === */}
        <div className="relative overflow-hidden border-b border-border bg-card/40">
          {/* Decorative gradient based on type */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.07] transition-opacity duration-500",
              TYPE_GRADIENT[watchedType] ?? "from-primary to-primary"
            )}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-dots opacity-30"
            aria-hidden
          />

          <DialogHeader className="relative px-6 pb-5 pt-6">
            <div className="flex items-start gap-4">
              {/* Avatar preview */}
              <motion.div
                key={watchedType}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="relative"
              >
                <Avatar
                  className={cn(
                    "h-16 w-16 ring-2 ring-background shadow-lg bg-gradient-to-br text-white",
                    TYPE_GRADIENT[watchedType] ?? "from-primary to-primary/70"
                  )}
                >
                  <AvatarFallback className="bg-transparent text-lg font-semibold text-white">
                    {watchedName ? initials(watchedName) : <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                {watchedFav && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white shadow-md ring-2 ring-background"
                  >
                    <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                  </motion.div>
                )}
              </motion.div>

              <div className="min-w-0 flex-1 pt-1">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {isEdit ? t.contactos.dialogEditTitle : t.contactos.dialogNewTitle}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  {watchedName ? (
                    <span className="font-medium text-foreground">
                      {watchedName}
                    </span>
                  ) : (
                    t.contactos.dialogFillData
                  )}
                  {watchedType && (
                    <>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        {(() => {
                          const Icon = TYPE_ICONS[watchedType];
                          return Icon ? <Icon className="h-3 w-3" strokeWidth={1.75} /> : null;
                        })()}
                        {labelFor(CONTACT_TYPES, watchedType, locale)}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* === FORM === */}
        <form
          id="contact-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* Identity section */}
          <Section title={t.contactos.secIdentity} icon={User}>
            <Field label={t.contactos.fieldFullName} required error={errors.name?.message}>
              <IconInput icon={User} {...form.register("name")} placeholder={t.contactos.fullNamePlaceholder} />
            </Field>

            <div>
              <Label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t.contactos.fieldContactType} <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                    {CONTACT_TYPES.map((c) => {
                      const Icon = TYPE_ICONS[c.value];
                      const active = field.value === c.value;
                      return (
                        <motion.button
                          key={c.value}
                          type="button"
                          onClick={() => field.onChange(c.value)}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "relative flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-center transition-all",
                            active
                              ? "border-transparent text-white shadow-md"
                              : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                          )}
                          style={
                            active
                              ? {
                                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                                }
                              : undefined
                          }
                        >
                          {active && (
                            <motion.div
                              layoutId="type-active-bg"
                              className={cn(
                                "absolute inset-0 rounded-lg bg-gradient-to-br",
                                TYPE_GRADIENT[c.value]
                              )}
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          {Icon && (
                            <Icon
                              className={cn("relative z-10 h-4 w-4")}
                              strokeWidth={1.75}
                            />
                          )}
                          <span className="relative z-10 truncate text-[10px] font-medium leading-tight">
                            {labelFor(CONTACT_TYPES, c.value, locale)}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.type && (
                <p className="mt-1.5 text-[11px] text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>
          </Section>

          {/* Contact section */}
          <Section title={t.contactos.secContact} icon={Phone}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.contactos.fieldPhone}>
                <IconInput
                  icon={Phone}
                  {...form.register("phone")}
                  placeholder="+1 809-000-0000"
                  className="font-mono tabular-nums"
                />
              </Field>
              <Field label={t.contactos.fieldWhatsapp}>
                <IconInput
                  icon={MessageCircle}
                  iconClass="text-emerald-500"
                  {...form.register("whatsapp")}
                  placeholder="+1 809-000-0000"
                  className="font-mono tabular-nums"
                />
              </Field>
            </div>
            <Field label={t.contactos.fieldEmail} error={errors.email?.message}>
              <IconInput
                icon={AtSign}
                type="email"
                {...form.register("email")}
                placeholder="contacto@ejemplo.com"
              />
            </Field>
          </Section>

          {/* Location + identification */}
          <Section title={t.contactos.secLocationId} icon={MapPin}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.contactos.fieldLocation}>
                <IconInput
                  icon={MapPin}
                  {...form.register("location")}
                  placeholder={t.contactos.locationPlaceholder}
                />
              </Field>
              <Field label={t.contactos.fieldTaxId}>
                <IconInput
                  icon={FileText}
                  {...form.register("rnc")}
                  placeholder="000-0000000-0"
                  className="font-mono tabular-nums"
                />
              </Field>
            </div>
            <Field label={t.contactos.fieldReferredBy}>
              <IconInput
                icon={Sparkles}
                {...form.register("reference")}
                placeholder={t.contactos.referredByPlaceholder}
              />
            </Field>
          </Section>

          {/* Notes */}
          <Section title={t.contactos.secInternalNotes} icon={FileText}>
            <Textarea
              {...form.register("notes")}
              rows={3}
              placeholder={t.contactos.notesPlaceholder}
              className="resize-none"
            />
          </Section>

          {/* Favorite toggle (visual) */}
          <Controller
            control={form.control}
            name="favorite"
            render={({ field }) => (
              <motion.button
                type="button"
                onClick={() => field.onChange(!field.value)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                  field.value
                    ? "border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] to-transparent"
                    : "border-border bg-card/40 hover:border-foreground/15"
                )}
              >
                <motion.div
                  animate={
                    field.value
                      ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }
                      : {}
                  }
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    field.value
                      ? "bg-amber-400 text-white shadow-md"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 transition-all",
                      field.value && "fill-current"
                    )}
                    strokeWidth={field.value ? 0 : 1.75}
                  />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {field.value ? t.contactos.favOnTitle : t.contactos.favOffTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {field.value
                      ? t.contactos.favOnHint
                      : t.contactos.favOffHint}
                  </p>
                </div>
                <div
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    field.value ? "bg-amber-400" : "bg-muted"
                  )}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm",
                      field.value ? "right-0.5" : "left-0.5"
                    )}
                  />
                </div>
              </motion.button>
            )}
          />
        </form>

        {/* === FOOTER === */}
        <DialogFooter className="border-t border-border bg-card/30 px-6 py-4 sm:justify-between">
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            {isEdit
              ? t.contactos.footerEditHint
              : t.contactos.footerNewHint}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t.contactos.cancel}
            </Button>
            <Button
              type="submit"
              form="contact-form"
              disabled={submitting}
              className="min-w-[120px]"
            >
              <AnimatePresence mode="wait">
                {submitting ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.contactos.saving}
                  </motion.span>
                ) : (
                  <motion.span
                    key="ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {isEdit ? t.contactos.saveChanges : t.contactos.createContact}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// SECTION wrapper
// ============================================================

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon
          className="h-3.5 w-3.5 text-muted-foreground"
          strokeWidth={1.75}
        />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h3>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

// ============================================================
// FIELD wrapper
// ============================================================

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ============================================================
// IconInput — input con ícono a la izquierda
// ============================================================

const IconInput = ({
  icon: Icon,
  iconClass,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  icon: LucideIcon;
  iconClass?: string;
}) => {
  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors",
          iconClass
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <Input
        {...props}
        className={cn(
          "pl-9 focus:border-primary focus:ring-2 focus:ring-primary/20",
          className
        )}
      />
    </div>
  );
};
IconInput.displayName = "IconInput";
