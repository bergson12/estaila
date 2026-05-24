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
        <StepDot active={step === "type"} done={step !== "type"} n={1} label="Tipo" />
        <StepLine />
        <StepDot
          active={step === "upload"}
          done={step === "map" || step === "done"}
          n={2}
          label="Subir archivo"
        />
        <StepLine />
        <StepDot
          active={step === "map"}
          done={step === "done"}
          n={3}
          label="Mapear columnas"
        />
        <StepLine />
        <StepDot active={step === "done"} done={false} n={4} label="Resultado" />
      </div>

      {step === "type" && (
        <Card className="p-7">
          <h2 className="text-lg font-semibold">¿Qué quieres importar?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Soporta CSV (UTF-8), Excel exportado como CSV. Comma o semicolon auto-detectado.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TypeOption
              icon={Users}
              title="Contactos"
              desc="Clientes, propietarios, inquilinos, colegas. Compatible con HubSpot, Sherlock, Excel."
              selected={type === "CONTACTS"}
              onClick={() => {
                setType("CONTACTS");
                setStep("upload");
              }}
            />
            <TypeOption
              icon={Building2}
              title="Propiedades"
              desc="Listings con precio, habitaciones, baños, ubicación. Categorización automática."
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
                Sube el archivo CSV de{" "}
                {type === "CONTACTS" ? "contactos" : "propiedades"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Drag & drop o click para seleccionar.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("type")}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Atrás
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
              {pending ? "Procesando…" : "Arrastra tu CSV aquí o click para seleccionar"}
            </p>
            <p className="text-xs text-muted-foreground">
              CSV, máximo ~10MB · comma o semicolon · UTF-8
            </p>
          </button>

          <div className="mt-6 rounded-lg border bg-muted/20 p-4 text-xs">
            <p className="font-semibold">💡 Tip — Si exportas desde:</p>
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
                  {preview.totalRows} filas
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  separator {preview.separator === ";" ? "(;)" : "(,)"}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Cambiar archivo
              </Button>
            </div>
          </Card>

          <Card className="p-7">
            <h2 className="text-lg font-semibold">Mapea las columnas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Asociamos automáticamente las columnas detectadas. Ajusta si algo no calza.
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
                      {f.label}
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
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Sin asignar —</SelectItem>
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
                Preview · primeras 8 filas
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
              Listo para importar{" "}
              <span className="font-mono font-semibold text-foreground">
                {preview.totalRows}
              </span>{" "}
              filas
            </p>
            <Button onClick={commit} disabled={pending} size="lg">
              {pending ? "Importando…" : "Importar ahora"}
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
          <h2 className="text-2xl font-semibold">Importación completada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.imported} registros importados
            {result.skipped > 0 && ` · ${result.skipped} omitidos (vacíos)`}
            {result.errors.length > 0 && ` · ${result.errors.length} errores`}
          </p>

          {result.errors.length > 0 && (
            <div className="mx-auto mt-5 max-w-md rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left text-xs">
              <p className="font-semibold text-amber-600">
                Errores en algunas filas:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    <span className="font-mono">Fila {e.row}</span>:{" "}
                    {e.reason.slice(0, 80)}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li className="italic">
                    + {result.errors.length - 5} errores más
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
              Importar otro archivo
            </Button>
            <Button
              onClick={() =>
                router.push(type === "CONTACTS" ? "/contactos" : "/propiedades")
              }
            >
              Ver {type === "CONTACTS" ? "contactos" : "propiedades"}
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
