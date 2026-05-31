"use client";

import { ExternalLink, FileText, Loader2, Share2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ensurePropertySlug } from "@/lib/actions/property-share";
import { SharePropertyDialog } from "./share-property-dialog";
import { BrochureDialog } from "./brochure-dialog";
import { useT } from "@/lib/i18n/provider";

type Property = {
  id: string;
  title: string;
  location: string | null;
  priceUSD: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  metersSquared: number | null;
  category: string;
  operation: string;
};

export function PropertyShareButton({
  property,
  agentName,
}: {
  property: Property;
  agentName: string;
}) {
  const { t } = useT();
  const [shareOpen, setShareOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function openPublic() {
    startTransition(async () => {
      try {
        const slug = await ensurePropertySlug(property.id);
        window.open(`/propiedad/${slug}`, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={openPublic} disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="mr-2 h-4 w-4" />
        )}
        {t.propDialogs.viewPublicLanding}
      </Button>
      <Button variant="outline" onClick={() => setPdfOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        {t.propDialogs.brochurePdf}
      </Button>
      <Button variant="ink" onClick={() => setShareOpen(true)}>
        <Share2 className="mr-2 h-4 w-4" />
        {t.propDialogs.share}
      </Button>
      <SharePropertyDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        property={property}
        agentName={agentName}
      />
      <BrochureDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        propertyId={property.id}
        propertyTitle={property.title}
      />
    </>
  );
}
