"use client";

import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Heart,
  KeyRound,
  LayoutGrid,
  ListTodo,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  Star,
  Tag as TagIcon,
  Trash2,
  Users,
  Video,
  Bed,
  Bath,
  Car,
  Maximize2,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials, formatCurrency, formatDate } from "@/lib/utils";
import { CONTACT_TYPES, labelFor, PIPELINE_STAGES } from "@/lib/constants";
import {
  deleteContact,
  toggleContactFavorite,
} from "@/lib/actions/contact";
import { ContactDialog } from "./contact-dialog";
import { SendEmailDialog } from "@/components/email/send-email-dialog";

type Contact = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  rnc: string | null;
  reference: string | null;
  notes: string | null;
  favorite: boolean;
  ratings: string;
  profession: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type PropertyCard = {
  id: string;
  title: string;
  featuredPhoto: string | null;
  priceUSD: number | null;
  category: string;
  operation: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  metersSquared: number | null;
  location: string | null;
  address: string | null;
  stage?: string;
};

type Agent = { name: string; image: string | null };

const TYPE_HERO_GRADIENT: Record<string, string> = {
  PROPIETARIO: "from-emerald-500/30 via-emerald-500/10 to-transparent",
  CLIENTE: "from-blue-500/30 via-blue-500/10 to-transparent",
  INQUILINO: "from-amber-500/30 via-amber-500/10 to-transparent",
  ABOGADO: "from-violet-500/30 via-violet-500/10 to-transparent",
  COLEGA_INMOBILIARIO: "from-cyan-500/30 via-cyan-500/10 to-transparent",
};

type Activity = {
  id: string;
  type: string;
  title: string;
  content: string | null;
  durationMin: number | null;
  propertyId: string | null;
  appointmentId: string | null;
  metadata: string | null;
  createdAt: string;
};

type AppointmentItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  status: string;
  location: string | null;
  notes: string | null;
  propertyTitle: string | null;
};

type DetailTag = { id: string; name: string; color: string; icon: string | null };
type CustomField = { key: string; value: string };
type DocumentRef = { id: string; type: string; title: string; createdAt: Date };

