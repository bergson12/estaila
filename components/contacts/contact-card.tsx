"use client";

import { Phone, MessageCircle, Mail, MapPin, Star, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import { labelFor, CONTACT_TYPES } from "@/lib/constants";
import {
  deleteContact,
  toggleContactFavorite,
} from "@/lib/actions/contact";

type ContactCardData = {
  id: string;
  name: string;
  type: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  location?: string | null;
  favorite: boolean;
  ratings: string;
  profession: string;
};

const TYPE_COLOR: Record<string, string> = {
  PROPIETARIO: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  CLIENTE: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  INQUILINO: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  ABOGADO: "bg-violet-500/15 text-violet-400 ring-violet-500/30",
  COLEGA_INMOBILIARIO: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30",
};

export function ContactCard({
  contact,
  onEdit,
  index = 0,
}: {
  contact: ContactCardData;
  onEdit: (id: string) => void;
  index?: number;
}) {
  const [pending, startTransition] = useTransition();

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
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 10) * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
    <Card className="group flex items-center gap-4 p-4 transition-all hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20">
      <Avatar className="h-11 w-11 ring-1 ring-border">
        <AvatarFallback className="bg-muted text-xs font-semibold">
          {initials(contact.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{contact.name}</h3>
          {contact.favorite && (
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
              TYPE_COLOR[contact.type] ?? "bg-muted text-muted-foreground ring-border"
            )}
          >
            {labelFor(CONTACT_TYPES, contact.type)}
          </span>
          {ratings.slice(0, 2).map((r) => (
            <Badge
              key={r}
              variant="outline"
              className="bg-card text-[9px] uppercase tracking-wider"
            >
              {r.replace(/_/g, " ").toLowerCase()}
            </Badge>
          ))}
        </div>
      </div>

      <div className="hidden flex-col items-end gap-0.5 text-xs text-muted-foreground sm:flex">
        {contact.phone && (
          <span className="font-mono tabular-nums">{contact.phone}</span>
        )}
        {contact.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {contact.location}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {contact.whatsapp && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-500/70 hover:bg-emerald-500/10 hover:text-emerald-500"
            asChild
          >
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
        )}
        {contact.phone && (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={`tel:${contact.phone}`} title="Llamar">
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        )}
        {contact.email && (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={`mailto:${contact.email}`} title="Email">
              <Mail className="h-4 w-4" />
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 hover:bg-amber-500/10",
            contact.favorite && "text-amber-400"
          )}
          onClick={handleToggleFav}
          disabled={pending}
          title="Favorito"
        >
          <Star
            className={cn("h-4 w-4", contact.favorite && "fill-amber-400")}
          />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(contact.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
    </motion.div>
  );
}
