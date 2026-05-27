"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createTicket, type TicketCategory } from "@/lib/actions/support";

import {
  Bug,
  CreditCard,
  HelpCircle,
  Lightbulb,
  Mail,
  type LucideIcon,
} from "lucide-react";

const CATEGORIES: { value: TicketCategory; label: string; icon: LucideIcon }[] = [
  { value: "BUG", label: "Reportar error", icon: Bug },
  { value: "QUESTION", label: "Pregunta / ayuda", icon: HelpCircle },
  { value: "BILLING", label: "Cobros / suscripción", icon: CreditCard },
  { value: "FEATURE", label: "Sugerir mejora", icon: Lightbulb },
  { value: "OTHER", label: "Otro", icon: Mail },
];

export function NewTicketDialog({
  children,
  defaultCategory,
  defaultSubject,
}: {
  children: React.ReactNode;
  defaultCategory?: TicketCategory;
  defaultSubject?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>(
    defaultCategory ?? "QUESTION"
  );
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Completa asunto y mensaje");
      return;
    }
    setSending(true);
    try {
      const res = await createTicket({ subject, category, message });
      if (!res.ok) {
        toast.error(res.error, { duration: 10000 });
        return;
      }
      toast.success("Ticket abierto. Te respondemos en máx 24h.");
      setOpen(false);
      setSubject("");
      setMessage("");
      router.push(`/soporte/${res.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo ticket de soporte</DialogTitle>
          <DialogDescription>
            Cuéntanos qué pasa. Respuesta en máx 24h hábiles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Categoría
            </Label>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {CATEGORIES.map((c) => {
                const CatIcon = c.icon;
                const active = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                    )}
                  >
                    <CatIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground/80"
                      )}
                      strokeWidth={1.75}
                    />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Asunto
            </Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Ej: "Error al subir fotos en /studio/staging"'
              maxLength={200}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Describe el problema
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Describe paso a paso qué pasó, qué esperabas, y agrega cualquier mensaje de error que viste..."
              className="resize-none"
              maxLength={8000}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {message.length} / 8000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            Enviar ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