export function ContactDetailClient({
  contact,
  ownedProperties,
  pipelineProperties,
  agent,
  activities = [],
  appointments = [],
  customFields = [],
  tags = [],
  documents = [],
}: {
  contact: Contact;
  ownedProperties: PropertyCard[];
  pipelineProperties: PropertyCard[];
  agent: Agent;
  activities?: Activity[];
  appointments?: AppointmentItem[];
  customFields?: CustomField[];
  tags?: DetailTag[];
  documents?: DocumentRef[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "citas" | "data" | "docs"
  >("overview");

  const isOwner = contact.type === "PROPIETARIO";
  const isClient = contact.type === "CLIENTE" || contact.type === "INQUILINO";

  const heroGradient = TYPE_HERO_GRADIENT[contact.type] ?? TYPE_HERO_GRADIENT.CLIENTE;

  const ratings: string[] = (() => {
    try {
      return JSON.parse(contact.ratings || "[]");
    } catch {
      return [];
    }
  })();
  const professions: string[] = (() => {
    try {
      return JSON.parse(contact.profession || "[]");
    } catch {
      return [];
    }
  })();

  function handleToggleFav() {
    startTransition(async () => {
      try {
        await toggleContactFavorite(contact.id);
        toast.success(contact.favorite ? "Quitado de favoritos" : "Agregado a favoritos");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar a ${contact.name}? Esta acción no se puede deshacer.`))
      return;
    startTransition(async () => {
      try {
        await deleteContact(contact.id);
        toast.success("Contacto eliminado");
        router.push("/contactos");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  const wa = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <>
      {/* HERO CARD */}
      <Card
        className={cn(
          "relative overflow-hidden p-0",
          isOwner && "ring-1 ring-emerald-500/20 shadow-xl shadow-emerald-500/5"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60",
            heroGradient
          )}
        />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-20" />

        {/* Top-right action icons */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", contact.favorite && "text-amber-400")}
            onClick={handleToggleFav}
          >
            <Star className={cn("h-4 w-4", contact.favorite && "fill-amber-400")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative px-6 py-7 sm:px-8">
          {/* Featured pill for owners */}
          {isOwner && (
            <div className="absolute -top-px left-8">
              <span className="inline-flex items-center gap-1 rounded-b-md bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-md shadow-emerald-500/30">
                <KeyRound className="h-3 w-3" />
                Propietario
              </span>
            </div>
          )}

          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Contacto · {labelFor(CONTACT_TYPES, contact.type)}
          </p>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                <AvatarFallback
                  className={cn(
                    "text-2xl font-bold",
                    isOwner
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                      : "bg-gradient-to-br from-primary to-primary/70 text-white"
                  )}
                >
                  {initials(contact.name)}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                {contact.name}
                {contact.favorite && (
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                )}
              </h1>
              {(ratings.length > 0 || professions.length > 0) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {professions.map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px]">
                      <Briefcase className="mr-1 h-2.5 w-2.5" />
                      {p.toLowerCase()}
                    </Badge>
                  ))}
                  {ratings.map((r) => (
                    <Badge
                      key={r}
                      variant="outline"
                      className="bg-amber-500/10 text-amber-500 border-amber-500/40 text-[10px]"
                    >
                      ⭐ {r.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info chips row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <InfoChip
              icon={Briefcase}
              label="Tipo"
              value={labelFor(CONTACT_TYPES, contact.type)}
            />
            {contact.location && (
              <InfoChip icon={MapPin} label="Ubicación" value={contact.location} />
            )}
            {contact.phone && (
              <InfoChip icon={Phone} label="Teléfono" value={contact.phone} mono />
            )}
            {contact.email && (
              <InfoChip
                icon={Mail}
                label="Email"
                value={contact.email}
                link={`mailto:${contact.email}`}
              />
            )}
            {contact.rnc && (
              <InfoChip icon={Briefcase} label="RNC / Cédula" value={contact.rnc} mono />
            )}
          </div>

          {/* Action bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button className="bg-foreground text-background hover:bg-foreground/85">
                <Video className="mr-1.5 h-4 w-4" />
                Crear cita
              </Button>
              {wa && (
                <Button variant="outline" asChild>
                  <a href={wa} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-500" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden flex-col items-end text-right sm:flex">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Asignado a
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Avatar className="h-6 w-6 ring-1 ring-border">
                    <AvatarImage src={agent.image ?? undefined} />
                    <AvatarFallback className="bg-muted text-[10px] font-semibold">
                      {initials(agent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{agent.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {contact.phone && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-card" asChild>
                    <a href={`tel:${contact.phone}`} title="Llamar">
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {contact.email && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-card"
                    onClick={() => setEmailOpen(true)}
                    title="Enviar email"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-card">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      Agendar cita
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar al pipeline
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Editar contacto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <DetailTabs
        current={activeTab}
        onChange={setActiveTab}
        counts={{
          props: isOwner ? ownedProperties.length : pipelineProperties.length,
          timeline: activities.length,
          citas: appointments.length,
          docs: documents.length,
        }}
      />

      {/* === RESUMEN === */}
      {activeTab === "overview" && (
        <>
          {/* PROPERTY OBJECTS section */}
          <Card className="mt-4 p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  {isOwner ? (
                    <>
                      <Building2 className="h-5 w-5 text-emerald-500" />
                      Propiedades del propietario
                    </>
                  ) : isClient ? (
                    <>
                      <Heart className="h-5 w-5 text-blue-500" />
                      Propiedades de interés
                    </>
                  ) : (
                    <>
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      Propiedades relacionadas
                    </>
                  )}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isOwner
                    ? `${ownedProperties.length} ${ownedProperties.length === 1 ? "propiedad" : "propiedades"} bajo gestión`
                    : isClient
                      ? `${pipelineProperties.length} en pipeline`
                      : "Vinculadas a este contacto"}
                </p>
              </div>
              {isOwner && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/propiedades/nueva?ownerId=${contact.id}`}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Vincular propiedad
                  </Link>
                </Button>
              )}
            </div>

            <PropertyObjectsGrid
              properties={isOwner ? ownedProperties : pipelineProperties}
              fallbackLabel={
                isOwner
                  ? "Este propietario aún no tiene propiedades vinculadas."
                  : isClient
                    ? "Este cliente aún no tiene propiedades en pipeline."
                    : "Sin propiedades vinculadas."
              }
              showPipelineStage={!isOwner}
              contactId={contact.id}
            />
          </Card>
        </>
      )}

      {/* === TIMELINE === */}
      {activeTab === "timeline" && (
        <div className="mt-4">
          <TimelineFeed
            contactId={contact.id}
            activities={activities}
          />
        </div>
      )}

      {/* === CITAS === */}
      {activeTab === "citas" && (
        <div className="mt-4">
          <AppointmentsList appointments={appointments} contactId={contact.id} />
        </div>
      )}

      {/* === DATOS === */}
      {activeTab === "data" && (
        <div className="mt-4">
          <CustomFieldsPanel
            contactId={contact.id}
            fields={customFields}
            tags={tags}
          />
        </div>
      )}

      {/* === DOCS === */}
      {activeTab === "docs" && (
        <div className="mt-4">
          <DocumentsList documents={documents} contactId={contact.id} />
        </div>
      )}

      {contact.notes && (
        <Card className="mt-6 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Notas
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {contact.notes}
          </p>
        </Card>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Creado {formatDate(contact.createdAt)} · Actualizado{" "}
        {formatDate(contact.updatedAt)}
      </p>

      <SendEmailDialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        contactIds={[contact.id]}
        contactCount={1}
      />

      <ContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{
          id: contact.id,
          name: contact.name,
          type: contact.type,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          email: contact.email,
          location: contact.location,
          rnc: contact.rnc,
          reference: contact.reference,
          notes: contact.notes,
          favorite: contact.favorite,
        }}
      />
    </>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
  link,
  mono,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  link?: string;
  mono?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 p-2.5 backdrop-blur-md transition-colors hover:border-foreground/20 hover:bg-card">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "truncate text-xs font-medium",
            mono && "font-mono tabular-nums"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
  if (link) {
    return (
      <a href={link} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return content;
}

function PropertyObjectsGrid({
  properties,
  fallbackLabel,
  showPipelineStage,
  contactId,
}: {
  properties: PropertyCard[];
  fallbackLabel: string;
  showPipelineStage: boolean;
  contactId: string;
}) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 px-6 py-12 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">{fallbackLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p, i) => (
        <PropertyObjectCard
          key={p.id}
          p={p}
          index={i}
          showStage={showPipelineStage}
          contactId={contactId}
        />
      ))}
    </div>
  );
}

