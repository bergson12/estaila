"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/provider";
import { createOrganization } from "@/lib/actions/organization";

export function CreateOrgForm() {
  const router = useRouter();
  const { t } = useT();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const auto =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "mi-empresa";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createOrganization({ name, slug: slug || auto });
      toast.success(t.empresa.toastOrgCreated);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label className="text-xs">{t.empresa.commercialName}</Label>
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.empresa.commercialNamePlaceholder}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">{t.empresa.slugUrl}</Label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">/p/</span>
          <Input
            value={slug || auto}
            onChange={(e) => setSlug(e.target.value)}
            className="font-mono"
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t.empresa.slugHint}
        </p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">
          {t.empresa.startWithTeamPlan}
        </p>
        <p className="mt-1">
          {t.empresa.startWithTeamPlanHint}
        </p>
      </div>
      <Button type="submit" disabled={submitting || !name.trim()} className="w-full">
        {t.empresa.createOrgBtn}
        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
