"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import {
  commitImport,
  previewCSV,
  type CommitResult,
  type ImportPreview,
  type ImportType,
} from "@/lib/actions/import";

type Step = "type" | "upload" | "map" | "done";

export function ImportWizard({ initialType }: { initialType?: ImportType } = {}) {
  const router = useRouter();
  const { t } = useT();
  const [step, setStep] = useState<Step>(initialType ? "upload" : "type");
  const [type, setType] = useState<ImportType | null>(initialType ?? null);
  const [csvText, setCsvText] = useState("");
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CommitResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    if (!type) return;
    setFilename(file.name);
    const text = await file.text();
    setCsvText(text);
    setPending(true);
    try {
      const p = await previewCSV({ type, csvText: text });
      setPreview(p);
      setMapping(p.suggestedMapping);
      setStep("map");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function commit() {
    if (!type || !preview) return;
    setPending(true);
    try {
      const r = await commitImport({ type, csvText, mapping });
      setResult(r);
      setStep("done");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        <StepDot active={step === "type"} done={step !== "type"} n={1} label={t.importar.stepType} />
        <StepLine />
        <StepDot
          active={step === "upload"}
          done={step === "map" || step === "done"}
          n={2}
          label={t.importar.stepUpload}
        />
        <StepLine />
        <StepDot
          active={step === "map"}
          done={step === "done"}
          n={3}
          label={t.importar.stepMap}
        />
        <StepLine />
        <StepDot active={step === "done"} done={false} n={4} label={t.importar.stepResult} />
      </div>

      {step === "type" && (
        <Card className="p-7">
          <h2 className="text-lg font-semibold">{t.importar.typeHeading}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.importar.typeSubtitle}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TypeOption
              icon={Users}
              title={t.importar.contactsTitle}
              desc={t.importar.contactsDesc}
              selected={type === "CONTACTS"}
              onClick={() => {
                setType("CONTACTS");
                setStep("upload");
              }}
            />
            <TypeOption
              icon={Building2}
              title={t.importar.propertiesTitle}
              desc={t.importar.propertiesDesc}
              selected={type === "PROPERTIES"}
              onClick={() => {
                setType("PROPERTIES");
                setStep("upload");
              }}
            />
          </div>
        </Card>
      )}

      {step === "upload" && type && (
        <Card className="p-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {type === "CONTACTS"
                  ? t.importar.uploadHeadingContacts
                  : t.importar.uploadHeadingProperties}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.importar.uploadSubtitle}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("type")}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              {t.importar.back}
            </Button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]",
              pending && "opacity-50"
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">
              {pending ? t.importar.processing : t.importar.dropzone}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.importar.dropzoneHint}
            </p>
          </button>

          <div className="mt-6 rounded-lg border bg-muted/20 p-4 text-xs">
            <p className="font-semibold">{t.importar.tipTitle}</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">HubSpot:</strong> Settings → Properties →
                Export → CSV
              </li>
              <li>
                <strong className="text-foreground">Excel:</strong> File → Save As → CSV UTF-8
              </li>
              <li>
                <strong className="text-foreground">Google Sheets:</strong> File → Download →
                CSV
              </li>
            </ul>
          </div>
        </Card>
      )}

      {step === "map" && preview && type && (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-semibold">{filename}</span>
                <Badge variant="outline" className="text-[10px]">
                  {preview.totalRows} {t.importar.rows}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {t.importar.separator} {preview.separator === ";" ? "(;)" : "(,)"}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                {t.importar.changeFile}
              </Button>
            </div>
          </Card>

          <Card className="p-7">
            <h2 className="text-lg font-semibold">{t.importar.mapHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.importar.mapSubtitle}
            </p>

            <div className="mt-5 space-y-2.5">
              {preview.fields.map((f) => {
                const value = mapping[f.key] ?? "__none__";
                const missingRequired =
                  f.required && !mapping[f.key];
                return (
                  <div
                    key={f.key}
                    className={cn(
                      "grid grid-cols-1 items-center gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_1fr]",
                      missingRequired
                        ? "border-rose-500/40 bg-rose-500/5"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="text-sm font-medium">
                      {fieldLabel(t, f.key, f.label)}
                      {f.required && (
                        <span className="ml-1 text-rose-500">*</span>
                      )}
                    </div>
                    <ArrowRight className="hidden h-3 w-3 text-muted-foreground sm:block" />
                    <Select
                      value={value}
                      onValueChange={(v) =>
                        setMapping((m) => {
                          const next = { ...m };
                          if (v === "__none__") delete next[f.key];
                          else next[f.key] = v;
                          return next;
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.importar.unassigned} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t.importar.unassignedItem}</SelectItem>
                        {preview.headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Preview rows */}
          <Card className="overflow-hidden p-0">
            <div className="border-b bg-muted/30 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.importar.previewLabel}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/20">
                  <tr>
                    {preview.headers.map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      {row.map((cell, j) => (
                        <td key={j} className="max-w-[160px] truncate px-3 py-2">
                          {cell || <span className="text-muted-foreground/40">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              {t.importar.readyToImportBefore}{" "}
              <span className="font-mono font-semibold text-foreground">
                {preview.totalRows}
              </span>{" "}
              {t.importar.readyToImportAfter}
            </p>
            <Button onClick={commit} disabled={pending} size="lg">
              {pending ? t.importar.importing : t.importar.importNow}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {step === "done" && result && type && (
        <Card className="p-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <h2 className="text-2xl font-semibold">{t.importar.doneHeading}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.importar.doneImported.replace("{n}", String(result.imported))}
            {result.skipped > 0 &&
              ` · ${t.importar.doneSkipped.replace("{n}", String(result.skipped))}`}
            {result.errors.length > 0 &&
              ` · ${t.importar.doneErrors.replace("{n}", String(result.errors.length))}`}
          </p>

          {result.errors.length > 0 && (
            <div className="mx-auto mt-5 max-w-md rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left text-xs">
              <p className="font-semibold text-amber-600">
                {t.importar.errorsTitle}
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    <span className="font-mono">{t.importar.rowLabel} {e.row}</span>:{" "}
                    {e.reason.slice(0, 80)}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li className="italic">
                    {t.importar.moreErrors.replace("{n}", String(result.errors.length - 5))}
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep("type");
                setType(null);
                setCsvText("");
                setPreview(null);
                setMapping({});
                setResult(null);
              }}
            >
              {t.importar.importAnother}
            </Button>
            <Button
              onClick={() =>
                router.push(type === "CONTACTS" ? "/contactos" : "/propiedades")
              }
            >
              {type === "CONTACTS" ? t.importar.viewContacts : t.importar.viewProperties}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function StepDot({
  active,
  done,
  n,
  label,
}: {
  active: boolean;
  done: boolean;
  n: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
      </div>
      <span
        className={cn(
          "hidden text-xs font-medium sm:inline",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function StepLine() {
  return <div className="h-px flex-1 bg-border" />;
}

// Traduce las etiquetas de campo del CSV (definidas en import-schema) usando
// el namespace `importar`. Cae al label original (español) si no hay clave.
function fieldLabel(
  t: ReturnType<typeof useT>["t"],
  key: string,
  fallback: string
): string {
  const dict = t.importar as Record<string, string>;
  return dict[`field_${key}`] ?? fallback;
}

function TypeOption({
  icon: Icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group rounded-xl border-2 p-5 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03]"
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </button>
  );
}