const STAGE_COLOR: Record<string, string> = {
  NUEVO: "bg-stone-500 text-white",
  CONTACTADO: "bg-blue-500 text-white",
  VISITA: "bg-amber-500 text-white",
  NEGOCIACION: "bg-violet-500 text-white",
  CERRADO: "bg-emerald-500 text-white",
  PERDIDO: "bg-rose-500 text-white",
};

const OP_PILL: Record<string, string> = {
  EN_VENTA: "bg-emerald-500 text-white",
  EN_ALQUILER: "bg-amber-500 text-white",
  VENDIDA: "bg-rose-500 text-white",
  ALQUILADA: "bg-stone-700 text-white",
  CONSIGNACION: "bg-violet-500 text-white",
};

const OP_LABEL: Record<string, string> = {
  EN_VENTA: "Active",
  EN_ALQUILER: "Active",
  VENDIDA: "Sold",
  ALQUILADA: "Rented",
  CONSIGNACION: "Active",
};

function PropertyObjectCard({
  p,
  index,
  showStage,
  contactId,
}: {
  p: PropertyCard;
  index: number;
  showStage: boolean;
  contactId: string;
}) {
  const stageMeta = p.stage
    ? PIPELINE_STAGES.find((s) => s.value === p.stage)
    : null;
  const stageColor = p.stage ? STAGE_COLOR[p.stage] : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 6) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card className="group overflow-hidden p-0 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
        <div className="relative aspect-[16/11] overflow-hidden bg-muted">
          {p.featuredPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.featuredPhoto}
              alt={p.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-card">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

          {/* Active/Sold pill */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-md",
                OP_PILL[p.operation]
              )}
            >
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white" />
              {OP_LABEL[p.operation] ?? "Active"}
            </span>
            {showStage && stageMeta && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-md",
                  stageColor
                )}
              >
                {stageMeta.label}
              </span>
            )}
          </div>

          {/* Top-right action icons */}
          <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:text-white"
              asChild
            >
              <Link href={`/propiedades/${p.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:text-white"
              asChild
            >
              <Link href={`/propiedades/${p.id}`}>
                <LinkIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:text-white"
              asChild
            >
              <Link href={`/propiedades/${p.id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Link
            href={`/propiedades/${p.id}`}
            className="block transition-colors hover:text-primary"
          >
            <h3 className="line-clamp-1 text-base font-bold leading-tight">
              {p.title}
            </h3>
          </Link>
          {(p.location || p.address) && (
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {p.address ?? p.location}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <p className="font-mono text-xl font-bold tabular-nums">
              {formatCurrency(p.priceUSD ?? 0)}
            </p>
            <FakeBuyerAvatars />
          </div>

          {/* Specs row */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {p.bedrooms != null && (
              <SpecPill icon={Bed} value={`${p.bedrooms} hab`} />
            )}
            {p.parking != null && (
              <SpecPill icon={Car} value={`${p.parking} parq`} />
            )}
            {p.bathrooms != null && (
              <SpecPill icon={Bath} value={`${p.bathrooms} bañ`} />
            )}
            {p.metersSquared != null && (
              <SpecPill icon={Maximize2} value={`${p.metersSquared}m²`} />
            )}
          </div>

          {/* Action footer */}
          <div className="mt-4 flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/propiedades/${p.id}`}>
                <ExternalLink className="mr-1.5 h-3 w-3" />
                Ver detalle
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 justify-between">
                  <span className="text-xs">
                    {p.stage
                      ? PIPELINE_STAGES.find((s) => s.value === p.stage)?.label
                      : OP_LABEL[p.operation] ?? "Activo"}
                  </span>
                  <Sparkles className="h-3 w-3 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/pipeline?contactId=${contactId}&propertyId=${p.id}`}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Mover en pipeline
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/propiedades/${p.id}`}>
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Ver detalle
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SpecPill({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-1 font-mono text-[10px] tabular-nums text-muted-foreground">
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

function FakeBuyerAvatars() {
  const colors = ["#3B82F6", "#10B981", "#F59E0B"];
  const fakeCount = Math.floor(Math.random() * 8) + 2;
  return (
    <div className="flex -space-x-1.5">
      {colors.slice(0, 3).map((c, i) => (
        <div
          key={i}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-card"
          style={{ backgroundColor: c }}
        >
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[8px] font-semibold ring-2 ring-card">
        +{fakeCount}
      </div>
    </div>
  );
}

// ============================================================
// DETAIL TABS
// ============================================================

function DetailTabs({
  current,
  onChange,
  counts,
}: {
  current: "overview" | "timeline" | "citas" | "data" | "docs";
  onChange: (v: "overview" | "timeline" | "citas" | "data" | "docs") => void;
  counts: { props: number; timeline: number; citas: number; docs: number };
}) {
  const tabs: {
    key: "overview" | "timeline" | "citas" | "data" | "docs";
    label: string;
    icon: LucideIcon;
    count?: number;
  }[] = [
    { key: "overview", label: "Resumen", icon: LayoutGrid, count: counts.props },
    { key: "timeline", label: "Timeline", icon: ListTodo, count: counts.timeline },
    { key: "citas", label: "Citas", icon: Calendar, count: counts.citas },
    { key: "data", label: "Datos", icon: TagIcon },
    { key: "docs", label: "Documentos", icon: FileText, count: counts.docs },
  ];
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="inline-flex min-w-full items-center gap-1 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = current === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={cn(
                "relative inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9.5px] font-mono tabular-nums",
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.count}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="detail-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-[2px] bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TIMELINE FEED
// ============================================================

const ACTIVITY_META: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  CALL: { label: "Llamada", icon: Phone, color: "text-blue-500" },
  WHATSAPP_SENT: { label: "WhatsApp enviado", icon: MessageCircle, color: "text-emerald-500" },
  WHATSAPP_RECEIVED: { label: "WhatsApp recibido", icon: MessageCircle, color: "text-emerald-500" },
  EMAIL: { label: "Email", icon: Mail, color: "text-violet-500" },
  NOTE: { label: "Nota", icon: Pencil, color: "text-muted-foreground" },
  VISIT: { label: "Visita", icon: MapPin, color: "text-amber-500" },
  PROPERTY_VIEWED: { label: "Propiedad vista", icon: Building2, color: "text-foreground" },
  STATUS_CHANGE: { label: "Cambio de estado", icon: CheckCircle2, color: "text-foreground" },
  TAG_ADDED: { label: "Tag añadido", icon: TagIcon, color: "text-foreground" },
};

function TimelineFeed({
  contactId,
  activities,
}: {
  contactId: string;
  activities: Activity[];
}) {
  const [, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleAddNote() {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      const { addNote } = await import("@/lib/actions/contact-polish");
      await addNote(contactId, note.trim());
      setNote("");
      toast.success("Nota agregada");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogCall() {
    setSubmitting(true);
    try {
      const { logCall } = await import("@/lib/actions/contact-polish");
      const min = callDuration ? parseInt(callDuration, 10) : undefined;
      await logCall({ contactId, durationMin: min });
      setCallDuration("");
      toast.success("Llamada registrada");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      {/* Feed */}
      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <ListTodo className="h-3.5 w-3.5" />
          Timeline · {activities.length}
        </h2>
        {activities.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sin actividad aún. Agrega una nota o registra una llamada.
          </p>
        ) : (
          <ol className="relative space-y-5 border-l border-border pl-5">
            {activities.map((a) => {
              const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.NOTE;
              const Icon = meta.icon;
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <span className="absolute -left-[26px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background">
                    <Icon className={cn("h-2.5 w-2.5", meta.color)} strokeWidth={2} />
                  </span>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                  {a.content && (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                      {a.content}
                    </p>
                  )}
                </motion.li>
              );
            })}
          </ol>
        )}
      </Card>

      {/* Side: quick actions */}
      <Card className="p-5 lg:sticky lg:top-24 lg:self-start">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Registrar interacción
        </h3>

        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nueva nota..."
            rows={3}
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <Button
            size="sm"
            className="w-full"
            onClick={handleAddNote}
            disabled={submitting || !note.trim()}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Agregar nota
          </Button>
        </div>

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={300}
              value={callDuration}
              onChange={(e) => setCallDuration(e.target.value)}
              placeholder="min"
              className="w-16 rounded-md border bg-background px-2 py-1.5 font-mono text-sm tabular-nums focus:border-primary focus:outline-none"
            />
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleLogCall}
              disabled={submitting}
            >
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              Registrar llamada
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// APPOINTMENTS LIST
// ============================================================

const APPT_STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "bg-blue-500/15 text-blue-500",
  EN_CURSO: "bg-amber-500/15 text-amber-500",
  COMPLETADO: "bg-emerald-500/15 text-emerald-500",
  CANCELADO: "bg-destructive/15 text-destructive",
};

function AppointmentsList({
  appointments,
  contactId,
}: {
  appointments: AppointmentItem[];
  contactId: string;
}) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Citas · {appointments.length}
        </h2>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/agenda?contactId=${contactId}&new=1`}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva cita
          </Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Sin citas registradas con este contacto.
        </p>
      ) : (
        <ul className="space-y-2">
          {appointments.map((a) => {
            const d = new Date(a.startAt);
            return (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card"
              >
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                  <span className="text-[9px] font-semibold uppercase">
                    {d.toLocaleDateString("es", { month: "short" }).replace(".", "")}
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums leading-none">
                    {d.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="h-3 w-3" />
                      {d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {a.propertyTitle && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3" />
                        {a.propertyTitle}
                      </span>
                    )}
                    {a.location && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {a.location}
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 text-[10px]",
                    APPT_STATUS_COLOR[a.status] ?? ""
                  )}
                >
                  {a.status.replace(/_/g, " ").toLowerCase()}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// CUSTOM FIELDS PANEL
// ============================================================

function CustomFieldsPanel({
  contactId,
  fields,
  tags,
}: {
  contactId: string;
  fields: CustomField[];
  tags: DetailTag[];
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSet() {
    if (!key.trim() || !value.trim()) return;
    setPending(true);
    try {
      const { setCustomField } = await import("@/lib/actions/contact-polish");
      await setCustomField(contactId, key.trim(), value.trim());
      setKey("");
      setValue("");
      toast.success("Campo guardado");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleRemove(k: string) {
    setPending(true);
    try {
      const { deleteCustomField } = await import("@/lib/actions/contact-polish");
      await deleteCustomField(contactId, k);
      toast.success("Campo eliminado");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <Card className="p-6">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <TagIcon className="h-3.5 w-3.5" />
          Campos personalizados
        </h2>

        {fields.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin campos personalizados. Agrega presupuesto, fecha de
            cumpleaños, lead source, etc.
          </p>
        ) : (
          <ul className="space-y-2">
            {fields.map((f) => (
              <li
                key={f.key}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/40 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {f.key}
                  </p>
                  <p className="truncate text-sm font-medium">{f.value}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(f.key)}
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid grid-cols-[1fr_1.5fr_auto] gap-2 border-t border-border pt-5">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Campo (ej. presupuesto)"
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Valor"
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <Button size="sm" onClick={handleSet} disabled={pending || !key || !value}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      <Card className="p-5 lg:sticky lg:top-24 lg:self-start">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tags asignados
        </h3>
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin tags. Asignar desde la lista de contactos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  color: t.color,
                  borderColor: `${t.color}40`,
                  backgroundColor: `${t.color}10`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                {t.name}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// DOCUMENTS LIST
// ============================================================

function DocumentsList({
  documents,
}: {
  documents: DocumentRef[];
  contactId: string;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        Documentos
      </h2>
      {documents.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Sin documentos generados con este contacto aún.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Los contratos firmados aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-md border border-border bg-card/40 px-3 py-2.5"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{d.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {d.type} · {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "ahora";
  if (diff < hour) return `${Math.floor(diff / min)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}
