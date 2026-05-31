"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPipelineCard } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

export function NewLeadDialog({
  open,
  onOpenChange,
  defaultStage,
  contacts,
  properties,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage: string;
  contacts: { id: string; name: string }[];
  properties: { id: string; title: string }[];
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const [submitting, setSubmitting] = useState(false);
  const [contactId, setContactId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [stage, setStage] = useState(defaultStage);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");

  async function onSubmit() {
    if (!contactId) {
      toast.error(t.pipeline.errSelectContact);
      return;
    }
    setSubmitting(true);
    try {
      await createPipelineCard({
        contactId,
        propertyId: propertyId || undefined,
        stage,
        value: value ? Number(value) : undefined,
        notes: notes || undefined,
        nextAction: nextAction || undefined,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
      });
      toast.success(t.pipeline.toastLeadCreated);
      onOpenChange(false);
      router.refresh();
      // Reset
      setContactId("");
      setPropertyId("");
      setValue("");
      setNotes("");
      setNextAction("");
      setNextActionDate("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.pipeline.newLead}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label={t.pipeline.fieldContact}>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder={t.pipeline.placeholderSelectContact} />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t.pipeline.fieldProperty}>
            <Select
              value={propertyId || "__none"}
              onValueChange={(v) => setPropertyId(v === "__none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.pipeline.noProperty} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">{t.pipeline.noProperty}</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.pipeline.fieldStage}>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {labelFor(PIPELINE_STAGES, s.value, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.pipeline.fieldValue}>
              <Input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="font-mono tabular-nums"
              />
            </Field>
          </div>

          <Field label={t.pipeline.fieldNextAction}>
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder={t.pipeline.placeholderNextAction}
            />
          </Field>

          <Field label={t.pipeline.fieldNextActionDate}>
            <Input
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
            />
          </Field>

          <Field label={t.pipeline.fieldNotes}>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.pipeline.placeholderNotes}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t.pipeline.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.pipeline.createLead}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
